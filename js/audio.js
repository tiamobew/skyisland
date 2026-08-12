/* =========================================================
   audio.js
   เสียงดนตรีประกอบตลอดเกม สร้างด้วย Web Audio API โดยตรง
   (ไม่ต้องพึ่งไฟล์เสียงภายนอก จึงเปิดเล่นได้ทันทีแม้ไม่มีอินเทอร์เน็ต)
   เบราว์เซอร์กำหนดให้เสียงต้องเริ่มเล่นหลังผู้ใช้มีปฏิสัมพันธ์ก่อน
   (เช่นคลิกปุ่ม) จึงต้องเรียก startBackgroundMusic() ตอนคลิกปุ่มเลือกด่าน
   ========================================================= */

let audioCtx = null;
let masterGain = null;
let musicIntervalId = null;
let musicNoteIndex = 0;
let musicMuted = false;

// ทำนองสั้น ๆ วนซ้ำ โทนสดใสร่าเริงแบบเกมผจญภัย (โน้ตหน่วยเป็นความถี่ Hz)
const MELODY = [
  523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440.00,
  493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 440.00
];
const NOTE_DURATION = 0.3; // วินาทีต่อโน้ต

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.14; // เบา ๆ ไม่กลบเสียงเอฟเฟกต์อื่น
  masterGain.connect(audioCtx.destination);
}

function playNote(freq, startTime, duration) {
  const osc = audioCtx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;

  const noteGain = audioCtx.createGain();
  noteGain.gain.setValueAtTime(0, startTime);
  noteGain.gain.linearRampToValueAtTime(0.7, startTime + 0.02);
  noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(noteGain);
  noteGain.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function startBackgroundMusic() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (musicIntervalId) return; // เล่นอยู่แล้ว ไม่ต้องเริ่มซ้ำ

  musicIntervalId = setInterval(() => {
    if (musicMuted) return;
    const freq = MELODY[musicNoteIndex % MELODY.length];
    playNote(freq, audioCtx.currentTime, NOTE_DURATION * 0.9);
    musicNoteIndex++;
  }, NOTE_DURATION * 1000);
}

function toggleMusicMute() {
  musicMuted = !musicMuted;
  if (masterGain) masterGain.gain.value = musicMuted ? 0 : 0.14;
  return musicMuted;
}

// ---------- เสียงเอฟเฟกต์ตอบถูก / ตอบผิด ----------
function playCorrectSound() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  playNote(784, now, 0.14);        // โน้ตสูงสดใส ก้าวขึ้น
  playNote(1046.5, now + 0.12, 0.22);
}

function playWrongSound() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.35);
}

// ---------- เสียงเอฟเฟกต์พบกล่องลึกลับ / สายรุ้ง ----------
function playMysteryRainbowSound() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (musicMuted) return;
  const now = audioCtx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    playNote(frequency, now + index * 0.1, 0.28);
  });
}
