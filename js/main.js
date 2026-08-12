/* =========================================================
   main.js
   จุดเริ่มต้นของเกม: เลือกด่าน -> เวลา -> จำนวนผู้เล่น -> ตั้งชื่อ -> เริ่มเกม
   ผูกปุ่มเล่นใหม่ และรันลูปแอนิเมชันหลัก (เกาะลอย, ทะเล, ต้นไม้, เมฆ, ตัวละคร)
   ========================================================= */

let selectedLevel = null;
let selectedTime = null;
let timeStepDone = false;
let selectedPlayerCount = null;

// ---------- ขั้นที่ 1: ปุ่มเลือกด่าน ----------
const levelContainer = document.getElementById('level-buttons');
Object.keys(LEVEL_CONFIG).forEach(levelKey => {
  const btn = document.createElement('button');
  btn.textContent = LEVEL_CONFIG[levelKey].label;
  btn.dataset.level = levelKey;
  btn.addEventListener('click', () => {
    selectedLevel = levelKey;
    levelContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('time-section').classList.remove('hidden');
    startBackgroundMusic(); // เริ่มเล่นเพลงหลังผู้ใช้คลิกครั้งแรก (นโยบายเบราว์เซอร์)
  });
  levelContainer.appendChild(btn);
});

// ---------- ขั้นที่ 2: เลือกกำหนดเวลาเอง หรือไม่จำกัดเวลา ----------
const timeContainer = document.getElementById('time-buttons');

function selectTime(seconds, sourceBtn) {
  selectedTime = seconds; // null = ไม่จำกัดเวลา
  timeStepDone = true;
  timeContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
  document.getElementById('custom-time-row').classList.remove('selected-row');
  if (sourceBtn) sourceBtn.classList.add('selected');
  else document.getElementById('custom-time-row').classList.add('selected-row');
  document.getElementById('player-count-section').classList.remove('hidden');
}

const unlimitedBtn = document.createElement('button');
unlimitedBtn.textContent = '∞ ไม่จำกัดเวลา';
unlimitedBtn.addEventListener('click', () => selectTime(null, unlimitedBtn));
timeContainer.appendChild(unlimitedBtn);

document.getElementById('custom-time-btn').addEventListener('click', () => {
  const input = document.getElementById('custom-time-input');
  const val = parseInt(input.value, 10);
  if (!val || val < 5 || val > 180) {
    input.focus();
    return;
  }
  selectTime(val, null);
});

// ---------- ขั้นที่ 3: ปุ่มเลือกจำนวนผู้เล่น ----------
const playerCountContainer = document.getElementById('player-count-buttons');
[2, 3, 4].forEach(count => {
  const btn = document.createElement('button');
  btn.textContent = `${count} คน`;
  btn.addEventListener('click', () => {
    selectedPlayerCount = count;
    playerCountContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    buildNameInputs(count);
    document.getElementById('name-section').classList.remove('hidden');
  });
  playerCountContainer.appendChild(btn);
});

// ---------- ขั้นที่ 4: ตั้งชื่อผู้เล่น ----------
function buildNameInputs(count) {
  const container = document.getElementById('name-inputs');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 12;
    input.placeholder = `ชื่อผู้เล่น ${i + 1}`;
    input.id = `name-input-${i}`;
    container.appendChild(input);
  }
}

document.getElementById('confirm-start-btn').addEventListener('click', () => {
  if (!selectedLevel || !timeStepDone || !selectedPlayerCount) return;
  const names = [];
  for (let i = 0; i < selectedPlayerCount; i++) {
    names.push(document.getElementById(`name-input-${i}`).value);
  }
  startGame(selectedPlayerCount, selectedLevel, selectedTime, names);
});

// ---------- ปุ่มเปิด/ปิดเสียงดนตรี ----------
document.getElementById('mute-btn').addEventListener('click', (e) => {
  const muted = toggleMusicMute();
  e.currentTarget.textContent = muted ? '🔇' : '🔊';
});

// ---------- ปุ่มเล่นอีกครั้ง ----------
document.getElementById('restart-btn').addEventListener('click', () => {
  document.getElementById('win-screen').classList.add('hidden');
  document.getElementById('time-section').classList.add('hidden');
  document.getElementById('player-count-section').classList.add('hidden');
  document.getElementById('name-section').classList.add('hidden');
  levelContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
  timeContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
  document.getElementById('custom-time-row').classList.remove('selected-row');
  document.getElementById('custom-time-input').value = '';
  playerCountContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
  selectedLevel = null;
  selectedTime = null;
  timeStepDone = false;
  selectedPlayerCount = null;
  document.getElementById('start-screen').classList.remove('hidden');
});

// ---------- ลูปแอนิเมชันหลัก ----------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  animateIsland(t);
  animateWater(t);
  animateTrees(t);
  animateClouds(t);
  animateFish(t);
  if (players.length) animateCharacters(t);

  renderer.render(scene, camera);
}
animate();
