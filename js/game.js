/* =========================================================
   game.js
   ตรรกะเกม: ด่าน/ระดับ, เวลาที่เลือกเอง, ผู้เล่น (ตั้งชื่อได้), ตาเดิน,
   เวลานับถอยหลัง, การตอบคำถาม, คำใบ้ (แลกด้วยแต้ม), การเดินหมาก, เงื่อนไขชนะ
   กติกา: ตอบถูก -> เสียงแฟนแฟร์ + คะแนน + ทอยลูกเต๋าแล้วเดินหน้า
          ตอบผิด/หมดเวลา -> เสียงผิด + หยุดเดิน 1 ตา แล้วเปลี่ยนตาให้คนถัดไป
   ========================================================= */

const PLAYER_COLORS = ['#E4694C', '#3EC6A0', '#FFE49C', '#8B7FE8'];

let players = [];
let currentPlayerIndex = 0;
let currentQuestion = null;
let currentStage = 'decimal';
let currentDifficulty = 'easy';
let currentTimeLimit = 15;
let hintUsedThisQuestion = false;

let timerInterval = null;
let timerTimeout = null;
let questionStartTime = null;

const CHAR_SCALE = 1.9;      // ขนาดตัวละครที่มองเห็นได้ชัดขึ้นบนกระดาน
const BASE_POINTS = 50;      // คะแนนพื้นฐานเมื่อตอบถูก
const MAX_SPEED_BONUS = 50;  // คะแนนโบนัสสูงสุดเมื่อตอบไวมาก
const HINT_COST = 20;        // แต้มที่ใช้แลกคำใบ้ 1 ครั้ง

function clearPlayerPawns() {
  players.forEach(player => {
    const group = player.characterGroup;
    if (!group) return;
    islandGroup.remove(group);
    group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.filter(Boolean).forEach(material => material.dispose());
    });
  });
  players = [];
  if (turnIndicatorMesh) turnIndicatorMesh.visible = false;
}

// ---------- ตั้งค่าผู้เล่น (รับชื่อที่ผู้เล่นตั้งเองได้) ----------
function createPlayers(count, names) {
  clearPlayerPawns();
  for (let i = 0; i < count; i++) {
    const customName = (names && names[i] && names[i].trim()) ? names[i].trim() : `ผู้เล่น ${i + 1}`;
    players.push({
      name: customName,
      color: PLAYER_COLORS[i],
      position: 0,
      score: 0,
      characterGroup: null
    });
  }
}

// ---------- ตัวละครน่ารัก: ลำตัวกลม + ตาโต + แก้มแดง ----------
function makeCuteCharacter(colorHex) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 16), bodyMat);
  body.scale.set(1, 0.9, 1);
  body.castShadow = true;
  body.position.y = 0.55;
  group.add(body);

  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xff9aa2, roughness: 1 });
  [-1, 1].forEach(side => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), cheekMat);
    cheek.position.set(side * 0.32, 0.48, 0.46);
    group.add(cheek);
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x22252b });
  [-1, 1].forEach(side => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), eyeWhiteMat);
    eyeWhite.position.set(side * 0.22, 0.62, 0.48);
    group.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), pupilMat);
    pupil.position.set(side * 0.22, 0.62, 0.58);
    group.add(pupil);
  });

  const footMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.7 });
  [-1, 1].forEach(side => {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), footMat);
    foot.scale.set(1, 0.6, 1.2);
    foot.position.set(side * 0.22, 0.08, 0.1);
    foot.castShadow = true;
    group.add(foot);
  });

  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
  const shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), shadowMat);
  shadowBlob.rotation.x = -Math.PI / 2;
  shadowBlob.position.y = 0.02;
  group.add(shadowBlob);

  return group;
}

function createPawns() {
  players.forEach((p, i) => {
    const group = makeCuteCharacter(p.color);
    group.scale.setScalar(CHAR_SCALE);
    islandGroup.add(group);
    p.characterGroup = group;
    p.idlePhase = Math.random() * Math.PI * 2;
    updatePawnPosition(i);
  });
}

// ---------- ลูกศรสามเหลี่ยมชี้บอกตาผู้เล่นปัจจุบัน ----------
let turnIndicatorMesh = null;
function createTurnIndicator() {
  const geo = new THREE.ConeGeometry(0.32, 0.6, 3);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xFFE49C, emissive: 0x996f1a, emissiveIntensity: 0.4, roughness: 0.4
  });
  turnIndicatorMesh = new THREE.Mesh(geo, mat);
  turnIndicatorMesh.rotation.x = Math.PI; // หันปลายชี้ลง
  turnIndicatorMesh.visible = false;
  islandGroup.add(turnIndicatorMesh);
}
createTurnIndicator();

function updatePawnPosition(playerIndex) {
  const p = players[playerIndex];
  const basePos = tilePositions[p.position];
  const angle = (playerIndex / players.length) * Math.PI * 2;
  const offsetX = Math.cos(angle) * 0.68;
  const offsetZ = Math.sin(angle) * 0.68;
  p.characterGroup.position.set(basePos.x + offsetX, basePos.y, basePos.z + offsetZ);
}

function animateCharacters(t) {
  players.forEach(p => {
    if (!p.characterGroup) return;
    p.characterGroup.position.y = tilePositions[p.position].y + Math.abs(Math.sin(t * 2 + p.idlePhase)) * 0.06;
    p.characterGroup.rotation.y = Math.sin(t * 0.5 + p.idlePhase) * 0.15;
  });

  const activePlayer = players[currentPlayerIndex];
  if (activePlayer && activePlayer.characterGroup && turnIndicatorMesh) {
    turnIndicatorMesh.visible = true;
    const bobOffset = Math.sin(t * 3) * 0.15;
    turnIndicatorMesh.position.set(
      activePlayer.characterGroup.position.x,
      activePlayer.characterGroup.position.y + 2.55 + bobOffset,
      activePlayer.characterGroup.position.z
    );
    turnIndicatorMesh.rotation.y += 0.05; // หมุนช้า ๆ ให้เด่น
  }
}

// ---------- เดินหมากทีละช่อง (รองรับทั้งเดินหน้าและถอยหลัง) ----------
function movePawnDelta(playerIndex, delta, onComplete) {
  const player = players[playerIndex];
  let remaining = Math.abs(delta);
  const direction = delta >= 0 ? 1 : -1;

  function stepOnce() {
    const nextPosition = player.position + direction;
    if (remaining <= 0 || nextPosition < 0 || nextPosition >= TOTAL_TILES) {
      onComplete && onComplete();
      return;
    }
    player.position = nextPosition;
    updatePawnPosition(playerIndex);
    bouncePawn(player.characterGroup);
    remaining--;
    renderPlayerPanel();
    setTimeout(stepOnce, 280);
  }
  stepOnce();
}

function movePawnSteps(playerIndex, steps, onComplete) {
  movePawnDelta(playerIndex, steps, onComplete);
}

function bouncePawn(group) {
  group.scale.set(CHAR_SCALE, CHAR_SCALE * 1.35, CHAR_SCALE);
  setTimeout(() => group.scale.set(CHAR_SCALE, CHAR_SCALE, CHAR_SCALE), 160);
}

// ---------- กล่องลึกลับและวงล้อดวง ----------
function resolveMysteryBox(playerIndex, onComplete) {
  const player = players[playerIndex];
  if (!MYSTERY_BOX_TILES.has(player.position)) {
    onComplete && onComplete();
    return;
  }

  const messageEl = document.getElementById('round-message');
  messageEl.textContent = `เจอกล่องลึกลับที่ช่อง ${player.position + 1}! กดสุ่มดวงได้เลย 🌈🎁`;

  showMysteryCelebration(player.position + 1, () => {
    const move = randomRouletteMove();
    messageEl.textContent = 'กำลังหมุนวงล้อดวง... 🎡';
    spinRoulette(move, () => {
      const requestedTarget = player.position + move;
      const target = Math.max(0, Math.min(TOTAL_TILES - 1, requestedTarget));
      const actualDelta = target - player.position;
      const isForward = move > 0;

      messageEl.textContent = isForward
        ? `วงล้อได้ +${move}! เดินหน้า ${Math.abs(actualDelta)} ช่อง 🍀`
        : `วงล้อได้ ${move}! ถอยหลัง ${Math.abs(actualDelta)} ช่อง 🌪️`;

      movePawnDelta(playerIndex, actualDelta, () => {
        setTimeout(() => onComplete && onComplete(), 750);
      });
    });
  });
}

// ---------- เวลานับถอยหลัง ----------
function clearQuestionTimer() {
  clearInterval(timerInterval);
  clearTimeout(timerTimeout);
  timerInterval = null;
  timerTimeout = null;
}

function startQuestionTimer(seconds, onTimeUp) {
  clearQuestionTimer();
  let remaining = seconds;

  const barEl = document.getElementById('timer-bar');
  const textEl = document.getElementById('timer-text');

  barEl.style.transition = 'none';
  barEl.style.width = '100%';
  barEl.classList.remove('warning');
  void barEl.offsetWidth;
  barEl.style.transition = '';
  textEl.textContent = remaining;

  requestAnimationFrame(() => {
    barEl.style.width = '0%';
    barEl.style.transitionDuration = `${seconds}s`;
  });

  timerInterval = setInterval(() => {
    remaining--;
    textEl.textContent = Math.max(remaining, 0);
    if (remaining <= Math.ceil(seconds * 0.3)) barEl.classList.add('warning');
    if (remaining <= 0) clearInterval(timerInterval);
  }, 1000);

  timerTimeout = setTimeout(() => {
    clearQuestionTimer();
    onTimeUp();
  }, seconds * 1000);
}

// ---------- คำใบ้ (แลกด้วยแต้ม) ----------
function updateHintButtonState() {
  const hintBtn = document.getElementById('hint-btn');
  const player = players[currentPlayerIndex];
  hintBtn.disabled = hintUsedThisQuestion || !player || player.score < HINT_COST;
}

function handleHintClick() {
  const player = players[currentPlayerIndex];
  if (!player || hintUsedThisQuestion || player.score < HINT_COST) return;

  player.score -= HINT_COST;
  hintUsedThisQuestion = true;
  document.getElementById('hint-text').textContent = `💡 ${currentQuestion.hint}`;
  updateHintButtonState();
  renderPlayerPanel();
}
document.getElementById('hint-btn').addEventListener('click', handleHintClick);

// ---------- จัดการตา ----------
function beginTurn() {
  document.getElementById('round-message').textContent = '';
  renderPlayerPanel();
  askQuestion();
}

function nextTurn() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  beginTurn();
}

function askQuestion() {
  currentQuestion = generateQuestion(currentStage, currentDifficulty);
  document.getElementById('question-text').textContent = currentQuestion.text;

  hintUsedThisQuestion = false;
  document.getElementById('hint-text').textContent = '';
  updateHintButtonState();

  const choicesDiv = document.getElementById('choices');
  choicesDiv.innerHTML = '';
  currentQuestion.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.textContent = choice;
    btn.addEventListener('click', () => handleAnswer(choice, btn));
    choicesDiv.appendChild(btn);
  });

  questionStartTime = performance.now();
  if (currentTimeLimit) {
    startQuestionTimer(currentTimeLimit, handleTimeUp);
  } else {
    showUnlimitedTimer();
  }
}

// แสดงสถานะ "ไม่จำกัดเวลา" แทนแถบนับถอยหลัง
function showUnlimitedTimer() {
  clearQuestionTimer();
  const barEl = document.getElementById('timer-bar');
  const textEl = document.getElementById('timer-text');
  barEl.style.transition = 'none';
  barEl.style.width = '100%';
  barEl.classList.remove('warning');
  textEl.textContent = '∞';
}

function handleTimeUp() {
  playWrongSound();
  const buttons = document.querySelectorAll('#choices button');
  buttons.forEach(b => {
    b.disabled = true;
    if (parseFloat(b.textContent) === currentQuestion.answer) b.classList.add('correct');
  });
  document.getElementById('hint-btn').disabled = true;
  document.getElementById('round-message').textContent =
    `หมดเวลา! คำตอบที่ถูกคือ ${currentQuestion.answer} — หยุดเดิน 1 ตา`;
  setTimeout(nextTurn, 1500);
}

function handleAnswer(selected, btnEl) {
  clearQuestionTimer();
  const buttons = document.querySelectorAll('#choices button');
  buttons.forEach(b => (b.disabled = true));
  document.getElementById('hint-btn').disabled = true;

  const player = players[currentPlayerIndex];
  const isCorrect = selected === currentQuestion.answer;

  if (isCorrect) {
    playCorrectSound();
    btnEl.classList.add('correct');

    const elapsedSec = (performance.now() - questionStartTime) / 1000;
    const speedBonus = currentTimeLimit
      ? Math.round(MAX_SPEED_BONUS * Math.max(0, Math.min(1, (currentTimeLimit - elapsedSec) / currentTimeLimit)))
      : 0;
    const pointsEarned = BASE_POINTS + speedBonus;
    player.score += pointsEarned;

    document.getElementById('round-message').textContent = currentTimeLimit
      ? `ถูกต้อง! +${pointsEarned} คะแนน (โบนัสไว +${speedBonus}) กำลังทอยลูกเต๋า...`
      : `ถูกต้อง! +${pointsEarned} คะแนน กำลังทอยลูกเต๋า...`;
    renderPlayerPanel();

    const steps = randomDiceRoll();
    rollDice(steps, () => {
      document.getElementById('round-message').textContent = `ได้ ${steps} แต้ม! เดินหน้า ${steps} ช่อง`;
      movePawnSteps(currentPlayerIndex, steps, () => {
        resolveMysteryBox(currentPlayerIndex, () => {
          if (player.position >= TOTAL_TILES - 1) {
            showWin(player);
          } else {
            setTimeout(nextTurn, 900);
          }
        });
      });
    });
  } else {
    playWrongSound();
    btnEl.classList.add('wrong');
    buttons.forEach(b => {
      if (parseFloat(b.textContent) === currentQuestion.answer) b.classList.add('correct');
    });
    document.getElementById('round-message').textContent =
      `ไม่ถูกต้อง คำตอบที่ถูกคือ ${currentQuestion.answer} — หยุดเดิน 1 ตา`;
    setTimeout(nextTurn, 1500);
  }
}

// ---------- ธีมสีพื้นหลังคำถามตามผู้เล่นปัจจุบัน ----------
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function applyPlayerTheme(color) {
  const panel = document.getElementById('question-panel');
  const { r, g, b } = hexToRgb(color);
  // ผสมสีผู้เล่นแบบจาง ๆ (30%) ทับพื้นกรมท่าเข้ม ให้ยังอ่านตัวหนังสือสีขาวได้ชัดเจนทุกสี
  panel.style.background = `linear-gradient(135deg, rgba(${r},${g},${b},0.32), rgba(10,24,48,0.94))`;
  panel.style.borderColor = color;
}

// ---------- HUD: กระดานอันดับคะแนน (เรียงจากคะแนนมากไปน้อย) ----------
const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function renderPlayerPanel() {
  const panel = document.getElementById('player-panel');
  panel.innerHTML = '<div class="panel-title">🏆 อันดับคะแนน</div>';

  const ranked = [...players].sort((a, b) => b.score - a.score);

  ranked.forEach((p, rankIdx) => {
    const isActive = p === players[currentPlayerIndex];
    const row = document.createElement('div');
    row.className = 'rank-row' + (isActive ? ' active' : '');
    const rankLabel = RANK_MEDALS[rankIdx] || `${rankIdx + 1}`;
    row.innerHTML = `
      <div class="rank-top">
        <span class="rank-badge">${rankLabel}</span>
        <span class="player-dot" style="background:${p.color}"></span>
        <span class="player-name">${p.name}</span>
        <span class="player-score">${p.score}</span>
      </div>
      <div class="player-pos">ช่อง ${p.position + 1}/${TOTAL_TILES}</div>
    `;
    panel.appendChild(row);
  });

  document.getElementById('turn-indicator').textContent =
    `${STAGE_CONFIG[currentStage].label} · ${DIFFICULTY_CONFIG[currentDifficulty].label} — ตาของ ${players[currentPlayerIndex].name}`;

  applyPlayerTheme(players[currentPlayerIndex].color);
}

// ---------- ชนะเกม ----------
function showWin(player) {
  clearQuestionTimer();
  document.getElementById('win-text').textContent = `${player.name} ถึงเส้นชัยก่อน ชนะ! 🎉`;

  const ranked = [...players].sort((a, b) => b.score - a.score);
  const rankingEl = document.getElementById('final-ranking');
  rankingEl.innerHTML = '<div class="panel-title">🏆 อันดับคะแนนสุดท้าย</div>';
  ranked.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'rank-row';
    const rankLabel = RANK_MEDALS[i] || `${i + 1}`;
    row.innerHTML = `
      <div class="rank-top">
        <span class="rank-badge">${rankLabel}</span>
        <span class="player-dot" style="background:${p.color}"></span>
        <span class="player-name">${p.name}</span>
        <span class="player-score">${p.score}</span>
      </div>`;
    rankingEl.appendChild(row);
  });

  document.getElementById('win-screen').classList.remove('hidden');
}

// ---------- เริ่มเกมใหม่ทั้งหมด ----------
function startGame(playerCount, stage, difficulty, timeLimit, names) {
  currentStage = stage;
  currentDifficulty = difficulty;
  currentTimeLimit = timeLimit;
  createPlayers(playerCount, names);
  createPawns();
  currentPlayerIndex = 0;

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('win-screen').classList.add('hidden');

  beginTurn();
}
