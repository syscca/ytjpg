/* ============================================================
 * ThumbForge — 编辑器核心
 * 1280×720 画布 / 图层 / 渲染 / 交互 / 历史 / 导出
 * ============================================================ */

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

let _uid = 0;
export const uid = () => 'L' + (++_uid) + Date.now().toString(36);

/* ---------------- 图片缓存 ---------------- */
const imgCache = new Map();
export function loadImage(src) {
  if (imgCache.has(src)) return Promise.resolve(imgCache.get(src));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { imgCache.set(src, img); resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

/* ---------------- 图层工厂 ---------------- */
export function makeImageLayer(src, opts = {}) {
  const base = {
    id: uid(), type: 'image',
    x: CANVAS_W / 2, y: CANVAS_H / 2, w: 600, h: 400,
    rotation: 0, opacity: 1, flipH: false, flipV: false,
    src, image: null, fit: 'contain', radius: 0,
    filters: { brightness: 100, contrast: 100, saturate: 100, blur: 0 },
    /* 基于抠图 alpha 的特效：轮廓描边 / 投影 / 外发光 */
    fx: {
      outline: { on: false, width: 10, color: '#ffffff', alpha: 100 },
      shadow: { on: false, color: '#000000', alpha: 55, blur: 24, dx: 0, dy: 14 },
      glow: { on: false, color: '#00e5ff', alpha: 80, blur: 30 },
    },
  };
  const out = { ...base, ...opts };
  if (opts.fx) out.fx = {
    outline: { ...base.fx.outline, ...(opts.fx.outline || {}) },
    shadow: { ...base.fx.shadow, ...(opts.fx.shadow || {}) },
    glow: { ...base.fx.glow, ...(opts.fx.glow || {}) },
  };
  if (opts.filters) out.filters = { ...base.filters, ...opts.filters };
  return out;
}

/* 旧场景（无 fx 字段）补全 */
export function ensureImageFx(L) {
  if (L.fx && L.fx.outline && L.fx.shadow && L.fx.glow) return L.fx;
  const dfl = makeImageLayer(null).fx;
  L.fx = {
    outline: { ...dfl.outline, ...(L.fx?.outline || {}) },
    shadow: { ...dfl.shadow, ...(L.fx?.shadow || {}) },
    glow: { ...dfl.glow, ...(L.fx?.glow || {}) },
  };
  return L.fx;
}

/* 旧文字层（单层 stroke）迁移为多层描边数组：外→内顺序 */
export function normalizeStrokes(L) {
  if (Array.isArray(L.strokes)) return L.strokes;
  L.strokes = (L.stroke && L.stroke.on && L.stroke.width > 0)
    ? [{ color: L.stroke.color || '#000000', width: L.stroke.width }]
    : [];
  return L.strokes;
}

export function makeTextLayer(text = 'YOUR TEXT', opts = {}) {
  const base = {
    id: uid(), type: 'text',
    x: CANVAS_W / 2, y: CANVAS_H / 2, w: 100, h: 100,
    rotation: 0, opacity: 1, flipH: false, flipV: false,
    text,
    fontFamily: 'Anton',
    fontSize: 96,
    align: 'center',
    color: '#ffffff',
    gradient: null,              // {from,to,angle}
    stroke: { on: true, color: '#000000', width: 8 },
    strokes: [{ color: '#000000', width: 8 }], /* 多层描边，外→内 */
    shadow: { on: true, color: 'rgba(0,0,0,0.65)', blur: 16, dx: 5, dy: 7 },
    glow: { on: false, color: '#00e5ff', blur: 28 },
    depth: { on: false, color: '#8a1414', thickness: 14 },
    background: { on: false, color: '#ff3b30', padding: 20, radius: 18 },
    letterSpacing: 0,
    lineHeight: 1.04,
    italic: false,
    uppercase: true,
    arc: 0,
  };
  const out = { ...base, ...opts };
  for (const k of ['stroke', 'shadow', 'glow', 'depth', 'background']) {
    if (opts[k]) out[k] = { ...base[k], ...opts[k] };
  }
  /* 描边层：显式传入优先；否则从单层 stroke 派生 */
  if (Array.isArray(opts.strokes)) out.strokes = opts.strokes.map(s => ({ color: '#000000', width: 8, ...s }));
  else if (opts.stroke) {
    out.strokes = (out.stroke.on && out.stroke.width > 0)
      ? [{ color: out.stroke.color, width: out.stroke.width }] : [];
  }
  return out;
}

export function makeShapeLayer(shape = 'rect', opts = {}) {
  const presets = {
    rect:        { w: 360, h: 240, fill: '#ff3b30' },
    roundrect:   { w: 380, h: 220, fill: '#ffb224' },
    ellipse:     { w: 300, h: 300, fill: '#3d8bfd' },
    triangle:    { w: 320, h: 290, fill: '#34c759' },
    line:        { w: 360, h: 24,  fill: '#ffffff' },
    arrow:       { w: 320, h: 160, fill: '#ffffff' },
    star:        { w: 280, h: 280, fill: '#ffb224' },
    burst:       { w: 340, h: 340, fill: '#ff3b30' },
    bubble:      { w: 380, h: 260, fill: '#ffffff' },
    hexagon:     { w: 300, h: 280, fill: '#8b5cf6' },
    ring:        { w: 260, h: 260, fill: '#ff3b30' },
    play:        { w: 220, h: 220, fill: '#ff3b30' },
  }[shape] || { w: 300, h: 300, fill: '#ff3b30' };
  return {
    id: uid(), type: 'shape', shape,
    x: CANVAS_W / 2, y: CANVAS_H / 2,
    rotation: 0, opacity: 1, flipH: false, flipV: false,
    w: presets.w, h: presets.h,
    fill: presets.fill,
    stroke: { on: false, color: '#000000', width: 6 },
    placeholder: false,
    ...opts,
  };
}

export function makeEmojiLayer(emoji, opts = {}) {
  return {
    id: uid(), type: 'emoji', emoji,
    x: CANVAS_W / 2, y: CANVAS_H / 2, w: 180, h: 180,
    rotation: 0, opacity: 1, flipH: false, flipV: false,
    ...opts,
  };
}

export function makePlaceholderLayer(opts = {}) {
  const l = makeShapeLayer('roundrect', { fill: 'rgba(255,255,255,0.06)', ...opts });
  l.placeholder = true;
  return l;
}

/* ---------------- 形状路径 ---------------- */
export function shapePath(ctx, s, w, h) {
  const x = -w / 2, y = -h / 2;
  ctx.beginPath();
  switch (s) {
    case 'rect':
      ctx.rect(x, y, w, h);
      break;
    case 'roundrect':
      roundRect(ctx, x, y, w, h, Math.min(26, w * 0.08));
      break;
    case 'ellipse':
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'triangle':
      ctx.moveTo(0, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
      break;
    case 'line':
      roundRect(ctx, x, y, w, h, h / 2);
      break;
    case 'arrow': {
      const sh = h, sw = w, t = sh * 0.42, head = sw * 0.28, body = sw * 0.72;
      ctx.moveTo(-body / 2, -t / 2);
      ctx.lineTo(-body / 2, -sh / 2 + (sh - t) / 2);
      ctx.lineTo(body / 2 - (sw - body) / 2, -sh / 2);
      ctx.lineTo(body / 2 + head - sw * 0.14, -sh / 2);
      ctx.lineTo(sw / 2, 0);
      ctx.lineTo(body / 2 + head - sw * 0.14, sh / 2);
      ctx.lineTo(-body / 2 + (sw - body) / 2, sh / 2);
      ctx.lineTo(-body / 2, t / 2);
      ctx.closePath();
      break;
    }
    case 'star':
      starPath(ctx, 0, 0, 5, w / 2, w / 2 * 0.45, -Math.PI / 2);
      break;
    case 'burst':
      starPath(ctx, 0, 0, 12, w / 2, w / 2 * 0.82, -Math.PI / 2);
      break;
    case 'bubble': {
      const r = Math.min(34, w * 0.1);
      roundRect(ctx, x, y, w, h * 0.82, r);
      ctx.moveTo(x + w * 0.22, y + h * 0.82);
      ctx.lineTo(x + w * 0.12, y + h);
      ctx.lineTo(x + w * 0.40, y + h * 0.82);
      ctx.closePath();
      break;
    }
    case 'hexagon': {
      const k = w * 0.22;
      ctx.moveTo(-w / 2 + k, y); ctx.lineTo(w / 2 - k, y);
      ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2 - k, y + h);
      ctx.lineTo(-w / 2 + k, y + h); ctx.lineTo(-w / 2, 0);
      ctx.closePath();
      break;
    }
    case 'ring':
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.moveTo(w * 0.18, 0);
      ctx.ellipse(0, 0, w * 0.32, h * 0.32, 0, 0, Math.PI * 2, true);
      break;
    case 'play': {
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.moveTo(-w * 0.14, -h * 0.22);
      ctx.lineTo(w * 0.26, 0);
      ctx.lineTo(-w * 0.14, h * 0.22);
      ctx.closePath();
      break;
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function starPath(ctx, cx, cy, spikes, outerR, innerR, rot = -Math.PI / 2) {
  const step = Math.PI / spikes;
  ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
  for (let i = 0; i < spikes; i++) {
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
  }
  ctx.closePath();
}

/* ---------------- 图片绘制（含 alpha 特效） ---------------- */
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000');
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

/**
 * 生成图层的原始像素精灵（cover/contain/fill + 圆角 + 滤镜），尺寸=L.w×L.h
 */
function buildImageSprite(L) {
  const img = L.image;
  const W = Math.max(2, Math.round(L.w)), H = Math.max(2, Math.round(L.h));
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const f = L.filters;
  if (f && (f.brightness !== 100 || f.contrast !== 100 || f.saturate !== 100 || f.blur)) {
    ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) blur(${f.blur}px)`;
  }
  if (L.radius > 0) {
    roundRect(ctx, 0, 0, W, H, Math.min(L.radius, W / 2, H / 2));
    ctx.clip();
  }
  if (L.fit === 'fill') {
    ctx.drawImage(img, 0, 0, W, H);
  } else {
    const cover = L.fit === 'cover';
    const ir = img.width / img.height, br = W / H;
    let dw = W, dh = H, dx = 0, dy = 0;
    if ((cover && ir > br) || (!cover && ir < br)) {
      dh = H; dw = dh * ir; dx = (W - dw) / 2;
    } else {
      dw = W; dh = dw / ir; dy = (H - dh) / 2;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  return c;
}

/**
 * 由精灵 alpha 生成彩色轮廓（可膨胀 dilate 像素），用于描边/投影/发光。
 * 线性时间的可分离滑窗最大值（形态学膨胀），边缘硬、无 halo。
 */
function buildSilhouette(sprite, { color = '#000000', alpha = 1, dilate = 0 } = {}) {
  const W = sprite.width, H = sprite.height;
  const sx = sprite.getContext('2d').getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H);
  for (let i = 0, j = 0; i < sx.length; i += 4, j++) {
    if (sx[i + 3] > 16) mask[j] = 1;
  }
  const r = Math.max(0, Math.round(dilate));
  if (r > 0) dilateBinary(mask, W, H, r);

  const [cr, cg, cb] = hexToRgb(color);
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const img = out.getContext('2d').createImageData(W, H);
  const d = img.data;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    if (mask[j]) { d[i] = cr; d[i + 1] = cg; d[i + 2] = cb; d[i + 3] = a; }
  }
  out.getContext('2d').putImageData(img, 0, 0);
  return out;
}

/* 二值 mask 的可分离膨胀（水平 + 垂直，单调队列 O(n)） */
function dilateBinary(mask, w, h, r) {
  const tmp = new Uint8Array(w * h);
  const dq = new Int32Array(Math.max(w, h) + 2);
  /* 水平 */
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let head = 0, tail = 0;
    for (let x = 0; x < w; x++) {
      while (head < tail && mask[row + dq[tail - 1]] <= mask[row + x]) tail--;
      dq[tail++] = x;
      if (dq[head] < x - r) head++;
      tmp[row + x] = mask[row + dq[head]];
    }
  }
  /* 垂直（结果写回 mask） */
  for (let x = 0; x < w; x++) {
    let head = 0, tail = 0;
    for (let y = 0; y < h; y++) {
      const i = y * w + x;
      while (head < tail && tmp[dq[tail - 1] * w + x] <= tmp[i]) tail--;
      dq[tail++] = y;
      if (dq[head] < y - r) head++;
      mask[i] = tmp[dq[head] * w + x];
    }
  }
}

/* ---- 特效合成缓存：拖拽/缩放图层时复用，避免逐帧形态学运算 ---- */
const fxCaches = new Map();
const FX_CACHE_MAX = 14;

function buildImageFx(L, sprite) {
  const fx = ensureImageFx(L);
  const key = JSON.stringify([
    L.src, L.image && 1, Math.round(L.w), Math.round(L.h), L.fit, Math.round(L.radius),
    L.filters.brightness, L.filters.contrast, L.filters.saturate, L.filters.blur,
    fx.outline.on, fx.outline.width, fx.outline.color, fx.outline.alpha,
    fx.shadow.on, fx.shadow.color, fx.shadow.alpha, fx.shadow.blur, fx.shadow.dx, fx.shadow.dy,
    fx.glow.on, fx.glow.color, fx.glow.alpha, fx.glow.blur,
  ]);
  const cached = fxCaches.get(L.id);
  if (cached && cached.key === key) return cached.canvas;

  let margin = 2;
  if (fx.outline.on) margin += fx.outline.width;
  if (fx.shadow.on) margin += fx.shadow.blur + Math.max(Math.abs(fx.shadow.dx), Math.abs(fx.shadow.dy));
  if (fx.glow.on) margin += fx.glow.blur;
  margin = Math.ceil(margin);

  const c = document.createElement('canvas');
  c.width = sprite.width + margin * 2;
  c.height = sprite.height + margin * 2;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  /* 1) 投影：轮廓轻微膨胀 + 高斯模糊 + 偏移 */
  if (fx.shadow.on) {
    const sil = buildSilhouette(sprite, { color: fx.shadow.color, alpha: fx.shadow.alpha / 100, dilate: 2 });
    ctx.save();
    ctx.filter = `blur(${Math.max(0, fx.shadow.blur)}px)`;
    ctx.drawImage(sil, margin + fx.shadow.dx, margin + fx.shadow.dy);
    ctx.restore();
  }

  /* 2) 外发光：彩色轮廓模糊，叠两次增强 */
  if (fx.glow.on) {
    const sil = buildSilhouette(sprite, { color: fx.glow.color, alpha: fx.glow.alpha / 100, dilate: 1 });
    ctx.save();
    ctx.filter = `blur(${Math.max(0, fx.glow.blur)}px)`;
    ctx.drawImage(sil, margin, margin);
    ctx.drawImage(sil, margin, margin);
    ctx.restore();
  }

  /* 3) 轮廓描边：膨胀出的硬边彩色环 */
  if (fx.outline.on) {
    const sil = buildSilhouette(sprite, {
      color: fx.outline.color, alpha: fx.outline.alpha / 100, dilate: fx.outline.width,
    });
    ctx.drawImage(sil, margin, margin);
  }

  /* 4) 原图压在最上层 */
  ctx.drawImage(sprite, margin, margin);

  if (fxCaches.size >= FX_CACHE_MAX) fxCaches.delete(fxCaches.keys().next().value);
  fxCaches.set(L.id, { key, canvas: c });
  return c;
}

function drawImageLayer(ctx, L) {
  if (!L.image) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(-L.w / 2, -L.h / 2, L.w, L.h);
    ctx.restore();
    return;
  }
  const fx = ensureImageFx(L);
  const hasFx = fx.outline.on || fx.shadow.on || fx.glow.on;
  if (hasFx) {
    const composed = buildImageFx(L, buildImageSprite(L));
    ctx.drawImage(composed, -composed.width / 2, -composed.height / 2);
    return;
  }
  ctx.save();
  const f = L.filters;
  if (f && (f.brightness !== 100 || f.contrast !== 100 || f.saturate !== 100 || f.blur)) {
    ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) blur(${f.blur}px)`;
  }
  if (L.radius > 0) {
    roundRect(ctx, -L.w / 2, -L.h / 2, L.w, L.h, L.radius);
    ctx.clip();
  }
  const img = L.image;
  if (L.fit === 'fill') {
    ctx.drawImage(img, -L.w / 2, -L.h / 2, L.w, L.h);
  } else {
    const cover = L.fit === 'cover';
    const ir = img.width / img.height, br = L.w / L.h;
    let dw = L.w, dh = L.h, dx = 0, dy = 0;
    if ((cover && ir > br) || (!cover && ir < br)) {
      dh = L.h; dw = dh * ir; dx = (L.w - dw) / 2;
    } else {
      dw = L.w; dh = dw / ir; dy = (L.h - dh) / 2;
    }
    ctx.drawImage(img, -L.w / 2 + dx, -L.h / 2 + dy, dw, dh);
  }
  ctx.restore();
}

/* ---------------- 文字测量与绘制 ---------------- */
function setFont(ctx, L) {
  ctx.font = `${L.italic ? 'italic ' : ''}${L.fontSize}px ${JSON.stringify(L.fontFamily)}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function getLines(L) {
  return L.text.split('\n').map(t => L.uppercase ? t.toUpperCase() : t);
}

function charWidths(ctx, line, ls) {
  const arr = [];
  let total = 0;
  for (const ch of line) {
    const cw = ctx.measureText(ch).width;
    arr.push(cw);
    total += cw + ls;
  }
  return { arr, total: Math.max(0, total - ls) };
}

/** 测量文字块，返回 {width,height,lines:[{text,width,chars}]} */
export function measureText(ctx, L) {
  ctx.save();
  setFont(ctx, L);
  const raw = getLines(L);
  const lines = raw.map(line => {
    const { arr, total } = charWidths(ctx, line, L.letterSpacing);
    return { text: line, width: total, chars: arr };
  });
  const width = Math.max(1, ...lines.map(l => l.width));
  const height = lines.length * L.fontSize * L.lineHeight;
  ctx.restore();
  const pad = L.background?.on ? L.background.padding : 0;
  return { width: width + pad * 2, height: height + pad * 2, textW: width, textH: height, lines, pad };
}

/** 字符绘制（含描边/填充/发光/3D） */
function drawChar(ctx, ch, x, y, L, style) {
  const draw = (fn) => {
    if (L.glow.on) {
      const widest = L.strokes?.length ? Math.max(...L.strokes.map(s => s.width || 0)) : 0;
      ctx.save();
      ctx.shadowColor = L.glow.color;
      ctx.shadowBlur = L.glow.blur;
      ctx.lineWidth = widest || Math.max(3, L.fontSize * 0.05);
      ctx.strokeStyle = L.glow.color;
      ctx.globalAlpha *= 0.9;
      ctx.strokeText(ch, x, y);
      ctx.strokeText(ch, x, y);
      ctx.restore();
    }
    if (L.depth.on) {
      const t = L.depth.thickness;
      const dx = 0.38, dy = 1;
      ctx.fillStyle = L.depth.color;
      for (let i = t; i >= 1; i--) ctx.fillText(ch, x + dx * i, y + dy * i);
    }
    if (L.shadow.on) {
      ctx.shadowColor = L.shadow.color;
      ctx.shadowBlur = L.shadow.blur;
      ctx.shadowOffsetX = L.shadow.dx;
      ctx.shadowOffsetY = L.shadow.dy;
    }
    /* 多层描边：数组顺序即外→内，宽的一层先画；lineJoin 圆角更自然 */
    if (L.stroke.on && L.strokes?.length) {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (const s of L.strokes) {
        if (!s.width || s.width <= 0) continue;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
        ctx.strokeText(ch, x, y);
      }
    }
    ctx.fillStyle = style.fill;
    ctx.fillText(ch, x, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  };
  draw();
}

function drawTextLayer(ctx, L) {
  const m = measureText(ctx, L);
  const pad = m.pad;
  const blockW = m.textW, blockH = m.textH;
  const bx = -blockW / 2 - pad, by = -blockH / 2 - pad;

  /* 背景标签 */
  if (L.background.on) {
    ctx.save();
    ctx.fillStyle = L.background.color;
    roundRect(ctx, bx, by, blockW + pad * 2, blockH + pad * 2, L.background.radius);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  setFont(ctx, L);
  let fillStyle = L.color;
  if (L.gradient) {
    const a = (L.gradient.angle ?? 90) * Math.PI / 180;
    const g = ctx.createLinearGradient(
      bx, by,
      bx + Math.sin(a) * (blockW + pad * 2),
      by + Math.cos(a) * (blockH + pad * 2)
    );
    g.addColorStop(0, L.gradient.from);
    g.addColorStop(1, L.gradient.to);
    fillStyle = g;
  }

  const lineH = L.fontSize * L.lineHeight;
  const top = -blockH / 2;

  m.lines.forEach((line, li) => {
    const baseY = top + li * lineH + L.fontSize * 0.82;
    let startX;
    if (L.align === 'left') startX = -blockW / 2;
    else if (L.align === 'right') startX = blockW / 2 - line.width;
    else startX = -line.width / 2;

    if (L.arc !== 0 && line.text.trim()) {
      /* 弧形文字：沿圆弧排布字符 */
      const bend = L.arc / 100;
      const theta = Math.abs(bend) * 1.7;
      const R = (line.width / 2) / Math.sin(theta / 2);
      const dir = bend > 0 ? 1 : -1;
      const arcCx = startX + line.width / 2;
      const arcCy = baseY - L.fontSize * 0.32 - dir * R;
      let angle = -theta / 2;
      for (let i = 0; i < line.text.length; i++) {
        const ch = line.text[i];
        const cw = line.chars[i];
        const mid = angle + (cw / 2 + L.letterSpacing / 2) / R;
        ctx.save();
        ctx.translate(arcCx + Math.sin(mid) * R, arcCy + Math.cos(mid) * R * dir);
        ctx.rotate(mid * dir);
        drawChar(ctx, ch, -cw / 2, L.fontSize * 0.32, L, { fill: fillStyle });
        ctx.restore();
        angle += (cw + L.letterSpacing) / R;
      }
    } else {
      let cx = startX;
      for (let i = 0; i < line.text.length; i++) {
        const ch = line.text[i];
        drawChar(ctx, ch, cx, baseY, L, { fill: fillStyle });
        cx += line.chars[i] + L.letterSpacing;
      }
    }
  });
  ctx.restore();
}

/* ---------------- 占位框 ---------------- */
function placeholderPath(ctx, L) {
  ctx.beginPath();
  if (L.shape === 'ellipse') {
    ctx.ellipse(0, 0, L.w / 2, L.h / 2, 0, 0, Math.PI * 2);
  } else {
    roundRect(ctx, -L.w / 2, -L.h / 2, L.w, L.h, 20);
  }
}
function drawPlaceholder(ctx, L) {
  ctx.save();
  ctx.fillStyle = L.fill || 'rgba(255,255,255,0.06)';
  placeholderPath(ctx, L);
  ctx.fill();
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2.5;
  placeholderPath(ctx, L);
  ctx.stroke();
  ctx.setLineDash([]);
  /* 山形图标 */
  const iw = Math.min(86, L.w * 0.22);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-iw / 2, 8); ctx.lineTo(-iw / 6, -iw / 5);
  ctx.lineTo(iw / 8, 6); ctx.lineTo(iw / 4, -iw / 8);
  ctx.lineTo(iw / 2, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-iw / 7, -iw / 4.2, iw / 14, 0, Math.PI * 2);
  ctx.stroke();
  /* 标签 */
  ctx.fillStyle = '#fff';
  ctx.font = '700 23px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOUR IMAGE', 0, iw * 0.72);
  ctx.font = '500 15px Montserrat, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('双击替换', 0, iw * 0.95);
  ctx.restore();
}

/* ---------------- 场景渲染 ---------------- */
export function renderScene(ctx, bg, layers, viewW = CANVAS_W, viewH = CANVAS_H) {
  const sx = viewW / CANVAS_W, sy = viewH / CANVAS_H;
  ctx.save();
  ctx.scale(sx, sy);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  /* 背景 */
  if (bg.mode === 'color' || !bg.mode) {
    ctx.fillStyle = bg.color || '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else if (bg.mode === 'gradient') {
    const a = (bg.angle ?? 135) * Math.PI / 180;
    const g = ctx.createLinearGradient(0, 0, Math.sin(a) * CANVAS_W, Math.cos(a) * CANVAS_H);
    g.addColorStop(0, bg.from); g.addColorStop(1, bg.to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else if (bg.mode === 'image' && bg.image) {
    const f = bg.filters || {};
    ctx.save();
    if (f.brightness !== 100 || f.contrast !== 100 || f.saturate !== 100 || f.blur) {
      ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) blur(${f.blur}px)`;
    }
    const img = bg.image, ir = img.width / img.height, br = CANVAS_W / CANVAS_H;
    let dw = CANVAS_W, dh = CANVAS_H, dx = 0, dy = 0;
    if (ir > br) { dw = dh * ir; dx = (CANVAS_W - dw) / 2; }
    else { dh = dw / ir; dy = (CANVAS_H - dh) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  /* 图层 */
  for (const L of layers) {
    ctx.save();
    ctx.globalAlpha = L.opacity ?? 1;
    ctx.translate(L.x, L.y);
    ctx.rotate(L.rotation || 0);
    ctx.scale(L.flipH ? -1 : 1, L.flipV ? -1 : 1);

    if (L.type === 'image') { ensureImageFx(L); drawImageLayer(ctx, L); }
    else if (L.type === 'emoji') {
      ctx.font = `${L.h * 0.92}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(L.emoji, 0, L.h * 0.04);
    }
    else if (L.type === 'shape') {
      if (L.placeholder) { drawPlaceholder(ctx, L); }
      else {
        shapePath(ctx, L.shape, L.w, L.h);
        ctx.fillStyle = L.fill;
        if (L.shape === 'ring' || L.shape === 'play') ctx.fill('evenodd');
        else ctx.fill();
        if (L.stroke.on) {
          ctx.lineWidth = L.stroke.width; ctx.strokeStyle = L.stroke.color;
          ctx.lineJoin = 'round';
          if (L.shape === 'ring') {
            ctx.beginPath();
            ctx.ellipse(0, 0, L.w / 2, L.h / 2, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.stroke();
          }
        }
      }
    }
    else if (L.type === 'text') {
      normalizeStrokes(L);
      const m = measureText(ctx, L);
      L.w = m.width; L.h = m.height;
      drawTextLayer(ctx, L);
    }
    ctx.restore();
  }
  ctx.restore();
}

/* ============================================================
 * Editor — 状态与交互
 * ============================================================ */
export class Editor {
  constructor({ canvas, overlay, selBox, textEditor }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.overlay = overlay;
    this.selBox = selBox;
    this.textEditor = textEditor;
    this.guideV = overlay.querySelector('.guide-v');
    this.guideH = overlay.querySelector('.guide-h');
    this.bg = { mode: 'color', color: '#0b0d12' };
    this.layers = [];
    this.selectedId = null;
    this.scale = 0.5;
    this.history = [];
    this.future = [];
    this.onSelect = null;
    this.onSceneChange = null;
    this._pendingAction = null;
    this._bindEvents();
    this.render();
  }

  /* ---------- 基础操作 ---------- */
  emit() { this.render(); this.onSceneChange && this.onSceneChange(); }
  render() { renderScene(this.ctx, this.bg, this.layers); this.updateSelBox(); }

  get selected() { return this.layers.find(l => l.id === this.selectedId) || null; }

  select(id) {
    this.selectedId = id;
    this.selBox.classList.toggle('hidden', !id);
    this.updateSelBox();
    this.onSelect && this.onSelect(this.selected);
  }

  add(layer, { select = true, snap = true } = {}) {
    if (snap) this.pushHistory();
    this.layers.push(layer);
    if (select) this.select(layer.id);
    this.emit();
    return layer;
  }

  remove(id) {
    this.pushHistory();
    this.layers = this.layers.filter(l => l.id !== id);
    if (this.selectedId === id) this.select(null);
    this.emit();
  }

  duplicate(id) {
    const L = this.layers.find(l => l.id === id);
    if (!L) return;
    this.pushHistory();
    const copy = JSON.parse(JSON.stringify(L, (k, v) => k === 'image' ? undefined : v));
    copy.id = uid(); copy.x += 36; copy.y += 36;
    if (copy.src) copy.image = imgCache.get(copy.src) || null;
    this.layers.splice(this.layers.indexOf(L) + 1, 0, copy);
    this.select(copy.id);
    this.emit();
  }

  moveLayer(id, dir) {
    const i = this.layers.findIndex(l => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= this.layers.length) return;
    this.pushHistory();
    [this.layers[i], this.layers[j]] = [this.layers[j], this.layers[i]];
    this.emit();
  }

  flip(id, axis) {
    const L = this.selected;
    if (!L) return;
    this.pushHistory();
    if (axis === 'h') L.flipH = !L.flipH; else L.flipV = !L.flipV;
    this.emit();
  }

  /* ---------- 场景装载（模板 / 清空） ---------- */
  loadScene(data, { snap = true } = {}) {
    if (snap) this.pushHistory();
    this.bg = JSON.parse(JSON.stringify(data.bg));
    this.layers = data.layers.map(l => ({ ...l, id: l.id || uid() }));
    if (this.bg.mode === 'image' && this.bg.src) {
      this.bg.image = imgCache.get(this.bg.src) || null;
      if (!this.bg.image) loadImage(this.bg.src).then(img => { this.bg.image = img; this.render(); });
    }
    const wait = this.layers.filter(l => l.src).map(l =>
      loadImage(l.src).then(img => { l.image = img; }).catch(() => {})
    );
    this.select(null);
    this.emit();
    if (wait.length) Promise.all(wait).then(() => this.render());
  }

  clearAll() {
    this.pushHistory();
    this.bg = { mode: 'color', color: '#0b0d12' };
    this.layers = [];
    this.select(null);
    this.emit();
  }

  setBackground(bg) { this.pushHistory(); this.bg = { ...this.bg, ...bg }; this.emit(); }

  /* ---------- 图片 ---------- */
  async addImageFile(file, mode = 'asset') {
    const src = await fileToDataURL(file);
    const image = await loadImage(src);
    this.pushHistory();
    if (mode === 'bg') {
      this.bg = { mode: 'image', src, image, filters: { brightness: 100, contrast: 100, saturate: 100, blur: 0 } };
      this.emit();
      return null;
    }
    let w = image.width, h = image.height;
    if (Math.abs(w / h - CANVAS_W / CANVAS_H) < 0.02 && w >= CANVAS_W) {
      /* 与画布同比例的大图（如 1280x720 截图）：直接铺满画布 */
      w = CANVAS_W; h = CANVAS_H;
    } else {
      const maxW = 860;
      if (w > maxW) { h = h * maxW / w; w = maxW; }
      if (h > 620) { w = w * 620 / h; h = 620; }
    }
    const L = makeImageLayer(src, { w, h, image, fit: 'contain' });
    this.layers.push(L);
    this.select(L.id);
    this.emit();
    return L;
  }

  async replaceLayerImage(L, src) {
    this.pushHistory();
    const image = await loadImage(src);
    L.src = src; L.image = image;
    L.type = 'image';
    L.placeholder = false;
    L.fit = 'cover';
    L.filters = { brightness: 100, contrast: 100, saturate: 100, blur: 0 };
    this.emit();
  }

  updateLayerImage(L, src) {
    /* 抠图后替换，不入历史（调用方负责） */
    return loadImage(src).then(img => {
      imgCache.set(src, img);
      L.src = src; L.image = img;
      L.fit = 'contain';
      this.emit();
    });
  }

  /* ---------- 命中检测 ---------- */
  hitTest(p) {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const L = this.layers[i];
      if (L.locked) continue;
      const dx = p.x - L.x, dy = p.y - L.y;
      const c = Math.cos(-(L.rotation || 0)), s = Math.sin(-(L.rotation || 0));
      const lx = dx * c - dy * s;
      const ly = dx * s + dy * c;
      if (Math.abs(lx) <= L.w / 2 && Math.abs(ly) <= L.h / 2) return L;
    }
    return null;
  }

  /* ---------- 坐标 ---------- */
  toCanvasPoint(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / this.scale,
      y: (e.clientY - r.top) / this.scale,
    };
  }

  /* ---------- 事件 ---------- */
  _bindEvents() {
    this.canvas.addEventListener('pointerdown', e => this._onDown(e));
    window.addEventListener('pointermove', e => this._onMove(e));
    window.addEventListener('pointerup', e => this._onUp(e));
    this.canvas.addEventListener('dblclick', e => this._onDblClick(e));
    this.canvas.style.touchAction = 'none';

    /* 手柄 */
    this.selBox.querySelectorAll('.handle').forEach(h => {
      h.addEventListener('pointerdown', e => {
        e.stopPropagation();
        const L = this.selected;
        if (!L) return;
        this.pushHistory();
        const kind = h.dataset.h;
        this._drag = {
          type: kind === 'rot' ? 'rotate' : 'scale',
          kind,
          start: this.toCanvasPoint(e),
          orig: JSON.parse(JSON.stringify({ x: L.x, y: L.y, w: L.w, h: L.h, rotation: L.rotation, fontSize: L.fontSize, w0: L.w, h0: L.h })),
        };
        h.setPointerCapture?.(e.pointerId);
      });
    });

    /* 键盘 */
    window.addEventListener('keydown', e => {
      if (this._editing) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); this.selected && this.duplicate(this.selected.id); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selected) { e.preventDefault(); this.remove(this.selected.id); }
      else if (this.selected && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        const L = this.selected;
        if (!this._arrowMoved) { this.pushHistory(); this._arrowMoved = true; }
        L.x += e.key.endsWith('Right') ? d : e.key.endsWith('Left') ? -d : 0;
        L.y += e.key.endsWith('Down') ? d : e.key.endsWith('Up') ? -d : 0;
        this.emit();
      }
    });
    window.addEventListener('keyup', e => {
      if (e.key.startsWith('Arrow')) this._arrowMoved = false;
    });
  }

  _onDown(e) {
    const p = this.toCanvasPoint(e);
    const hit = this.hitTest(p);
    if (hit) {
      if (hit.id !== this.selectedId) this.select(hit.id);
      this.pushHistory();
      this._drag = { type: 'move', start: p, orig: { x: hit.x, y: hit.y }, layer: hit };
      this.canvas.setPointerCapture?.(e.pointerId);
    } else {
      this.select(null);
    }
  }

  _onMove(e) {
    const d = this._drag;
    if (!d) return;
    const p = this.toCanvasPoint(e);
    const L = this.selected;
    if (!L) return;
    if (d.type === 'move') {
      L.x = d.orig.x + (p.x - d.start.x);
      L.y = d.orig.y + (p.y - d.start.y);
      this._snapMove(L);
    } else if (d.type === 'scale') {
      const o = d.orig;
      const c = Math.cos(-o.rotation), s = Math.sin(-o.rotation);
      const dx = p.x - o.x, dy = p.y - o.y;
      const lx = dx * c - dy * s;
      const ly = dx * s + dy * c;
      let nw = o.w0, nh = o.h0;
      if (d.kind.includes('r')) nw = Math.max(20, 2 * lx);
      if (d.kind.includes('l')) nw = Math.max(20, -2 * lx);
      if (d.kind.includes('b')) nh = Math.max(20, 2 * ly);
      if (d.kind.includes('t')) nh = Math.max(20, -2 * ly);
      const uniform = (L.type === 'text' || L.type === 'emoji') || e.shiftKey;
      if (uniform) {
        const ratio = Math.max(nw / o.w0, nh / o.h0);
        nw = o.w0 * ratio; nh = o.h0 * ratio;
      }
      if (L.type === 'text') {
        L.fontSize = Math.max(8, o.fontSize * (nw / o.w0));
      } else if (L.type === 'emoji') {
        L.w = L.h = nw;
      } else {
        L.w = nw; L.h = nh;
      }
    } else if (d.type === 'rotate') {
      const ang = Math.atan2(p.y - L.y, p.x - L.x) + Math.PI / 2;
      let deg = ang * 180 / Math.PI;
      if (e.shiftKey) {
        /* Shift：15° 硬步进 */
        deg = Math.round(deg / 15) * 15;
      } else {
        /* 默认：靠近 45° 倍数（0/45/90/135…）时自动磁吸 */
        const T = 6;
        const nearest = Math.round(deg / 45) * 45;
        if (Math.abs(deg - nearest) <= T) deg = nearest;
      }
      L.rotation = deg * Math.PI / 180;
    }
    this.render();
  }

  _onUp() {
    if (this._drag) {
      /* 无实际变化时弹出刚压入的历史 */
      this._drag = null;
      this._showGuides(null, null);
      this.emit();
    }
  }

  /* ---------- 磁吸：拖动时对齐画布边界/中心线及其他图层 ---------- */
  _snapMove(L) {
    const T = 7; /* 吸附阈值（画布像素） */
    let dxBest = null, dyBest = null, gx = null, gy = null;
    const xs = [L.x - L.w / 2, L.x, L.x + L.w / 2];  /* 左 中 右 */
    const ys = [L.y - L.h / 2, L.y, L.y + L.h / 2];  /* 上 中 下 */

    /* 吸附目标线：画布边界/中心 + 其他图层的左/中/右、上/中/下 */
    const tx = [0, CANVAS_W / 2, CANVAS_W];
    const ty = [0, CANVAS_H / 2, CANVAS_H];
    for (const o of this.layers) {
      if (o === L || o.hidden || o.locked) continue;
      tx.push(o.x - o.w / 2, o.x, o.x + o.w / 2);
      ty.push(o.y - o.h / 2, o.y, o.y + o.h / 2);
    }

    for (const t of tx) {
      for (const e of xs) {
        const d = t - e;
        if (Math.abs(d) <= T && (dxBest === null || Math.abs(d) < Math.abs(dxBest))) { dxBest = d; gx = t; }
      }
    }
    for (const t of ty) {
      for (const e of ys) {
        const d = t - e;
        if (Math.abs(d) <= T && (dyBest === null || Math.abs(d) < Math.abs(dyBest))) { dyBest = d; gy = t; }
      }
    }
    if (dxBest !== null) L.x += dxBest;
    if (dyBest !== null) L.y += dyBest;
    this._showGuides(gx, gy);
  }

  _showGuides(gx, gy) {
    if (this.guideV) {
      this.guideV.classList.toggle('hidden', gx === null);
      if (gx !== null) this.guideV.style.left = gx + 'px';
    }
    if (this.guideH) {
      this.guideH.classList.toggle('hidden', gy === null);
      if (gy !== null) this.guideH.style.top = gy + 'px';
    }
  }

  _onDblClick(e) {
    const p = this.toCanvasPoint(e);
    const hit = this.hitTest(p);
    if (!hit) return;
    if (hit.type === 'text') this.startTextEdit(hit);
  }

  /* ---------- 文字内联编辑 ---------- */
  startTextEdit(L) {
    const ta = this.textEditor;
    const apply = () => {
      const m = ta._metrics;
      const raw = ta.value;
      this.pushHistory();
      L.text = raw;
      /* 用编辑框真实尺寸回写（更准） */
      if (m) { L.fontSize = m.fontSize; }
      ta.classList.add('hidden');
      this._editing = false;
      this.selBox.classList.remove('hidden');
      ta.onblur = null;
      this.emit();
      this.onSelect && this.onSelect(L);
    };
    /* 先以无特效状态测量 */
    const probe = { ...L, background: { on: false }, stroke: { on: false }, shadow: { on: false }, glow: { on: false }, depth: { on: false }, gradient: null, color: '#fff' };
    const m = measureText(this.ctx, probe);
    ta._metrics = { fontSize: L.fontSize };
    const pad = 2;
    ta.style.left = (L.x - m.width / 2) + 'px';
    ta.style.top = (L.y - m.height / 2 - pad) + 'px';
    ta.style.width = m.width + 'px';
    ta.style.height = (m.height + pad * 2) + 'px';
    ta.style.fontFamily = `"${L.fontFamily}"`;
    ta.style.fontSize = L.fontSize + 'px';
    ta.style.lineHeight = L.lineHeight;
    ta.style.letterSpacing = L.letterSpacing + 'px';
    ta.style.fontStyle = L.italic ? 'italic' : 'normal';
    ta.style.transform = `rotate(${L.rotation}rad)`;
    ta.style.transformOrigin = 'center';
    ta.style.textAlign = L.align === 'left' ? 'left' : L.align === 'right' ? 'right' : 'center';
    ta.style.display = 'block';
    ta.classList.remove('hidden');
    ta.value = L.text;
    this._editing = true;
    this.selBox.classList.add('hidden');
    setTimeout(() => { ta.focus(); ta.select(); }, 0);
    ta.onblur = () => { if (this._editing) apply(); };
    ta.onkeydown = (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Escape') { ta.onblur = null; ta.classList.add('hidden'); this._editing = false; this.selBox.classList.remove('hidden'); }
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); apply(); }
    };
  }

  /* ---------- 选择框 ---------- */
  updateSelBox() {
    const L = this.selected;
    const box = this.selBox;
    if (!L) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.style.transform =
      `translate(${L.x - L.w / 2}px, ${L.y - L.h / 2}px) rotate(${L.rotation || 0}rad)`;
    box.style.width = L.w + 'px';
    box.style.height = L.h + 'px';
  }

  /* ---------- 缩放显示 ---------- */
  fitScale(stageW, stageH) {
    const s = Math.min((stageW - 80) / CANVAS_W, (stageH - 110) / CANVAS_H, 1);
    return Math.max(0.1, s);
  }
  setScale(s) {
    this.scale = Math.min(2, Math.max(0.1, s));
    this.applyScale();
  }
  applyScale() {
    const s = this.scale;
    this.canvas.style.transform = `scale(${s})`;
    this.overlay.style.transform = `scale(${s})`;
    this.overlay.style.width = CANVAS_W + 'px';
    this.overlay.style.height = CANVAS_H + 'px';
    const wrap = this.canvas.parentElement;
    wrap.style.width = CANVAS_W * s + 'px';
    wrap.style.height = CANVAS_H * s + 'px';
    this.updateSelBox();
  }

  /* ---------- 历史 ---------- */
  serialize() {
    return JSON.stringify({
      bg: this.bg,
      layers: this.layers.map(l => {
        const c = { ...l };
        delete c.image;
        return c;
      }),
    });
  }
  deserialize(str) {
    const data = JSON.parse(str);
    this.bg = data.bg;
    if (this.bg.mode === 'image' && this.bg.src) {
      this.bg.image = imgCache.get(this.bg.src) || null;
      if (!this.bg.image) loadImage(this.bg.src).then(img => { this.bg.image = img; this.render(); });
    }
    this.layers = data.layers;
    this.layers.forEach(l => {
      if (l.type === 'image') ensureImageFx(l);
      if (l.type === 'text') normalizeStrokes(l);
      if (l.src) l.image = imgCache.get(l.src) || null;
    });
    const missing = this.layers.filter(l => l.src && !l.image);
    if (missing.length) Promise.all(missing.map(l => loadImage(l.src).then(img => { l.image = img; }).catch(() => {}))).then(() => this.render());
    if (!this.layers.find(l => l.id === this.selectedId)) this.selectedId = null;
    this.emit();
    this.onSelect && this.onSelect(this.selected);
  }
  pushHistory() {
    const cur = this.serialize();
    if (this.history[this.history.length - 1] === cur) return;
    this.history.push(cur);
    if (this.history.length > 60) this.history.shift();
    this.future = [];
  }
  undo() {
    if (!this.history.length) return;
    this.future.push(this.serialize());
    this.deserialize(this.history.pop());
  }
  redo() {
    if (!this.future.length) return;
    this.history.push(this.serialize());
    this.deserialize(this.future.pop());
  }

  /* ---------- 导出 ---------- */
  exportImage(format = 'png', quality = 0.95) {
    const c = document.createElement('canvas');
    c.width = CANVAS_W; c.height = CANVAS_H;
    const ctx = c.getContext('2d');
    renderScene(ctx, this.bg, this.layers);
    return new Promise(resolve => c.toBlob(b => resolve({ blob: b, url: URL.createObjectURL(b) }), `image/${format}`, quality));
  }
}

/* ---------------- 工具 ---------------- */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
