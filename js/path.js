/* =========================================================
   path.js
   สร้างเส้นทางเดินซิกแซก พร้อมกล่องลึกลับแบบสุ่มบนเกาะ
   พร้อมป้ายเลขช่องสีสันสดใสลอยอยู่เหนือแต่ละช่อง
   tilePositions[i] = ตำแหน่ง 3D ของช่องที่ i (เริ่มนับจาก 0)
   ========================================================= */

const ROWS = 5;
const COLS = 8;
const TILE_SPACING = 2.75;
const TOTAL_TILES = ROWS * COLS; // 40 ช่อง

const MYSTERY_BOX_COUNT = 10;
const MYSTERY_BOX_TILES = new Set();
const mysteryBoxes = [];

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

function chooseMysteryBoxTiles() {
  const candidates = Array.from({ length: TOTAL_TILES - 4 }, (_, i) => i + 2);
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  candidates.slice(0, MYSTERY_BOX_COUNT).forEach(index => MYSTERY_BOX_TILES.add(index));
}

function makeQuestionMarkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 96px Sarabun, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 64, 68);
  return new THREE.CanvasTexture(canvas);
}

function buildMysteryBox(tileIndex) {
  const pos = tilePositions[tileIndex];
  const group = new THREE.Group();
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.42 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc94c, roughness: 0.35 });

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.58, 0.72), boxMat);
  box.castShadow = true;
  group.add(box);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.14, 0.82), goldMat);
  lid.position.y = 0.36;
  lid.castShadow = true;
  group.add(lid);

  const ribbonX = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.76), goldMat);
  const ribbonZ = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.62, 0.14), goldMat);
  ribbonX.castShadow = ribbonZ.castShadow = true;
  group.add(ribbonX, ribbonZ);

  const mark = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeQuestionMarkTexture(), transparent: true, depthTest: false
  }));
  mark.position.set(0, 0.02, 0.39);
  mark.scale.set(0.42, 0.42, 0.42);
  group.add(mark);

  // วางก้นกล่องให้แตะผิวช่องพอดี (ผิวช่องสูงจากจุดกึ่งกลางประมาณ 0.075)
  group.position.set(pos.x, pos.y + 0.39, pos.z);
  group.userData.baseY = group.position.y;
  group.userData.phase = Math.random() * Math.PI * 2;
  islandGroup.add(group);
  mysteryBoxes.push(group);
}

function animateMysteryBoxes(t) {
  mysteryBoxes.forEach(box => {
    box.position.y = box.userData.baseY;
    box.rotation.y = Math.sin(t * 0.9 + box.userData.phase) * 0.12;
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

  chooseMysteryBoxTiles();

  tilePositions.forEach((pos, i) => {
    const tileGeo = new THREE.BoxGeometry(2.05, 0.15, 2.05);
    const isLast = i === TOTAL_TILES - 1;
    const hasMysteryBox = MYSTERY_BOX_TILES.has(i);
    const tileMat = new THREE.MeshStandardMaterial({
      color: isLast
        ? 0xFFE49C
        : hasMysteryBox
          ? 0xd8b4fe
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

    if (hasMysteryBox) buildMysteryBox(i);
  });

  const lineGeo = new THREE.BufferGeometry().setFromPoints(
    tilePositions.map(p => new THREE.Vector3(p.x, p.y + 0.1, p.z))
  );
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
  islandGroup.add(new THREE.Line(lineGeo, lineMat));

}
buildPath();
