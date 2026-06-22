import jsPDF from 'jspdf';
import {
  CharacterData,
  ABILITY_NAMES,
  ALL_SKILLS,
  AbilityKey,
  CASTER_CLASSES,
  calcModifier,
  calcProficiencyBonus,
  RACE_BONUSES,
  CLASS_BONUSES,
} from '../types';

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const BG_COLOR: [number, number, number] = [250, 244, 232];
const TEXT_COLOR: [number, number, number] = [62, 39, 35];
const BLUE_COLOR: [number, number, number] = [21, 101, 192];
const GOLD_COLOR: [number, number, number] = [212, 160, 23];
const BORDER_COLOR: [number, number, number] = [139, 115, 85];
const LIGHT_BG: [number, number, number] = [245, 230, 200];
const MM = 0.264583;

function setColors(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function drawRect(doc: jsPDF, x: number, y: number, w: number, h: number, fill: [number, number, number], stroke?: [number, number, number]) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  if (stroke) {
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.rect(x, y, w, h, 'FD');
  } else {
    doc.rect(x, y, w, h, 'F');
  }
}

function drawSectionTitle(doc: jsPDF, x: number, y: number, w: number, title: string) {
  setColors(doc, TEXT_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(title, x, y);
  doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
  doc.setLineWidth(0.5);
  doc.line(x, y + 1, x + w, y + 1);
  return y + 5;
}

export async function generatePDF(data: CharacterData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15 * MM;
  const contentW = pageW - margin * 2;

  drawRect(doc, 0, 0, pageW, pageH, BG_COLOR);

  doc.setDrawColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  doc.setLineWidth(0.8);
  doc.rect(margin / 2, margin / 2, pageW - margin, pageH - margin);

  let y = margin + 2;

  setColors(doc, TEXT_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const nameText = data.name || '未命名角色';
  doc.text(nameText, pageW / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColors(doc, BORDER_COLOR);
  doc.text(`${data.classType} · ${data.race} · Lv.${data.level}${data.experience > 0 ? ` · XP ${data.experience}` : ''}`, pageW / 2, y, { align: 'center' });
  y += 6;

  y = drawSectionTitle(doc, margin, y, contentW, 'ABILITIES / 属性');

  const abBoxW = (contentW - 5) / 3;
  const abBoxH = 16;
  for (let i = 0; i < ABILITY_KEYS.length; i++) {
    const key = ABILITY_KEYS[i];
    const col = i % 3;
    const row = Math.floor(i / 3);
    const ax = margin + col * (abBoxW + 2.5);
    const ay = y + row * (abBoxH + 2);

    drawRect(doc, ax, ay, abBoxW, abBoxH, LIGHT_BG, BORDER_COLOR);

    setColors(doc, TEXT_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(ABILITY_NAMES[key], ax + abBoxW / 2, ay + 4, { align: 'center' });

    const base = data.abilities[key];
    const raceB = (RACE_BONUSES[data.race] as Record<string, number>)[key] || 0;
    const classB = (CLASS_BONUSES[data.classType] as Record<string, number>)[key] || 0;
    const total = base + raceB + classB;
    const mod = calcModifier(total);

    doc.setFontSize(14);
    doc.text(String(total), ax + abBoxW / 2, ay + 10, { align: 'center' });

    setColors(doc, BLUE_COLOR);
    doc.setFontSize(8);
    doc.text(`${mod >= 0 ? '+' : ''}${mod}`, ax + abBoxW / 2, ay + 14, { align: 'center' });

    if (raceB + classB > 0) {
      doc.setFontSize(5);
      doc.text(`+${raceB + classB}`, ax + abBoxW / 2, ay + 15.5, { align: 'center' });
    }
  }
  y += 2 * (abBoxH + 2) + 4;

  y = drawSectionTitle(doc, margin, y, contentW, 'COMBAT / 战斗');

  const profBonus = calcProficiencyBonus(data.level);
  const combatItems = [
    { label: 'AC', value: String(data.ac) },
    { label: 'HP', value: String(data.hp) },
    { label: '速度', value: String(data.speed) },
    { label: '先攻', value: `${calcModifier(data.abilities.dex + ((RACE_BONUSES[data.race] as Record<string, number>).dex || 0) + ((CLASS_BONUSES[data.classType] as Record<string, number>).dex || 0)) >= 0 ? '+' : ''}${calcModifier(data.abilities.dex + ((RACE_BONUSES[data.race] as Record<string, number>).dex || 0) + ((CLASS_BONUSES[data.classType] as Record<string, number>).dex || 0))}` },
    { label: '熟练', value: `+${profBonus}` },
  ];
  const cbBoxW = (contentW - 4) / 5;
  combatItems.forEach((item, i) => {
    const cx = margin + i * (cbBoxW + 1);
    drawRect(doc, cx, y, cbBoxW, 12, LIGHT_BG, BORDER_COLOR);
    setColors(doc, TEXT_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text(item.label, cx + cbBoxW / 2, y + 3.5, { align: 'center' });
    doc.setFontSize(10);
    doc.text(item.value, cx + cbBoxW / 2, y + 9, { align: 'center' });
  });
  y += 14;

  const weapons = data.equipment.filter((e) => e.category === '武器');
  if (weapons.length > 0) {
    setColors(doc, TEXT_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('武器', margin, y + 2);
    y += 4;
    weapons.forEach((w) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text(w.name, margin + 2, y + 2);
      if (w.damageDice) {
        doc.setFont('helvetica', 'normal');
        doc.text(w.damageDice, margin + contentW * 0.5, y + 2);
      }
      if (w.attackBonus !== undefined) {
        doc.text(`${w.attackBonus >= 0 ? '+' : ''}${w.attackBonus}`, margin + contentW * 0.7, y + 2);
      }
      y += 3.5;
    });
    y += 2;
  }

  y = drawSectionTitle(doc, margin, y, contentW, 'SKILLS / 技能');

  const skillColW = (contentW - 2) / 2;
  ALL_SKILLS.forEach((skill, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = margin + col * (skillColW + 2);
    const sy = y + row * 3.5;

    const isProf = data.proficientSkills.includes(skill.key);
    const totalAbility = data.abilities[skill.ability] + ((RACE_BONUSES[data.race] as Record<string, number>)[skill.ability] || 0) + ((CLASS_BONUSES[data.classType] as Record<string, number>)[skill.ability] || 0);
    const abilityMod = calcModifier(totalAbility);
    const skillMod = abilityMod + (isProf ? profBonus : 0);

    if (isProf) {
      drawRect(doc, sx, sy - 1.5, skillColW, 3.5, [255, 248, 225], GOLD_COLOR);
    }

    setColors(doc, isProf ? GOLD_COLOR : BORDER_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    const dot = isProf ? '\u25CF ' : '  ';
    doc.text(dot + skill.name, sx + 1, sy);

    setColors(doc, isProf ? GOLD_COLOR : TEXT_COLOR);
    doc.setFont('helvetica', 'bold');
    const modStr = `${skillMod >= 0 ? '+' : ''}${skillMod}`;
    doc.text(modStr, sx + skillColW - 2, sy, { align: 'right' });
  });
  y += Math.ceil(ALL_SKILLS.length / 2) * 3.5 + 4;

  const isCaster = CASTER_CLASSES.includes(data.classType);
  if (isCaster) {
    y = drawSectionTitle(doc, margin, y, contentW, 'SPELLS / 法术');

    const activeSlots = Object.entries(data.spellSlots).filter(([, s]) => s.total > 0);
    activeSlots.forEach(([level, slot], i) => {
      const sx = margin + i * 22;
      drawRect(doc, sx, y, 20, 12, LIGHT_BG, BORDER_COLOR);

      setColors(doc, TEXT_COLOR);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text(`${level}环`, sx + 10, y + 4, { align: 'center' });

      const dotR = 1.2;
      const dotGap = 3.5;
      const startX = sx + 10 - ((slot.total - 1) * dotGap) / 2;
      for (let j = 0; j < slot.total; j++) {
        const dx = startX + j * dotGap;
        const dy = y + 8;
        doc.setFillColor(j < slot.used ? TEXT_COLOR[0] : GOLD_COLOR[0], j < slot.used ? TEXT_COLOR[1] : GOLD_COLOR[1], j < slot.used ? TEXT_COLOR[2] : GOLD_COLOR[2]);
        doc.circle(dx, dy, dotR, 'F');
      }
    });
    y += 16;
  }

  if (data.equipment.length > 0) {
    y = drawSectionTitle(doc, margin, y, contentW, 'EQUIPMENT / 装备');
    data.equipment.forEach((eq) => {
      setColors(doc, TEXT_COLOR);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text(eq.name, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      setColors(doc, BORDER_COLOR);
      doc.text(`(${eq.category}) ${eq.weight}lb`, margin + contentW * 0.5, y);
      y += 3;
    });
  }

  doc.save(`${data.name || 'character'}_card.pdf`);
}
