/* =========================================================
   path.js
   สร้างเส้นทางเดินแบบ "บันไดงู" (ซิกแซกไปเรื่อย ๆ) บนเกาะ
   พร้อมป้ายเลขช่องสีสันสดใสลอยอยู่เหนือแต่ละช่อง
   tilePositions[i] = ตำแหน่ง 3D ของช่องที่ i (เริ่มนับจาก 0)
   ========================================================= */

const ROWS = 5;
const COLS = 8;
const TILE_SPACING = 2.75;
const TOTAL_TILES = ROWS * COLS; // 40 ช่อง

// เลขช่องในโค้ดเริ่มจาก 0 (ช่องที่ผู้เล่นเห็น = index + 1)
// ทางลัดพาขึ้นไปข้างหน้า ส่วนกับดักพาถอยกลับเหมือนบันไดงู
const SPECIAL_TILES = Object.freeze({
  3:  { to: 10, type: 'shortcut' }, // 4  -> 11
  14: { to: 23, type: 'shortcut' }, // 15 -> 24
  21: { to: 30, type: 'shortcut' }, // 22 -> 31
  12: { to: 6,  type: 'trap' },     // 13 -> 7
  28: { to: 17, type: 'trap' },     // 29 -> 18
  36: { to: 25, type: 'trap' }      // 37 -> 26
});

const tilePositions = [];
const tileMeshes = [];

// จานสีสดใสสำหรับป้ายเลขประจำช่อง (วนซ้ำไปเรื่อย ๆ)
const TILE_NUMBER_COLORS = ['#E4694C', '#3EC6A0', '#FFC94C', '#8B7FE8', '#4FC3F7', '#FF8A65', '#F472B6', '#A3E635'];

// วาดป้ายวงกลมสีพร้อมตัวเลขบนผิว canvas แล้วแปลงเป็น texture
function makeTileNumberTexture(number, bgColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);

  ctx.beginPath();
  ctx.arc(64, 64, 46, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Kanit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(number), 64, 68);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addCylinderBetween(start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 8),
    material
  );
  cylinder.position.copy(start).add(end).multiplyScalar(0.5);
  cylinder.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );
  cylinder.castShadow = true;
  islandGroup.add(cylinder);
}

function buildShortcut(startIndex, endIndex) {
  const start = tilePositions[startIndex].clone();
  const end = tilePositions[endIndex].clone();
  start.y = end.y = 0.72;

  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  const side = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(0.24);
  const material = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.55 });

  addCylinderBetween(start.clone().add(side), end.clone().add(side), 0.07, material);
  addCylinderBetween(start.clone().sub(side), end.clone().sub(side), 0.07, material);

  const distance = start.distanceTo(end);
  const rungCount = Math.max(4, Math.floor(distance / 0.75));
  for (let i = 0; i <= rungCount; i++) {
    const point = start.clone().lerp(end, i / rungCount);
    addCylinderBetween(point.clone().add(side), point.clone().sub(side), 0.045, material);
  }
}

function buildTrap(startIndex, endIndex) {
  const start = tilePositions[startIndex].clone();
  const end = tilePositions[endIndex].clone();
  const middle = start.clone().lerp(end, 0.5);
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  const side = new THREE.Vector3(-direction.z, 0, direction.x);

  start.y = end.y = 0.76;
  middle.y = 0.95;
  middle.add(side.multiplyScalar(1.1));

  const curve = new THREE.CatmullRomCurve3([start, middle, end]);
  const snake = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 28, 0.13, 8, false),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 })
  );
  snake.castShadow = true;
  islandGroup.add(snake);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 })
  );
  head.position.copy(start).setY(0.8);
  head.scale.set(1.25, 0.75, 1);
  head.castShadow = true;
  islandGroup.add(head);
}

function buildSpecialTileLinks() {
  Object.entries(SPECIAL_TILES).forEach(([from, special]) => {
    const startIndex = Number(from);
    if (special.type === 'shortcut') buildShortcut(startIndex, special.to);
    else buildTrap(startIndex, special.to);
  });
}

function buildPath() {
  const offsetX = ((COLS - 1) * TILE_SPACING) / 2;
  const offsetZ = ((ROWS - 1) * TILE_SPACING) / 2;

  for (let row = 0; row < ROWS; row++) {
    const isReversed = row % 2 === 1;
    for (let col = 0; col < COLS; col++) {
      const effectiveCol = isReversed ? (COLS - 1 - col) : col;
      const x = effectiveCol * TILE_SPACING - offsetX;
      const z = row * TILE_SPACING - offsetZ;
      tilePositions.push(new THREE.Vector3(x, 0.35, z));
    }
  }

  tilePositions.forEach((pos, i) => {
    const tileGeo = new THREE.BoxGeometry(2.05, 0.15, 2.05);
    const isLast = i === TOTAL_TILES - 1;
    const special = SPECIAL_TILES[i];
    const tileMat = new THREE.MeshStandardMaterial({
      color: isLast
        ? 0xFFE49C
        : special
          ? (special.type === 'shortcut' ? 0x86efac : 0xfca5a5)
          : (i % 2 === 0 ? 0xE9D8A6 : 0xDCC488)
    });
    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.position.copy(pos);
    tile.receiveShadow = true;
    islandGroup.add(tile);
    tileMeshes.push(tile);

    // ป้ายเลขช่องสีสัน ลอยแบนอยู่เหนือผิวช่องเล็กน้อย
    const color = TILE_NUMBER_COLORS[i % TILE_NUMBER_COLORS.length];
    const labelTex = makeTileNumberTexture(i + 1, color);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), labelMat);
    label.rotation.x = -Math.PI / 2;
    label.position.set(pos.x, pos.y + 0.09, pos.z);
    islandGroup.add(label);
  });

  const lineGeo = new THREE.BufferGeometry().setFromPoints(
    tilePositions.map(p => new THREE.Vector3(p.x, p.y + 0.1, p.z))
  );
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
  islandGroup.add(new THREE.Line(lineGeo, lineMat));

  buildSpecialTileLinks();
}
buildPath();
