/* =========================================================
   dice.js
   แอนิเมชันลูกเต๋า 3D (สร้างด้วย CSS transform ไม่ใช่ Three.js)
   เรียก rollDice(number, onComplete) เพื่อแสดงลูกเต๋าหมุนสุ่ม
   แล้วหยุดที่หน้าตัวเลขที่ต้องการ (number ถูกสุ่มไว้ล่วงหน้าแล้วใน game.js)
   ========================================================= */

// มุมหมุนของลูกบาศก์ (ทั้งก้อน) ที่ทำให้แต่ละหน้าหันเข้าหาผู้เล่นพอดี
const DICE_TARGET_ROTATION = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: 90, y: 0 },
  4: { x: -90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 }
};

const DICE_MIN = 1;
const DICE_MAX = 3;

function randomDiceRoll() {
  return Math.floor(Math.random() * (DICE_MAX - DICE_MIN + 1)) + DICE_MIN;
}

function rollDice(number, onComplete) {
  const overlay = document.getElementById('dice-overlay');
  const cube = document.getElementById('dice-cube');
  overlay.classList.remove('hidden');

  // ตั้งจุดเริ่มต้นแบบสุ่ม (ไม่มี transition) เพื่อให้ทุกครั้งดูหมุนไม่ซ้ำ
  cube.style.transition = 'none';
  cube.style.transform = `rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg)`;
  void cube.offsetWidth; // บังคับให้เบราว์เซอร์ apply สไตล์ก่อนเริ่ม transition ใหม่

  const target = DICE_TARGET_ROTATION[number];
  const extraSpins = (2 + Math.floor(Math.random() * 2)) * 360; // หมุนเพิ่ม 2-3 รอบให้ดูสมจริง
  const finalX = target.x + extraSpins * (Math.random() < 0.5 ? 1 : -1);
  const finalY = target.y + extraSpins * (Math.random() < 0.5 ? 1 : -1);

  cube.style.transition = ''; // กลับไปใช้ transition ที่กำหนดไว้ใน CSS (1.1s)
  requestAnimationFrame(() => {
    cube.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;
  });

  setTimeout(() => {
    overlay.classList.add('hidden');
    onComplete && onComplete();
  }, 1250);
}
