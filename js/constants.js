/* ============================================================
 * 素材配置：字体 / 文字特效预设 / 形状 / Emoji / 背景色板
 * ============================================================ */

/* 全部为 SIL OFL 1.1 授权字体 —— 可免费商用、可随项目分发，无需联网加载 */
export const FONTS = [
  { name: 'Anton', desc: '超粗压缩体 · Vlog 标题首选' },
  { name: 'Permanent Marker', desc: '马克笔手写 · 生活感 Vlog' },
  { name: 'Bowlby One', desc: '圆润超粗 · 贴纸感' },
  { name: 'Righteous', desc: '活力展示体' },
  { name: 'Bebas Neue', desc: '经典高大无衬线' },
  { name: 'Bangers', desc: '漫画冲击波体' },
  { name: 'Montserrat', desc: '几何感黑体 900' },
  { name: 'Oswald', desc: '浓缩现代无衬线' },
  { name: 'Teko', desc: '窄身高瘦粗体' },
  { name: 'Black Ops One', desc: '军事 / 游戏风' },
  { name: 'Orbitron', desc: '科技未来感' },
  { name: 'Rubik Mono One', desc: '方块等宽超粗' },
];

/* 文字快速样式预设（点击直接添加到画布） */
export const TEXT_PRESETS = [
  {
    label: 'NEON', bg: '#15112b', color: '#e8fcff',
    make: () => ({
      fontFamily: 'Anton', fontSize: 120, color: '#e8fcff', uppercase: true,
      gradient: null,
      stroke: { on: true, color: '#120b3a', width: 6 },
      shadow: { on: false, color: '#000', blur: 0, dx: 0, dy: 0 },
      glow: { on: true, color: '#00e5ff', blur: 36 },
      depth: { on: false, color: '#000', thickness: 10 },
    }),
  },
  {
    label: 'FIRE', bg: '#2a0a06', color: '#fff',
    make: () => ({
      fontFamily: 'Anton', fontSize: 120,
      gradient: { from: '#ffe600', to: '#ff3b30', angle: 90 },
      stroke: { on: true, color: '#1a0500', width: 10 },
      shadow: { on: true, color: 'rgba(0,0,0,.55)', blur: 12, dx: 4, dy: 6 },
      glow: { on: false, color: '#ff8a00', blur: 20 },
      depth: { on: false, color: '#7a1400', thickness: 10 },
    }),
  },
  {
    label: 'STICKER', bg: '#10233f', color: '#fff',
    make: () => ({
      fontFamily: 'Bowlby One', fontSize: 108, color: '#ffffff',
      gradient: null,
      stroke: { on: true, color: '#0a0a0a', width: 16 },
      shadow: { on: true, color: 'rgba(0,0,0,.55)', blur: 0, dx: 7, dy: 8 },
      glow: { on: false, color: '#000', blur: 0 },
      depth: { on: false, color: '#000', thickness: 8 },
    }),
  },
  {
    label: '3D POP', bg: '#301318', color: '#fff',
    make: () => ({
      fontFamily: 'Anton', fontSize: 120, color: '#ffffff',
      gradient: null,
      stroke: { on: false, color: '#000', width: 0 },
      shadow: { on: false, color: '#000', blur: 0, dx: 0, dy: 0 },
      glow: { on: false, color: '#000', blur: 0 },
      depth: { on: true, color: '#d1263a', thickness: 18 },
    }),
  },
  {
    label: 'GOLD', bg: '#1c1407', color: '#ffd700',
    make: () => ({
      fontFamily: 'Anton', fontSize: 120,
      gradient: { from: '#fff3b0', to: '#c8901a', angle: 90 },
      stroke: { on: true, color: '#2a1c00', width: 7 },
      shadow: { on: true, color: 'rgba(0,0,0,.5)', blur: 14, dx: 3, dy: 5 },
      glow: { on: false, color: '#ffd700', blur: 20 },
      depth: { on: false, color: '#7a5800', thickness: 10 },
    }),
  },
  {
    label: 'MARKER', bg: '#fff4e6', color: '#222',
    make: () => ({
      fontFamily: 'Permanent Marker', fontSize: 84, color: '#222222', uppercase: false,
      gradient: null,
      stroke: { on: false, color: '#000', width: 0 },
      shadow: { on: false, color: '#000', blur: 0, dx: 0, dy: 0 },
      glow: { on: false, color: '#000', blur: 0 },
      depth: { on: false, color: '#000', thickness: 8 },
    }),
  },
  {
    label: 'COMIC', bg: '#3a155e', color: '#ffe600',
    make: () => ({
      fontFamily: 'Bangers', fontSize: 118, color: '#ffe600',
      gradient: null, letterSpacing: 4,
      stroke: { on: true, color: '#111111', width: 9 },
      shadow: { on: true, color: 'rgba(0,0,0,.5)', blur: 0, dx: 5, dy: 6 },
      glow: { on: false, color: '#000', blur: 0 },
      depth: { on: false, color: '#000', thickness: 8 },
    }),
  },
  {
    label: 'CLEAN', bg: '#0f1c2e', color: '#fff',
    make: () => ({
      fontFamily: 'Montserrat', fontSize: 82, color: '#ffffff',
      gradient: null,
      stroke: { on: false, color: '#000', width: 0 },
      shadow: { on: true, color: 'rgba(0,0,0,.65)', blur: 22, dx: 4, dy: 10 },
      glow: { on: false, color: '#000', blur: 0 },
      depth: { on: false, color: '#000', thickness: 8 },
    }),
  },
];

/* 形状定义（面板预览用内联 SVG） */
export const SHAPES = [
  { id: 'rect', svg: '<rect x="3" y="5" width="42" height="38" rx="2"/>' },
  { id: 'roundrect', svg: '<rect x="3" y="7" width="42" height="34" rx="8"/>' },
  { id: 'ellipse', svg: '<circle cx="24" cy="24" r="20"/>' },
  { id: 'triangle', svg: '<path d="M24 5L44 42H4z"/>' },
  { id: 'line', svg: '<rect x="2" y="20" width="44" height="8" rx="4"/>' },
  { id: 'arrow', svg: '<path d="M4 16h26V8l14 16-14 16v-8H4z"/>' },
  { id: 'star', svg: '<path d="M24 3l5.4 13.3L43 18l-11 9.2 3.8 14L24 33.6 12.2 41.2 16 27.2 5 18l13.6-1.7z"/>' },
  { id: 'burst', svg: '<path d="M24 2l3.4 7.4 7.7-2.6-1.4 8 7.3 3.6-6.5 5 4.8 6.6-8-1.2-2.7 7.7L24 38l-4.6 7.5-2.7-7.7-8 1.2 4.8-6.6-6.5-5 7.3-3.6-1.4-8 7.7 2.6z"/>' },
  { id: 'bubble', svg: '<path d="M6 4h36a4 4 0 014 4v22a4 4 0 01-4 4H19l-9 8v-8H6a4 4 0 01-4-4V8a4 4 0 014-4z"/>' },
  { id: 'hexagon', svg: '<path d="M14 5h20l9 19-9 19H14L5 24z"/>' },
  { id: 'ring', svg: '<path d="M24 4a20 20 0 100 40 20 20 0 000-40zm0 10a10 10 0 110 20 10 10 0 010-20z"/>' },
  { id: 'play', svg: '<path d="M24 3a21 21 0 100 42 21 21 0 000-42zm-6 13l17 8-17 9z"/>' },
];

export const EMOJI_TABS = [
  { id: 'faces', label: '😀', emojis: ['😱','😂','😎','🤯','😡','🥺','😍','🤔','😴','🤩','😭','🥳','😤','🤓','👀','🫢'] },
  { id: 'gesture', label: '👋', emojis: ['👉','👈','👆','👇','👍','✌️','🙌','👋','💪','🤙','👊','🙏','☝️','🤞','🫵','👏'] },
  { id: 'tech', label: '🎮', emojis: ['🎮','⚡','💻','📱','🎧','📷','🚀','🎯','📈','🎬','💡','🕹️','📺','🖥️','📡','🔋'] },
  { id: 'award', label: '🏆', emojis: ['🏆','🥇','⭐','✨','🎉','💎','👑','🔥','💯','✅','❌','❗','❓','➡️','✔️','🌟'] },
  { id: 'life', label: '❤️', emojis: ['❤️','💥','☀️','🌙','🎁','💸','💰','☕','🏠','🚗','✈️','🤑','📊','💵','🎙️','🍿'] },
];

export const BG_COLORS = [
  '#000000', '#0b0d12', '#ffffff', '#f2f4f8',
  '#ff3b30', '#ff6a4d', '#ffb224', '#ffd400',
  '#34c759', '#00c7be', '#007aff', '#5856d6',
  '#af52de', '#ff2d92', '#8b5cf6', '#2dd4bf',
];

export const BG_GRADIENTS = [
  { from: '#1a0b2e', to: '#06030f', angle: 135 },
  { from: '#ff6a4d', to: '#ffb224', angle: 135 },
  { from: '#10294e', to: '#0b1220', angle: 135 },
  { from: '#c1121f', to: '#1a0505', angle: 135 },
  { from: '#7c3aed', to: '#1e1b4b', angle: 135 },
  { from: '#052e16', to: '#14532d', angle: 135 },
  { from: '#ff9a9e', to: '#fad0c4', angle: 160 },
  { from: '#0f2027', to: '#2c5364', angle: 135 },
  { from: '#232526', to: '#414345', angle: 135 },
  { from: '#ffd400', to: '#ff9500', angle: 135 },
  { from: '#16222a', to: '#3a6073', angle: 135 },
  { from: '#3a1c71', to: '#ffaf7b', angle: 135 },
];
