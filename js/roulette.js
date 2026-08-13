/* =========================================================
   roulette.js
   วงล้อกล่องลึกลับ มีผลลัพธ์เดินหน้า 1–4 ช่อง
   ทั้ง 4 ผลลัพธ์มีโอกาสถูกสุ่มเท่ากัน
   ========================================================= */

const ROULETTE_OUTCOMES = Object.freeze([1, 2, 3, 4]);

function randomRouletteMove() {
  return ROULETTE_OUTCOMES[Math.floor(Math.random() * ROULETTE_OUTCOMES.length)];
}

function showMysteryCelebration(tileNumber, onSpin) {
  const overlay = document.getElementById('mystery-celebration');
  const message = document.getElementById('mystery-celebration-message');
  const button = document.getElementById('luck-spin-btn');
  message.textContent = `พบกล่องลึกลับที่ช่อง ${tileNumber}!`;
  overlay.classList.remove('hidden');
  playMysteryRainbowSound();

  button.onclick = () => {
    button.onclick = null;
    overlay.classList.add('hidden');
    onSpin && onSpin();
  };
  requestAnimationFrame(() => button.focus());
}

function spinRoulette(move, onComplete) {
  const overlay = document.getElementById('roulette-overlay');
  const wheel = document.getElementById('roulette-wheel');
  const result = document.getElementById('roulette-result');
  const targetIndex = ROULETTE_OUTCOMES.indexOf(move);
  const targetAngle = targetIndex * 90 + 45;

  result.textContent = 'กำลังหมุน...';
  result.className = '';
  overlay.classList.remove('hidden');

  wheel.style.transition = 'none';
  wheel.style.transform = 'rotate(0deg)';
  void wheel.offsetWidth;
  wheel.style.transition = '';

  requestAnimationFrame(() => {
    wheel.style.transform = `rotate(${5 * 360 - targetAngle}deg)`;
  });

  setTimeout(() => {
    result.textContent = `เดินหน้า ${move} ช่อง!`;
    result.className = 'forward';

    setTimeout(() => {
      overlay.classList.add('hidden');
      onComplete && onComplete();
    }, 900);
  }, 2300);
}
