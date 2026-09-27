/* ============================================================
 * 8 套优质 YouTube 封面模板
 * 每个 build() 返回 { bg, layers }，层顺序从下到上
 * ============================================================ */
import {
  makeTextLayer, makeShapeLayer, makeEmojiLayer, makePlaceholderLayer, CANVAS_W, CANVAS_H,
} from './editor.js';

const C = CANVAS_W / 2;

/* 占位快捷方式 */
const ph = (x, y, w, h, shape = 'roundrect', extra = {}) =>
  makeShapeLayer(shape, { placeholder: true, x, y, w, h, fill: 'rgba(255,255,255,0.07)', ...extra });

const ALL_TEMPLATES = [
  /* ---------------- 1. 游戏霓虹 ---------------- */
  {
    id: 'gaming', name: '游戏高光', tag: 'GAMING',
    accent: '#a855f7',
    build() {
      return {
        bg: { mode: 'gradient', from: '#1a0b2e', to: '#06030f', angle: 135 },
        layers: [
          makeShapeLayer('ellipse', { fill: '#6d28d9', opacity: 0.55, w: 920, h: 920, x: 1010, y: 250 }),
          makeShapeLayer('ellipse', { fill: '#00e5ff', opacity: 0.18, w: 420, h: 420, x: 230, y: 110 }),
          makeShapeLayer('rect', { fill: '#00e5ff', opacity: 0.85, w: 780, h: 24, rotation: -0.09, x: 320, y: 606 }),
          makeShapeLayer('rect', { fill: '#a855f7', opacity: 0.6, w: 520, h: 10, rotation: -0.09, x: 230, y: 640 }),
          ph(984, 398, 446, 606),
          makeEmojiLayer('🔥', { x: 126, y: 118, w: 110, h: 110 }),
          makeShapeLayer('burst', { fill: '#ff3b30', w: 138, h: 138, x: 1110, y: 118, rotation: 0.18 }),
          makeTextLayer('PLAY LIKE', {
            x: 332, y: 246, fontSize: 120, color: '#ffffff',
            stroke: { width: 6, color: '#120b3a' },
            glow: { on: true, color: '#a855f7', blur: 30 },
          }),
          makeTextLayer('A PRO', {
            x: 300, y: 398, fontSize: 152, align: 'center',
            gradient: { from: '#00e5ff', to: '#a855f7', angle: 90 },
            stroke: { width: 7, color: '#0b0620' },
            glow: { on: true, color: '#00e5ff', blur: 38 },
          }),
          makeTextLayer('NEW!', {
            x: 1110, y: 126, fontSize: 44, fontFamily: 'Bangers', letterSpacing: 2,
            color: '#fff', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeTextLayer('TIPS, TRICKS & SECRETS', {
            x: 336, y: 546, fontSize: 29, fontFamily: 'Montserrat', color: '#9ff7ff',
            stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
        ],
      };
    },
  },

  /* ---------------- 2. Vlog 暖色 ---------------- */
  {
    id: 'vlog', name: '日常 Vlog', tag: 'VLOG',
    accent: '#ff6a8b',
    build() {
      return {
        bg: { mode: 'gradient', from: '#ffe3d3', to: '#ff9a9e', angle: 160 },
        layers: [
          makeShapeLayer('ellipse', { fill: '#ffffff', opacity: 0.35, w: 200, h: 200, x: 1080, y: 120 }),
          makeShapeLayer('ellipse', { fill: '#ff6a8b', opacity: 0.25, w: 130, h: 130, x: 668, y: 600 }),
          makeShapeLayer('ring', { fill: '#ffffff', opacity: 0.9, w: 494, h: 494, x: 372, y: 366 }),
          ph(372, 366, 452, 452, 'ellipse'),
          makeEmojiLayer('☕', { x: 690, y: 165, w: 84, h: 84, rotation: 0.1 }),
          makeEmojiLayer('✨', { x: 1070, y: 560, w: 90, h: 90 }),
          makeEmojiLayer('🎧', { x: 640, y: 96, w: 76, h: 76 }),
          makeTextLayer('My Daily', {
            x: 894, y: 258, fontSize: 92, fontFamily: 'Permanent Marker',
            color: '#5b2333', uppercase: false,
            stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeTextLayer('Life', {
            x: 884, y: 366, fontSize: 116, fontFamily: 'Permanent Marker',
            color: '#e02f5e', uppercase: false,
            stroke: { on: false, width: 0 },
            shadow: { on: true, color: 'rgba(91,35,51,0.25)', blur: 0, dx: 3, dy: 4 },
          }),
          makeShapeLayer('roundrect', { fill: '#ffffff', w: 312, h: 64, x: 894, y: 478 }),
          makeTextLayer('VLOG · 012', {
            x: 894, y: 487, fontSize: 30, fontFamily: 'Montserrat',
            color: '#5b2333', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
        ],
      };
    },
  },

  /* ---------------- 2b. 旅行 Vlog ---------------- */
  {
    id: 'travel', name: '旅行 Vlog', tag: 'TRAVEL',
    accent: '#0ea5e9',
    build() {
      return {
        bg: { mode: 'gradient', from: '#38bdf8', to: '#0c4a6e', angle: 135 },
        layers: [
          makeShapeLayer('ellipse', { fill: '#ffffff', opacity: 0.16, w: 260, h: 260, x: 200, y: 120 }),
          makeShapeLayer('ellipse', { fill: '#ffffff', opacity: 0.1, w: 160, h: 160, x: 640, y: 640 }),
          makeShapeLayer('ellipse', { fill: '#ffffff', opacity: 0.12, w: 90, h: 90, x: 560, y: 96 }),
          makeShapeLayer('roundrect', { fill: '#ffffff', w: 486, h: 600, x: 1010, y: 360 }),
          ph(1010, 360, 452, 566),
          makeEmojiLayer('✈️', { x: 1130, y: 120, w: 96, h: 96, rotation: -0.35 }),
          makeEmojiLayer('📍', { x: 130, y: 120, w: 84, h: 84 }),
          makeEmojiLayer('🧳', { x: 610, y: 632, w: 76, h: 76 }),
          makeTextLayer("WE'RE", {
            x: 380, y: 178, fontSize: 108, color: '#ffffff',
            stroke: { width: 6, color: '#0b3a5c' },
            shadow: { on: true, color: 'rgba(8,40,65,0.45)', blur: 14, dx: 3, dy: 5 },
          }),
          makeTextLayer('GOING TO', {
            x: 420, y: 298, fontSize: 108, color: '#ffffff',
            stroke: { width: 6, color: '#0b3a5c' },
            shadow: { on: true, color: 'rgba(8,40,65,0.45)', blur: 14, dx: 3, dy: 5 },
          }),
          makeTextLayer('BALI!', {
            x: 360, y: 448, fontSize: 156,
            gradient: { from: '#fff3b0', to: '#ffb020', angle: 90 },
            stroke: { width: 8, color: '#0b3a5c' },
            glow: { on: true, color: '#ffd400', blur: 26 },
          }),
          makeShapeLayer('roundrect', { fill: '#ffffff', w: 436, h: 56, x: 380, y: 566 }),
          makeTextLayer('TRAVEL VLOG · EP.06', {
            x: 380, y: 574, fontSize: 27, fontFamily: 'Montserrat',
            color: '#0b3a5c', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
        ],
      };
    },
  },

  /* ---------------- 2c. 美食 Vlog ---------------- */
  {
    id: 'food', name: '美食探店', tag: 'FOOD',
    accent: '#f97316',
    build() {
      return {
        bg: { mode: 'gradient', from: '#fff1d6', to: '#ffb27a', angle: 150 },
        layers: [
          makeShapeLayer('ellipse', { fill: '#ffffff', opacity: 0.45, w: 200, h: 200, x: 160, y: 620 }),
          makeShapeLayer('ellipse', { fill: '#f97316', opacity: 0.18, w: 300, h: 300, x: 620, y: 80 }),
          makeShapeLayer('ring', { fill: '#ffffff', opacity: 0.95, w: 520, h: 520, x: 976, y: 378 }),
          ph(976, 378, 476, 476, 'ellipse'),
          makeEmojiLayer('🍕', { x: 150, y: 118, w: 92, h: 92, rotation: -0.15 }),
          makeEmojiLayer('⭐', { x: 620, y: 560, w: 64, h: 64 }),
          makeEmojiLayer('☕', { x: 690, y: 636, w: 72, h: 72 }),
          makeShapeLayer('burst', { fill: '#ef4444', w: 150, h: 150, x: 1170, y: 130, rotation: 0.12 }),
          makeTextLayer('YUM!', {
            x: 1170, y: 138, fontSize: 46, fontFamily: 'Bangers', letterSpacing: 2,
            color: '#ffffff', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeTextLayer('We Tried The', {
            x: 380, y: 210, fontSize: 72, fontFamily: 'Permanent Marker',
            color: '#5b2d12', uppercase: false,
            stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeTextLayer('BEST PIZZA', {
            x: 400, y: 348, fontSize: 118,
            color: '#ffffff', stroke: { width: 9, color: '#7c2d12' },
            shadow: { on: true, color: 'rgba(124,45,18,0.35)', blur: 0, dx: 6, dy: 7 },
          }),
          makeTextLayer('In Town!', {
            x: 340, y: 460, fontSize: 72, fontFamily: 'Permanent Marker',
            color: '#ea580c', uppercase: false,
            stroke: { on: false, width: 0 }, shadow: { on: true, color: 'rgba(124,45,18,0.25)', blur: 0, dx: 3, dy: 3 },
          }),
          makeShapeLayer('roundrect', { fill: '#5b2d12', w: 304, h: 54, x: 360, y: 566 }),
          makeTextLayer('FOOD VLOG · 04', {
            x: 360, y: 574, fontSize: 27, fontFamily: 'Montserrat',
            color: '#ffe9c7', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
        ],
      };
    },
  },

  /* ---------------- 2d. 生活方式 / 晨间日常 ---------------- */
  {
    id: 'routine', name: '晨间日常', tag: 'ROUTINE',
    accent: '#3f6212',
    build() {
      return {
        bg: { mode: 'color', color: '#efe9dd' },
        layers: [
          makeShapeLayer('rect', { fill: '#1c1917', w: 60, h: 720, x: 40, y: 360 }),
          makeShapeLayer('roundrect', { fill: '#d6cdbd', w: 470, h: 590, x: 360, y: 372 }),
          ph(360, 372, 438, 558),
          makeShapeLayer('roundrect', { fill: '#ffffff', w: 280, h: 190, x: 990, y: 158 }),
          ph(990, 158, 252, 162),
          makeEmojiLayer('☀️', { x: 1192, y: 268, w: 64, h: 64 }),
          makeEmojiLayer('🌿', { x: 1226, y: 642, w: 58, h: 58 }),
          makeTextLayer('MY 2025', {
            x: 940, y: 296, fontSize: 54, fontFamily: 'Bebas Neue', letterSpacing: 5,
            color: '#78716c', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeTextLayer('MORNING', {
            x: 950, y: 392, fontSize: 92,
            color: '#1c1917', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeTextLayer('ROUTINE', {
            x: 950, y: 488, fontSize: 92,
            color: '#1c1917', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeShapeLayer('roundrect', { fill: '#1c1917', w: 304, h: 52, x: 930, y: 586 }),
          makeTextLayer('5AM CLUB · EP.12', {
            x: 930, y: 594, fontSize: 25, fontFamily: 'Montserrat',
            color: '#f5f0e8', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
        ],
      };
    },
  },

  /* ---------------- 3. 科技测评 ---------------- */
  {
    id: 'tech', name: '科技测评', tag: 'REVIEW',
    accent: '#3d8bfd',
    build() {
      return {
        bg: { mode: 'gradient', from: '#10294e', to: '#0b1220', angle: 135 },
        layers: [
          makeShapeLayer('ellipse', { fill: '#1d6fe0', opacity: 0.4, w: 780, h: 780, x: 1020, y: 160 }),
          makeShapeLayer('line', { fill: '#ffffff', opacity: 0.12, w: 700, h: 6, rotation: 0.32, x: 300, y: 620 }),
          makeShapeLayer('line', { fill: '#ffffff', opacity: 0.08, w: 520, h: 4, rotation: 0.32, x: 220, y: 670 }),
          ph(982, 430, 466, 430),
          makeEmojiLayer('⚡', { x: 132, y: 108, w: 104, h: 104 }),
          makeTextLayer("WAIT… DON'T", {
            x: 330, y: 178, fontSize: 96, color: '#ffd400',
            stroke: { width: 8, color: '#050810' },
            shadow: { on: true, color: 'rgba(0,0,0,0.5)', blur: 14, dx: 4, dy: 6 },
          }),
          makeTextLayer('BUY BEFORE', {
            x: 372, y: 312, fontSize: 86, color: '#ffffff',
            stroke: { width: 7, color: '#050810' },
          }),
          makeTextLayer('YOU WATCH', {
            x: 366, y: 414, fontSize: 86, color: '#ffffff',
            stroke: { width: 7, color: '#050810' },
          }),
          makeShapeLayer('roundrect', { fill: '#00e5ff', w: 290, h: 50, x: 290, y: 548 }),
          makeTextLayer('2025 EDITION', {
            x: 290, y: 556, fontSize: 28, fontFamily: 'Montserrat',
            color: '#06223a', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
        ],
      };
    },
  },

  /* ---------------- 4. 教程 ---------------- */
  {
    id: 'tutorial', name: '保姆教程', tag: 'HOW TO',
    accent: '#ffd400',
    build() {
      return {
        bg: { mode: 'color', color: '#ffd400' },
        layers: [
          makeShapeLayer('triangle', { fill: '#000000', opacity: 0.06, w: 520, h: 520, x: 1180, y: 80, rotation: 0.4 }),
          makeShapeLayer('roundrect', { fill: '#ffffff', w: 528, h: 430, x: 900, y: 372 }),
          ph(900, 372, 488, 392),
          makeShapeLayer('ellipse', { fill: '#111111', w: 214, h: 214, x: 248, y: 200 }),
          makeTextLayer('5', {
            x: 248, y: 232, fontSize: 150, color: '#ffd400',
            stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeTextLayer('HOW TO', {
            x: 352, y: 386, fontSize: 118, color: '#111111',
            stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeTextLayer('EDIT FAST', {
            x: 430, y: 506, fontSize: 88, color: '#111111',
            stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeShapeLayer('arrow', { fill: '#111111', w: 132, h: 72, x: 630, y: 502, rotation: 0 }),
          makeShapeLayer('roundrect', { fill: '#111111', w: 326, h: 54, x: 350, y: 608 }),
          makeTextLayer('STEP BY STEP', {
            x: 350, y: 615, fontSize: 27, fontFamily: 'Montserrat',
            color: '#ffd400', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
        ],
      };
    },
  },

  /* ---------------- 5. Top 10 ---------------- */
  {
    id: 'top10', name: 'TOP 10 盘点', tag: 'LISTICLE',
    accent: '#ff3b30',
    build() {
      return {
        bg: { mode: 'gradient', from: '#c1121f', to: '#1a0505', angle: 135 },
        layers: [
          makeShapeLayer('ellipse', { fill: '#ff3b30', opacity: 0.3, w: 760, h: 760, x: 380, y: 340 }),
          ph(1002, 384, 420, 560),
          makeShapeLayer('roundrect', {
            fill: 'rgba(0,0,0,0)', w: 444, h: 584, x: 1002, y: 384,
            stroke: { on: true, color: '#ffffff', width: 5 },
          }),
          makeEmojiLayer('🔥', { x: 126, y: 118, w: 96, h: 96 }),
          makeEmojiLayer('💰', { x: 720, y: 610, w: 88, h: 88 }),
          makeShapeLayer('burst', { fill: '#ffd400', w: 540, h: 540, x: 430, y: 360, rotation: 0.12 }),
          makeTextLayer('TOP 10', {
            x: 430, y: 372, fontSize: 132, fontFamily: 'Bowlby One', color: '#ffffff',
            stroke: { width: 12, color: '#111111' },
            shadow: { on: true, color: 'rgba(0,0,0,0.5)', blur: 0, dx: 7, dy: 9 },
          }),
          makeTextLayer('THINGS', {
            x: 430, y: 486, fontSize: 64, color: '#111111',
            stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeTextLayer('YOU NEED TO KNOW', {
            x: 430, y: 576, fontSize: 30, fontFamily: 'Montserrat', color: '#ffffff',
            stroke: { on: false, width: 0 }, shadow: { on: true, color: 'rgba(0,0,0,0.6)', blur: 8, dx: 0, dy: 2 },
          }),
        ],
      };
    },
  },

  /* ---------------- 6. Reaction ---------------- */
  {
    id: 'reaction', name: '高能反应', tag: 'REACTION',
    accent: '#7c3aed',
    build() {
      return {
        bg: { mode: 'gradient', from: '#7c3aed', to: '#1e1b4b', angle: 135 },
        layers: [
          makeShapeLayer('ellipse', { fill: '#ffffff', opacity: 0.08, w: 340, h: 340, x: 1120, y: 560 }),
          ph(350, 430, 620, 400),
          makeShapeLayer('play', { fill: '#ff3b30', w: 130, h: 130, x: 350, y: 430 }),
          makeEmojiLayer('😱', { x: 1086, y: 210, w: 220, h: 220, rotation: 0.12 }),
          makeEmojiLayer('🤯', { x: 118, y: 580, w: 120, h: 120, rotation: -0.14 }),
          makeEmojiLayer('✨', { x: 980, y: 108, w: 70, h: 70 }),
          makeTextLayer('REACTING TO', {
            x: 640, y: 126, fontSize: 102, fontFamily: 'Bangers', letterSpacing: 3,
            color: '#ffffff', stroke: { width: 7, color: '#1a0b3a' },
          }),
          makeTextLayer('VIRAL VIDEOS!', {
            x: 640, y: 234, fontSize: 102, fontFamily: 'Bangers', letterSpacing: 3,
            color: '#ffe600', stroke: { width: 7, color: '#1a0b3a' },
          }),
        ],
      };
    },
  },

  /* ---------------- 7. 播客 ---------------- */
  {
    id: 'podcast', name: '播客访谈', tag: 'PODCAST',
    accent: '#ff3b30',
    build() {
      return {
        bg: { mode: 'color', color: '#0e0e0e' },
        layers: [
          makeShapeLayer('rect', { fill: '#ff3b30', w: 14, h: 360, x: 158, y: 340 }),
          ph(350, 366, 420, 420, 'ellipse'),
          makeEmojiLayer('🎙️', { x: 1128, y: 152, w: 120, h: 120 }),
          makeTextLayer('THE DAILY', {
            x: 880, y: 262, fontSize: 112, fontFamily: 'Bebas Neue', letterSpacing: 6,
            color: '#ffffff', stroke: { on: false, width: 0 },
            shadow: { on: true, color: 'rgba(0,0,0,0.6)', blur: 18, dx: 0, dy: 4 },
          }),
          makeTextLayer('PODCAST', {
            x: 880, y: 378, fontSize: 112, fontFamily: 'Bebas Neue', letterSpacing: 6,
            color: '#ffffff', stroke: { on: false, width: 0 },
            shadow: { on: true, color: 'rgba(0,0,0,0.6)', blur: 18, dx: 0, dy: 4 },
          }),
          makeShapeLayer('roundrect', { fill: '#ff3b30', w: 238, h: 56, x: 770, y: 502 }),
          makeTextLayer('EP. 042', {
            x: 770, y: 510, fontSize: 28, fontFamily: 'Montserrat',
            color: '#ffffff', stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
          makeTextLayer('NEW EPISODE EVERY MONDAY', {
            x: 870, y: 592, fontSize: 24, fontFamily: 'Montserrat', color: '#8a8f9c',
            stroke: { on: false, width: 0 }, shadow: { on: false, blur: 0, dx: 0, dy: 0 },
          }),
        ],
      };
    },
  },

  /* ---------------- 8. 理财 ---------------- */
  {
    id: 'finance', name: '理财涨知识', tag: 'MONEY',
    accent: '#fbbf24',
    build() {
      return {
        bg: { mode: 'gradient', from: '#052e16', to: '#14532d', angle: 135 },
        layers: [
          makeShapeLayer('ellipse', { fill: '#fbbf24', opacity: 0.16, w: 720, h: 720, x: 260, y: 220 }),
          makeShapeLayer('rect', { fill: '#fbbf24', opacity: 0.85, w: 58, h: 64, x: 72, y: 628 }),
          makeShapeLayer('rect', { fill: '#fbbf24', opacity: 0.7, w: 58, h: 120, x: 138, y: 600 }),
          makeShapeLayer('rect', { fill: '#fbbf24', w: 58, h: 200, x: 204, y: 560 }),
          ph(984, 402, 446, 600),
          makeShapeLayer('arrow', { fill: '#ffd400', w: 180, h: 92, x: 1100, y: 148, rotation: -0.55 }),
          makeEmojiLayer('💰', { x: 150, y: 128, w: 104, h: 104 }),
          makeEmojiLayer('📈', { x: 700, y: 610, w: 88, h: 88 }),
          makeTextLayer('5 MONEY', {
            x: 430, y: 252, fontSize: 120,
            gradient: { from: '#fff3b0', to: '#c8901a', angle: 90 },
            stroke: { width: 7, color: '#2a1c00' },
            glow: { on: true, color: '#fbbf24', blur: 22 },
          }),
          makeTextLayer('TIPS', {
            x: 316, y: 386, fontSize: 120,
            gradient: { from: '#fff3b0', to: '#c8901a', angle: 90 },
            stroke: { width: 7, color: '#2a1c00' },
            glow: { on: true, color: '#fbbf24', blur: 22 },
          }),
          makeTextLayer('THAT ACTUALLY WORK', {
            x: 480, y: 505, fontSize: 34, fontFamily: 'Montserrat', color: '#ffffff',
            stroke: { on: false, width: 0 }, shadow: { on: true, color: 'rgba(0,0,0,0.6)', blur: 10, dx: 0, dy: 3 },
          }),
        ],
      };
    },
  },
];

/* Vlog 类优先排序，其余保持原顺序 */
const VLOG_FIRST = ['vlog', 'travel', 'food', 'routine'];
export const TEMPLATES = [
  ...VLOG_FIRST.map(id => ALL_TEMPLATES.find(t => t.id === id)),
  ...ALL_TEMPLATES.filter(t => !VLOG_FIRST.includes(t.id)),
];

void C;
