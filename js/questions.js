/* คลังโจทย์ Sky Island: ใช้โจทย์จากหน้า Admin ก่อน และมีโจทย์สุ่มสำรอง */

function randDecimal(min, max, decimals = 1) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const LEVEL_CONFIG = {
  easy:   { label: 'ง่าย (ทศนิยม 1 หลัก · 1 ขั้นตอน)' },
  medium: { label: 'ปานกลาง (ทศนิยม 2 หลัก · 2 ขั้นตอน)' },
  hard:   { label: 'ยาก (ทศนิยม 2 หลัก · 3 ขั้นตอน)' }
};

function easyFallback() {
  const a = randDecimal(5, 30, 1);
  const b = randDecimal(5, 30, 1);
  return {
    text: `แม่ค้าขายส้มได้เงิน ${a} บาท และขายมะม่วงได้เงิน ${b} บาท รวมแล้วได้เงินทั้งหมดกี่บาท`,
    answer: Number((a + b).toFixed(1)),
    hint: 'นำเงินที่ขายได้ทั้งสองจำนวนมาบวกกัน'
  };
}

function mediumFallback() {
  const price = randDecimal(5, 25, 2);
  const count = randInt(2, 8);
  const cost = Number((price * count).toFixed(2));
  const paid = Number((cost + randDecimal(5, 30, 2)).toFixed(2));
  return {
    text: `ซื้อสมุดราคาเล่มละ ${price} บาท จำนวน ${count} เล่ม จ่ายเงิน ${paid} บาท ได้รับเงินทอนกี่บาท`,
    answer: Number((paid - cost).toFixed(2)),
    hint: 'คูณราคาต่อเล่มกับจำนวนเล่ม แล้วนำผลลัพธ์ไปลบจากเงินที่จ่าย'
  };
}

function hardFallback() {
  const firstSale = randDecimal(30, 150, 2);
  const secondSale = randDecimal(20, 120, 2);
  const count = randInt(2, 8);
  const totalSale = Number((firstSale + secondSale).toFixed(2));
  const maxPrice = Math.max(2, (totalSale * 0.6) / count);
  const price = randDecimal(2, maxPrice, 2);
  return {
    text: `เช้าขายของได้เงิน ${firstSale} บาท บ่ายขายได้อีก ${secondSale} บาท ซื้อวัตถุดิบชิ้นละ ${price} บาท จำนวน ${count} ชิ้น เหลือเงินกี่บาท`,
    answer: Number((totalSale - price * count).toFixed(2)),
    hint: 'บวกยอดขายทั้งสองช่วง คูณราคาวัตถุดิบกับจำนวน แล้วนำผลคูณไปลบ'
  };
}

function choicesFor(answer, level) {
  const decimals = level === 'easy' ? 1 : 2;
  const spread = level === 'hard' ? 10 : level === 'medium' ? 6 : 3;
  const values = new Set([answer]);
  let attempts = 0;
  while (values.size < 4 && attempts < 200) {
    const value = Number((answer + randDecimal(-spread, spread, decimals)).toFixed(decimals));
    if (value > 0 && value !== answer) values.add(value);
    attempts++;
  }
  let fallback = 1;
  while (values.size < 4) {
    values.add(Number((answer + fallback).toFixed(decimals)));
    fallback++;
  }
  return shuffleArray([...values]);
}

function generateQuestion(level) {
  const editable = window.QuestionStore ? QuestionStore.enabledForLevel(level) : [];
  if (editable.length) {
    const selected = editable[randInt(0, editable.length - 1)];
    return {
      text: selected.text,
      answer: selected.answer,
      hint: selected.hint,
      choices: shuffleArray(selected.choices.slice())
    };
  }

  const fallback = level === 'hard'
    ? hardFallback()
    : level === 'medium'
      ? mediumFallback()
      : easyFallback();
  return {
    ...fallback,
    choices: choicesFor(fallback.answer, level)
  };
}

function shuffleArray(array) {
  for (let index = array.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
}
