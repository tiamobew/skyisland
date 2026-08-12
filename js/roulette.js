/* =========================================================
   roulette.js
   วงล้อกล่องลึกลับ มีผลลัพธ์เดินหน้า/ถอยหลัง 1–5 ช่อง
   ทั้ง 10 ผลลัพธ์มีโอกาสถูกสุ่มเท่ากัน
   ========================================================= */

const ROULETTE_OUTCOMES = Object.freeze([1, -1, 2, -2, 3, -3, 4, -4, 5, -5]);

function randomRouletteMove() {
  return ROULETTE_OUTCOMES[Math.floor(Math.random() * ROULETTE_OUTCOMES.length)];
}

function spinRoulette(move, onComplete) {
  const overlay = document.getElementById('roulette-overlay');
  const wheel = document.getElementById('roulette-wheel');
  const result = document.getElementById('roulette-result');
  const targetIndex = ROULETTE_OUTCOMES.indexOf(move);
  const targetAngle = targetIndex * 36 + 18;

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
    const isForward = move > 0;
    result.textContent = isForward
      ? `เดินหน้า ${move} ช่อง!`
      : `ถอยหลัง ${Math.abs(move)} ช่อง!`;
    result.className = isForward ? 'forward' : 'backward';

    setTimeout(() => {
      overlay.classList.add('hidden');
      onComplete && onComplete();
    }, 900);
  }, 2300);
}
