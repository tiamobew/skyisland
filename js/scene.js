/* =========================================================
   scene.js
   สร้างฉาก 3D หลัก: ท้องฟ้าไล่สี, เมฆลอย, เกาะลอยฟ้า, ทะเลเคลื่อนไหว,
   ต้นไม้โยกลม, เงา (shadow) เพื่อให้ฉากดูสมจริงขึ้น
   ========================================================= */

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xbfe3f0, 0.009);

const sceneContainer = document.getElementById('scene-container');

const camera = new THREE.PerspectiveCamera(
  52, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000
);
camera.position.set(0, 22, 34);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneContainer.appendChild(renderer.domElement);

// ---------- ท้องฟ้าไล่สี (วาดด้วย canvas แล้วใช้เป็น background) ----------
function makeSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#3E8FD0');
  grad.addColorStop(0.55, '#8FD3E8');
  grad.addColorStop(1, '#E9F7F3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
scene.background = makeSkyTexture();

// ---------- แสง ----------
scene.add(new THREE.HemisphereLight(0xbfe3f0, 0x4caf6d, 0.55));
scene.add(new THREE.AmbientLight(0xffffff, 0.35));

const sun = new THREE.DirectionalLight(0xfff2d0, 1.4);
sun.position.set(14, 26, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 80;
sun.shadow.bias = -0.0015;
scene.add(sun);

// ---------- เมฆลอยเบา ๆ ----------
const clouds = [];
function makeCloud(x, y, z, scale) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.9 });
  const puffPositions = [[0,0,0],[0.7,0.1,0],[-0.7,0.05,0],[0.3,0.3,0.3],[-0.3,0.25,-0.2]];
  puffPositions.forEach(([px, py, pz]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), mat);
    puff.position.set(px, py, pz);
    group.add(puff);
  });
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  scene.add(group);
  clouds.push({ group, speed: 0.15 + Math.random() * 0.15, startX: x });
}
for (let i = 0; i < 6; i++) {
  makeCloud((Math.random() - 0.5) * 70, 14 + Math.random() * 8, (Math.random() - 0.5) * 70, 1.5 + Math.random() * 1.5);
}
function animateClouds(t) {
  clouds.forEach(c => {
    c.group.position.x = c.startX + Math.sin(t * 0.05 + c.startX) * 6 + t * c.speed;
    if (c.group.position.x > 45) c.group.position.x = -45;
  });
}

// ---------- เกาะลอยฟ้า ----------
const islandGroup = new THREE.Group();
scene.add(islandGroup);

function buildIsland() {
  const rockGeo = new THREE.CylinderGeometry(15, 5.5, 6, 10, 3);
  const rockColors = [];
  const posAttr = rockGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const yRatio = (posAttr.getY(i) + 3) / 6;
    const dark = new THREE.Color(0x5a4331);
    const light = new THREE.Color(0x9c7a55);
    const c = dark.clone().lerp(light, yRatio);
    rockColors.push(c.r, c.g, c.b);
  }
  rockGeo.setAttribute('color', new THREE.Float32BufferAttribute(rockColors, 3));
  const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.y = -3;
  rock.castShadow = true;
  rock.receiveShadow = true;
  islandGroup.add(rock);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const drip = new THREE.Mesh(
      new THREE.ConeGeometry(0.5 + Math.random() * 0.4, 1.5 + Math.random(), 6),
      new THREE.MeshStandardMaterial({ color: 0x5a4331, roughness: 1 })
    );
    drip.position.set(Math.cos(angle) * 4, -6.2, Math.sin(angle) * 4);
    drip.rotation.x = Math.PI;
    drip.castShadow = true;
    islandGroup.add(drip);
  }

  const grassGeo = new THREE.CylinderGeometry(15.3, 15, 0.6, 10);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x4caf6d, roughness: 0.9 });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.position.y = 0;
  grass.receiveShadow = true;
  islandGroup.add(grass);

  const sandGeo = new THREE.TorusGeometry(15.4, 0.5, 8, 40);
  sandGeo.rotateX(Math.PI / 2);
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xe9d8a6, roughness: 1 });
  const sand = new THREE.Mesh(sandGeo, sandMat);
  sand.position.y = -0.1;
  islandGroup.add(sand);

  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 13 + Math.random() * 2;
    const rock2 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3),
      new THREE.MeshStandardMaterial({ color: 0x7d7d7d, roughness: 0.9 })
    );
    rock2.position.set(Math.cos(angle) * r, 0.3, Math.sin(angle) * r);
    rock2.rotation.set(Math.random(), Math.random(), Math.random());
    rock2.castShadow = true;
    rock2.receiveShadow = true;
    islandGroup.add(rock2);
  }
}
buildIsland();

function animateIsland(t) {
  islandGroup.position.y = Math.sin(t * 0.6) * 0.4;
}

// ---------- ทะเล ----------
const waterSize = 140;
const waterSegments = 50;
const waterGeo = new THREE.PlaneGeometry(waterSize, waterSize, waterSegments, waterSegments);
waterGeo.rotateX(-Math.PI / 2);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x2f9fc9, transparent: true, opacity: 0.88, roughness: 0.15, metalness: 0.25
});
const water = new THREE.Mesh(waterGeo, waterMat);
water.position.y = -22;
water.receiveShadow = true;
scene.add(water);

const waterPos = waterGeo.attributes.position;

function animateWater(t) {
  for (let i = 0; i < waterPos.count; i++) {
    const x = waterPos.getX(i);
    const z = waterPos.getZ(i);
    const y = Math.sin(x * 0.25 + t) * 0.5 + Math.cos(z * 0.25 + t * 0.8) * 0.5;
    waterPos.setY(i, y);
  }
  waterPos.needsUpdate = true;
  waterGeo.computeVertexNormals();
}

// ---------- ต้นไม้ ----------
const trees = [];

function makeTree(x, z, scale = 1) {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.7, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2b, roughness: 1 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.85;
  trunk.castShadow = true;
  group.add(trunk);

  const leafColors = [0x2f9e58, 0x3bb56a];
  [0, 1].forEach(layer => {
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(0.95 - layer * 0.25, 1.5 - layer * 0.3, 8),
      new THREE.MeshStandardMaterial({ color: leafColors[layer], roughness: 0.85 })
    );
    leaves.position.y = 1.9 + layer * 1.1;
    leaves.castShadow = true;
    group.add(leaves);
  });

  group.position.set(x, 0.3, z);
  group.scale.setScalar(scale);
  islandGroup.add(group);

  trees.push({ group, phase: Math.random() * Math.PI * 2 });
}

function scatterTrees() {
  const ring = 12;
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * ring + (Math.random() - 0.5) * 2;
    const z = Math.sin(angle) * ring + (Math.random() - 0.5) * 2;
    makeTree(x, z, 0.8 + Math.random() * 0.5);
  }
}
scatterTrees();

function animateTrees(t) {
  trees.forEach(({ group, phase }) => {
    group.rotation.z = Math.sin(t * 1.2 + phase) * 0.06;
    group.rotation.x = Math.cos(t * 0.9 + phase) * 0.04;
  });
}

// ---------- ปลาว่ายน้ำในทะเล ----------
const fishSchool = [];
const FISH_COLORS = [0xFF8A65, 0xFFC94C, 0x4FC3F7, 0xF472B6, 0xA3E635];

function makeFish(color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });

  // ลำตัว: ทรงกรวยแบนวางนอน หันจมูกไปทาง +X
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 8), mat);
  body.rotation.z = -Math.PI / 2;
  body.scale.set(1, 1, 0.55);
  group.add(body);

  // หางรูปสามเหลี่ยมแบนด้านหลัง
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.45, 4), mat);
  tail.rotation.z = Math.PI / 2;
  tail.scale.set(1, 1, 0.3);
  tail.position.x = -0.75;
  group.add(tail);

  return group;
}

function scatterFish(count = 9) {
  for (let i = 0; i < count; i++) {
    const color = FISH_COLORS[i % FISH_COLORS.length];
    const group = makeFish(color);
    scene.add(group);
    fishSchool.push({
      group,
      radius: 8 + Math.random() * 22,
      speed: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      depth: -21.5 + Math.random() * 2, // ว่ายใต้ผิวน้ำเล็กน้อย (ผิวน้ำอยู่ที่ y=-22 โดยประมาณ)
      centerX: (Math.random() - 0.5) * 10,
      centerZ: (Math.random() - 0.5) * 10,
      dir: Math.random() < 0.5 ? 1 : -1
    });
  }
}
scatterFish();

function animateFish(t) {
  fishSchool.forEach(f => {
    const angle = t * f.speed * f.dir + f.phase;
    const x = f.centerX + Math.cos(angle) * f.radius;
    const z = f.centerZ + Math.sin(angle) * f.radius;
    const y = f.depth + Math.sin(t * 2 + f.phase) * 0.25;
    f.group.position.set(x, y, z);
    // หันหน้าปลาไปตามทิศทางการว่าย (สัมผัสของวงกลม)
    f.group.rotation.y = -angle - (Math.PI / 2) * f.dir;
    f.group.rotation.z = Math.sin(t * 4 + f.phase) * 0.08; // แกว่งลำตัวเบา ๆ ตอนว่าย
  });
}

// ---------- ปรับขนาดตามหน้าจอ (อิงจากขนาดฝั่งภาพ 3D เท่านั้น) ----------
window.addEventListener('resize', () => {
  camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
});
