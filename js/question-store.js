/* คลังโจทย์ที่แก้ไขได้: 3 ด่าน × 3 ระดับ บันทึกใน localStorage โดยไม่จำกัดจำนวน */
(function () {
  'use strict';

  const STORAGE_KEY = 'skyisland_question_bank_v1';
  const STAGES = ['counting', 'decimal', 'percent'];
  const DIFFICULTIES = ['easy', 'medium', 'hard'];

  const DEFAULT_QUESTIONS = [
    { id:'counting-easy-1', stage:'counting', difficulty:'easy', enabled:true, text:'มีลูกโป่ง 8 ใบ ซื้อเพิ่มอีก 7 ใบ มีลูกโป่งทั้งหมดกี่ใบ', answer:15, choices:[15,14,16,17], hint:'นำจำนวนลูกโป่งทั้งสองจำนวนมาบวกกัน' },
    { id:'counting-medium-1', stage:'counting', difficulty:'medium', enabled:true, text:'ห้องสมุดมีหนังสือ 48 เล่ม ยืมออกไป 19 เล่ม เหลือหนังสือกี่เล่ม', answer:29, choices:[29,27,31,67], hint:'นำจำนวนที่ยืมออกไปลบจากจำนวนหนังสือทั้งหมด' },
    { id:'counting-hard-1', stage:'counting', difficulty:'hard', enabled:true, text:'มีดินสอ 12 กล่อง กล่องละ 6 แท่ง และมีดินสอแยกอีก 18 แท่ง รวมทั้งหมดกี่แท่ง', answer:90, choices:[90,72,84,108], hint:'คูณจำนวนกล่องกับจำนวนต่อกล่อง แล้วบวกดินสอที่แยกไว้' },
    { id:'decimal-easy-1', stage:'decimal', difficulty:'easy', enabled:true, text:'แม่ค้าขายส้มได้เงิน 12.5 บาท และขายมะม่วงได้เงิน 8.3 บาท รวมได้เงินทั้งหมดกี่บาท', answer:20.8, choices:[20.8,20.2,21.8,4.2], hint:'นำเงินที่ขายได้ทั้งสองจำนวนมาบวกกัน' },
    { id:'decimal-medium-1', stage:'decimal', difficulty:'medium', enabled:true, text:'ซื้อสมุดราคาเล่มละ 12.50 บาท จำนวน 4 เล่ม จ่ายเงิน 60 บาท ได้รับเงินทอนกี่บาท', answer:10, choices:[10,8,12.5,50], hint:'คูณราคาต่อเล่มกับจำนวนเล่ม แล้วนำไปลบจากเงินที่จ่าย' },
    { id:'decimal-hard-1', stage:'decimal', difficulty:'hard', enabled:true, text:'เช้าขายของได้เงิน 85.50 บาท บ่ายขายได้ 64.25 บาท ซื้อวัตถุดิบชิ้นละ 12.50 บาท จำนวน 4 ชิ้น เหลือเงินกี่บาท', answer:99.75, choices:[99.75,100.25,149.75,49.75], hint:'บวกยอดขาย คำนวณค่าวัตถุดิบ แล้วนำมาลบกัน' },
    { id:'percent-easy-1', stage:'percent', difficulty:'easy', enabled:true, text:'10% ของ 200 เท่ากับเท่าไร', answer:20, choices:[20,10,40,180], hint:'10% คือหนึ่งในสิบของจำนวนทั้งหมด' },
    { id:'percent-medium-1', stage:'percent', difficulty:'medium', enabled:true, text:'เสื้อราคา 500 บาท ลดราคา 20% ต้องจ่ายเงินกี่บาท', answer:400, choices:[400,100,480,300], hint:'หาราคาที่ลด 20% ก่อน แล้วลบออกจากราคาเต็ม' },
    { id:'percent-hard-1', stage:'percent', difficulty:'hard', enabled:true, text:'นักเรียน 40 คน เป็นนักเรียนชาย 35% มีนักเรียนชายกี่คน', answer:14, choices:[14,12,16,26], hint:'คูณจำนวนนักเรียนทั้งหมดด้วย 35 แล้วหารด้วย 100' }
  ];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function numberValue(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeQuestion(item, index) {
    if (!item || typeof item !== 'object') return null;
    const stage = STAGES.includes(item.stage) ? item.stage : 'decimal';
    const legacyLevel = DIFFICULTIES.includes(item.level) ? item.level : null;
    const difficulty = DIFFICULTIES.includes(item.difficulty) ? item.difficulty : (legacyLevel || 'easy');
    const text = String(item.text || '').trim();
    const answer = numberValue(item.answer);
    const hint = String(item.hint || '').trim();
    const choices = [];

    (Array.isArray(item.choices) ? item.choices : []).forEach(value => {
      const number = numberValue(value);
      if (number !== null && !choices.includes(number)) choices.push(number);
    });
    if (answer !== null && !choices.includes(answer)) choices.unshift(answer);
    if (!text || answer === null) return null;

    let fallback = 1;
    while (choices.length < 4) {
      const next = Number((answer + fallback).toFixed(stage === 'decimal' ? 2 : 0));
      if (!choices.includes(next)) choices.push(next);
      fallback++;
    }

    return {
      id: String(item.id || `question-${Date.now()}-${index}`),
      stage,
      difficulty,
      level: difficulty,
      source: item.source === 'csv' ? 'csv' : 'local',
      enabled: item.enabled !== false,
      text,
      answer,
      choices: choices.slice(0, 4),
      hint: hint || 'แยกข้อมูลที่โจทย์ให้มา แล้วคำนวณทีละขั้น'
    };
  }

  function normalizeBank(items) {
    if (!Array.isArray(items)) return [];
    const seenIds = new Set();
    return items.map(normalizeQuestion).filter(Boolean).map((item, index) => {
      const baseId = item.id;
      let uniqueId = baseId;
      let suffix = 1;
      while (seenIds.has(uniqueId)) uniqueId = `${baseId}-${index}-${suffix++}`;
      seenIds.add(uniqueId);
      return { ...item, id: uniqueId };
    });
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const defaults = clone(DEFAULT_QUESTIONS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
      }
      const parsed = normalizeBank(JSON.parse(raw));
      if (parsed.length) {
        const merged = parsed.slice();
        DEFAULT_QUESTIONS.forEach(defaultQuestion => {
          const hasSelection = merged.some(item =>
            item.stage === defaultQuestion.stage && item.difficulty === defaultQuestion.difficulty
          );
          if (!hasSelection) merged.push(clone(defaultQuestion));
        });
        const normalized = normalizeBank(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch (error) { /* ใช้ค่าเริ่มต้นด้านล่าง */ }
    return reset();
  }

  function save(items) {
    const normalized = normalizeBank(items);
    if (!normalized.length) throw new Error('ต้องมีโจทย์อย่างน้อย 1 ข้อ');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return clone(normalized);
  }

  function reset() {
    const defaults = clone(DEFAULT_QUESTIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  function enabledForSelection(stage, difficulty) {
    return load().filter(item => item.stage === stage && item.difficulty === difficulty && item.enabled);
  }

  function importJson(text) {
    const parsed = JSON.parse(text);
    return save(Array.isArray(parsed) ? parsed : parsed.questions);
  }

  function exportJson() {
    return JSON.stringify({ app:'Sky Island', version:3, exportedAt:new Date().toISOString(), questions:load() }, null, 2);
  }

  function parseCsvRows(text) {
    const rows = [];
    let row = [];
    let value = '';
    let quoted = false;
    const input = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (quoted) {
        if (char === '"' && input[i + 1] === '"') { value += '"'; i++; }
        else if (char === '"') quoted = false;
        else value += char;
      } else if (char === '"') quoted = true;
      else if (char === ',') { row.push(value); value = ''; }
      else if (char === '\n') { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = ''; }
      else value += char;
    }
    if (value.length || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
    return rows.filter(item => item.some(cell => String(cell).trim() !== ''));
  }

  function parseCsv(text, stageOverride) {
    const rows = parseCsvRows(text);
    if (rows.length < 2) return [];
    const headers = rows[0].map(header => String(header).trim().toLowerCase());
    return normalizeBank(rows.slice(1).map((row, index) => {
      const item = {};
      headers.forEach((header, column) => { item[header] = row[column] ?? ''; });
      return {
        id: item.id || `${stageOverride || 'question'}-csv-${index + 1}`,
        stage: stageOverride || item.stage,
        difficulty: String(item.difficulty || '').trim().toLowerCase(),
        enabled: !['false', '0', 'no', 'ปิด'].includes(String(item.enabled).trim().toLowerCase()),
        text: item.text,
        answer: item.answer,
        choices: [item.choice1, item.choice2, item.choice3, item.choice4],
        hint: item.hint,
        source: 'csv'
      };
    }));
  }

  function csvCell(value) {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function exportCsv(stage, items) {
    const headers = ['id','difficulty','enabled','text','answer','choice1','choice2','choice3','choice4','hint'];
    const lines = (items || load()).filter(item => !stage || item.stage === stage).map(item => [
      item.id, item.difficulty, item.enabled, item.text, item.answer,
      ...(item.choices || []).slice(0, 4), item.hint
    ].map(csvCell).join(','));
    return `\uFEFF${headers.join(',')}\r\n${lines.join('\r\n')}`;
  }

  async function syncFromCsvSources() {
    const results = await Promise.all(STAGES.map(async stage => {
      const response = await fetch(`data/${stage}.csv?v=${Date.now()}`, { cache:'no-store' });
      if (!response.ok) throw new Error(`โหลดคลังโจทย์ ${stage} ไม่สำเร็จ`);
      return parseCsv(await response.text(), stage);
    }));
    const current = load().filter(item => item.source !== 'csv');
    const byId = new Map(current.map(item => [item.id, item]));
    results.flat().forEach(item => byId.set(item.id, item));
    const synced = save([...byId.values()]);
    return { questions:synced, imported:results.reduce((total, items) => total + items.length, 0) };
  }

  window.QuestionStore = {
    STORAGE_KEY,
    STAGES: STAGES.slice(),
    DIFFICULTIES: DIFFICULTIES.slice(),
    DEFAULT_QUESTIONS: clone(DEFAULT_QUESTIONS),
    normalizeQuestion,
    normalizeBank,
    load,
    save,
    reset,
    enabledForSelection,
    importJson,
    exportJson,
    parseCsv,
    exportCsv,
    syncFromCsvSources
  };
})();
