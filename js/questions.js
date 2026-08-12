/* คลังโจทย์ Sky Island: สุ่มจากหน้า Admin ตามด่านและระดับ พร้อมโจทย์สำรอง */

const STAGE_CONFIG = {
  counting: { label:'ด่าน 1 จำนวนนับ', shortLabel:'จำนวนนับ' },
  decimal:  { label:'ด่าน 2 ทศนิยม', shortLabel:'ทศนิยม' },
  percent:  { label:'ด่าน 3 ร้อยละ', shortLabel:'ร้อยละ' }
};

const DIFFICULTY_CONFIG = {
  easy:   { label:'ง่าย' },
  medium: { label:'ปานกลาง' },
  hard:   { label:'ยาก' }
};

function randDecimal(min, max, decimals = 1) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function countingFallback(difficulty) {
  if (difficulty === 'hard') {
    const groups = randInt(6, 15);
    const perGroup = randInt(4, 12);
    const extra = randInt(10, 50);
    return { text:`มีของ ${groups} กล่อง กล่องละ ${perGroup} ชิ้น และมีเพิ่มอีก ${extra} ชิ้น รวมทั้งหมดกี่ชิ้น`, answer:groups * perGroup + extra, hint:'คูณจำนวนกล่องกับจำนวนต่อกล่อง แล้วบวกจำนวนที่เพิ่มมา' };
  }
  if (difficulty === 'medium') {
    const total = randInt(40, 150);
    const removed = randInt(10, total - 10);
    return { text:`มีหนังสือ ${total} เล่ม นำออกไป ${removed} เล่ม เหลือกี่เล่ม`, answer:total - removed, hint:'นำจำนวนที่เอาออกลบจากจำนวนทั้งหมด' };
  }
  const a = randInt(5, 40);
  const b = randInt(5, 40);
  return { text:`มีลูกบอล ${a} ลูก ได้เพิ่มอีก ${b} ลูก มีทั้งหมดกี่ลูก`, answer:a + b, hint:'นำจำนวนทั้งสองมาบวกกัน' };
}

function decimalFallback(difficulty) {
  if (difficulty === 'hard') {
    const first = randDecimal(50, 150, 2);
    const second = randDecimal(30, 120, 2);
    const cost = randDecimal(20, Math.max(21, first + second - 10), 2);
    return { text:`มีเงิน ${first} บาท ได้เพิ่ม ${second} บาท แล้วจ่ายไป ${cost} บาท เหลือเงินกี่บาท`, answer:Number((first + second - cost).toFixed(2)), hint:'บวกเงินก่อน แล้วลบจำนวนที่จ่ายไป' };
  }
  if (difficulty === 'medium') {
    const price = randDecimal(5, 25, 2);
    const count = randInt(2, 8);
    const paid = Number((price * count + randDecimal(5, 30, 2)).toFixed(2));
    return { text:`ซื้อสมุดเล่มละ ${price} บาท ${count} เล่ม จ่าย ${paid} บาท ได้เงินทอนกี่บาท`, answer:Number((paid - price * count).toFixed(2)), hint:'หาราคารวม แล้วลบออกจากเงินที่จ่าย' };
  }
  const a = randDecimal(5, 30, 1);
  const b = randDecimal(5, 30, 1);
  return { text:`มีน้ำ ${a} ลิตร เติมอีก ${b} ลิตร มีน้ำทั้งหมดกี่ลิตร`, answer:Number((a + b).toFixed(1)), hint:'นำปริมาณน้ำทั้งสองจำนวนมาบวกกัน' };
}

function percentFallback(difficulty) {
  const rates = difficulty === 'easy' ? [10, 20, 25, 50] : [15, 20, 25, 30, 40];
  const rate = rates[randInt(0, rates.length - 1)];
  const base = randInt(2, 20) * 100;
  const amount = base * rate / 100;
  if (difficulty === 'hard') {
    const extraRate = [5, 10, 20][randInt(0, 2)];
    const afterFirst = base - amount;
    const final = Number((afterFirst * (1 - extraRate / 100)).toFixed(2));
    return { text:`สินค้าราคา ${base} บาท ลดครั้งแรก ${rate}% แล้วลดเพิ่มอีก ${extraRate}% จากราคาที่ลดแล้ว ต้องจ่ายกี่บาท`, answer:final, hint:'คิดส่วนลดครั้งแรก แล้วใช้ราคาที่เหลือไปคิดส่วนลดครั้งที่สอง' };
  }
  if (difficulty === 'medium') {
    return { text:`สินค้าราคา ${base} บาท ลดราคา ${rate}% ต้องจ่ายเงินกี่บาท`, answer:base - amount, hint:'คำนวณจำนวนเงินที่ลด แล้วลบออกจากราคาเต็ม' };
  }
  return { text:`${rate}% ของ ${base} เท่ากับเท่าไร`, answer:amount, hint:'นำจำนวนคูณด้วยอัตราร้อยละ แล้วหารด้วย 100' };
}

function choicesFor(answer, stage, difficulty) {
  const decimals = stage === 'decimal' || !Number.isInteger(answer) ? 2 : 0;
  const spread = difficulty === 'hard' ? 20 : difficulty === 'medium' ? 10 : 5;
  const values = new Set([answer]);
  let attempts = 0;
  while (values.size < 4 && attempts < 200) {
    const offset = decimals ? randDecimal(-spread, spread, decimals) : randInt(-spread, spread);
    const value = Number((answer + offset).toFixed(decimals));
    if (value >= 0 && value !== answer) values.add(value);
    attempts++;
  }
  let fallback = 1;
  while (values.size < 4) values.add(Number((answer + fallback++).toFixed(decimals)));
  return shuffleArray([...values]);
}

function generateQuestion(stage, difficulty) {
  const editable = window.QuestionStore ? QuestionStore.enabledForSelection(stage, difficulty) : [];
  if (editable.length) {
    const selected = editable[randInt(0, editable.length - 1)];
    return { text:selected.text, answer:selected.answer, hint:selected.hint, choices:shuffleArray(selected.choices.slice()) };
  }

  const fallback = stage === 'counting'
    ? countingFallback(difficulty)
    : stage === 'percent'
      ? percentFallback(difficulty)
      : decimalFallback(difficulty);
  return { ...fallback, choices:choicesFor(fallback.answer, stage, difficulty) };
}

function shuffleArray(array) {
  for (let index = array.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
}
