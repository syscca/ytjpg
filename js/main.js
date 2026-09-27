/* ============================================================
 * ThumbForge — 主程序：面板 / 属性 / 上传 / 抠图 / 导出
 * ============================================================ */
import {
  Editor, renderScene, loadImage, fileToDataURL, CANVAS_W, CANVAS_H,
  makeTextLayer, makeShapeLayer, makeEmojiLayer,
  ensureImageFx, normalizeStrokes,
} from './editor.js';
import { TEMPLATES } from './templates.js';
import { FONTS, TEXT_PRESETS, SHAPES, EMOJI_TABS, BG_COLORS, BG_GRADIENTS } from './constants.js';
import { rmbgRemoveBackground, personRemoveBackground, chromaRemoveBackground } from './bg-removal.js';

/* ---------------- DOM ---------------- */
const $ = s => document.querySelector(s);
const canvas = $('#canvas'), overlay = $('#overlay'), selBox = $('#sel-box'), textEditor = $('#text-editor');
const stage = $('#canvas-stage');

const editor = new Editor({ canvas, overlay, selBox, textEditor });
window.__editor = editor; // 调试入口

/* ---------------- toast ---------------- */
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toast-wrap').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2200);
  setTimeout(() => el.remove(), 2600);
}

/* ---------------- 面板切换 ---------------- */
document.querySelectorAll('.rail-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.rail-btn').forEach(b => b.classList.toggle('active', b === btn));
    const p = btn.dataset.panel;
    document.querySelectorAll('.panel-content').forEach(c => c.classList.toggle('active', c.dataset.panel === p));
  });
});

/* ---------------- 缩放 ---------------- */
function updateZoomUI() {
  $('#zoom-label').textContent = Math.round(editor.scale * 100) + '%';
}
function fitCanvas() {
  editor.setScale(editor.fitScale(stage.clientWidth, stage.clientHeight));
  editor.applyScale();
  updateZoomUI();
}
$('#btn-zoom-fit').onclick = fitCanvas;
new ResizeObserver(fitCanvas).observe(stage);

/* 加减按固定档位走，保证一定能停在 100% */
const ZOOM_STEPS = [0.1, 0.15, 0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2];
function zoomStep(dir) {
  const s = editor.scale;
  const next = dir > 0
    ? ZOOM_STEPS.find(v => v > s + 0.001)
    : [...ZOOM_STEPS].reverse().find(v => v < s - 0.001);
  if (next !== undefined) { editor.setScale(next); updateZoomUI(); }
}
$('#btn-zoom-in').onclick = () => zoomStep(1);
$('#btn-zoom-out').onclick = () => zoomStep(-1);

/* 点击百分比可直接输入数值（10-200） */
$('#zoom-label').onclick = () => {
  const label = $('#zoom-label');
  const input = document.createElement('input');
  input.id = 'zoom-input';
  input.type = 'text';
  input.value = Math.round(editor.scale * 100);
  label.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const finish = ok => {
    if (done) return;
    done = true;
    if (ok) {
      const v = parseFloat(input.value);
      if (isFinite(v)) editor.setScale(v / 100);
    }
    input.replaceWith(label);
    updateZoomUI();
  };
  input.onkeydown = e => {
    e.stopPropagation();
    if (e.key === 'Enter') finish(true);
    else if (e.key === 'Escape') finish(false);
  };
  input.onblur = () => finish(true);
};

/* ---------------- 撤销重做 ---------------- */
$('#btn-undo').onclick = () => editor.undo();
$('#btn-redo').onclick = () => editor.redo();

/* ---------------- 模板 ---------------- */
function renderTemplateThumbnails() {
  const grid = $('#template-grid');
  grid.innerHTML = '';
  TEMPLATES.forEach(tpl => {
    const card = document.createElement('div');
    card.className = 'tpl-card';
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 144;
    const name = document.createElement('div');
    name.className = 'tpl-name';
    name.innerHTML = `<span>${tpl.name}</span><em>${tpl.tag}</em>`;
    card.append(cv, name);
    card.addEventListener('click', () => {
      editor.loadScene(tpl.build());
      toast(`已套用模板「${tpl.name}」，双击占位框可替换图片`, 'success');
    });
    grid.appendChild(card);
    const data = tpl.build();
    renderScene(cv.getContext('2d'), data.bg, data.layers, 256, 144);
  });
}

/* ---------------- 字体列表 / 文字预设 ---------------- */
function renderFontList() {
  const wrap = $('#font-list');
  wrap.innerHTML = '';
  FONTS.forEach(f => {
    const item = document.createElement('div');
    item.className = 'font-item';
    item.innerHTML = `
      <span class="sample" style="font-family:'${f.name}'">Agency</span>
      <span class="fname">${f.name}</span>`;
    item.title = f.desc;
    item.addEventListener('click', () => {
      editor.pushHistory();
      const L = makeTextLayer('YOUR TEXT', {
        fontFamily: f.name,
        fontSize: 92,
      });
      editor.add(L, { snap: false });
    });
    wrap.appendChild(item);
  });

  const presets = $('#text-presets');
  presets.innerHTML = '';
  TEXT_PRESETS.forEach(p => {
    const el = document.createElement('div');
    el.className = 'text-preset';
    el.style.background = p.bg;
    el.textContent = p.label;
    el.style.fontFamily = `'${p.make().fontFamily}'`;
    el.addEventListener('click', () => {
      editor.pushHistory();
      const L = makeTextLayer(p.label, { fontSize: 108, ...p.make() });
      editor.add(L, { snap: false });
    });
    presets.appendChild(el);
  });
}

/* ---------------- 形状 / Emoji ---------------- */
function renderShapes() {
  const grid = $('#shape-grid');
  grid.innerHTML = '';
  SHAPES.forEach(s => {
    const el = document.createElement('div');
    el.className = 'shape-item';
    el.innerHTML = `<svg viewBox="0 0 48 48">${s.svg}</svg>`;
    el.addEventListener('click', () => {
      editor.pushHistory();
      editor.add(makeShapeLayer(s.id), { snap: false });
    });
    grid.appendChild(el);
  });
}
function renderEmojis() {
  const tabs = $('#emoji-tabs'), grid = $('#emoji-grid');
  tabs.innerHTML = '';
  EMOJI_TABS.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'emoji-tab' + (i === 0 ? ' active' : '');
    b.textContent = t.label;
    b.onclick = () => {
      tabs.querySelectorAll('.emoji-tab').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      fill(t.emojis);
    };
    tabs.appendChild(b);
  });
  function fill(list) {
    grid.innerHTML = '';
    list.forEach(e => {
      const el = document.createElement('div');
      el.className = 'emoji-item';
      el.textContent = e;
      el.onclick = () => {
        editor.pushHistory();
        editor.add(makeEmojiLayer(e), { snap: false });
      };
      grid.appendChild(el);
    });
  }
  fill(EMOJI_TABS[0].emojis);
}

/* ---------------- 背景色板 ---------------- */
let bgMode = 'color';
function renderSwatches() {
  const box = $('#bg-swatches');
  box.innerHTML = '';
  const list = bgMode === 'color'
    ? BG_COLORS.map(c => ({ c, active: editor.bg.mode === 'color' && editor.bg.color === c }))
    : BG_GRADIENTS.map(g => {
        const c = `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`;
        return { c, g, active: editor.bg.mode === 'gradient' && editor.bg.from === g.from };
      });
  list.forEach(({ c, g, active }) => {
    const el = document.createElement('div');
    el.className = 'swatch' + (active ? ' active' : '');
    el.style.background = c;
    el.onclick = () => editor.setBackground(g ? { mode: 'gradient', ...g } : { mode: 'color', color: c });
    box.appendChild(el);
  });
}
document.querySelectorAll('.seg[data-bg]').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.seg[data-bg]').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    bgMode = b.dataset.bg;
    renderSwatches();
  };
});
$('#btn-clear-canvas').onclick = () => {
  if (confirm('确定清空画布上的所有元素吗？')) { editor.clearAll(); toast('画布已清空'); }
};

/* ---------------- 上传 ---------------- */
const fileInput = $('#file-input');
let uploadMode = 'asset';
$('#btn-add-bg').onclick = () => { uploadMode = 'bg'; fileInput.click(); };
$('#btn-add-asset').onclick = () => { uploadMode = 'asset'; fileInput.click(); };
$('#dropzone').onclick = () => { uploadMode = 'asset'; };
fileInput.addEventListener('change', async () => {
  const files = [...fileInput.files];
  fileInput.value = '';
  if (!files.length) return;
  for (let i = 0; i < files.length; i++) {
    const mode = i === 0 ? uploadMode : 'asset';
    const L = await editor.addImageFile(files[i], mode);
    if (L && i === 0) toast('图片已添加，选中后到「抠图」面板可一键去背景', 'success');
  }
});
['dragenter', 'dragover'].forEach(ev =>
  $('#dropzone').addEventListener(ev, e => { e.preventDefault(); $('#dropzone').classList.add('drag'); }));
['dragleave', 'drop'].forEach(ev =>
  $('#dropzone').addEventListener(ev, e => { e.preventDefault(); $('#dropzone').classList.remove('drag'); }));
$('#dropzone').addEventListener('drop', async e => {
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
  for (const f of files) await editor.addImageFile(f, 'asset');
  if (files.length) toast(`已添加 ${files.length} 张图片`, 'success');
});

/* 替换占位框 / 图片 */
const replaceInput = document.createElement('input');
replaceInput.type = 'file';
replaceInput.accept = 'image/*';
replaceInput.hidden = true;
document.body.appendChild(replaceInput);
let replaceTarget = null;
replaceInput.addEventListener('change', async () => {
  const f = replaceInput.files[0];
  replaceInput.value = '';
  if (!f || !replaceTarget) return;
  const src = await fileToDataURL(f);
  const L = replaceTarget;
  const wasCircle = L.placeholder && L.shape === 'ellipse';
  await editor.replaceLayerImage(L, src);
  if (wasCircle) { L.radius = Math.min(L.w, L.h) / 2; editor.render(); }
  toast('图片已替换', 'success');
});
canvas.addEventListener('dblclick', e => {
  const hit = editor.hitTest(editor.toCanvasPoint(e));
  if (hit && hit.placeholder) {
    replaceTarget = hit;
    replaceInput.click();
  }
});

/* ---------------- 抠图面板 ---------------- */
function refreshCutoutPanel() {
  const L = editor.selected;
  const isImg = L && L.type === 'image';
  $('#cutout-idle').classList.toggle('hidden', !!isImg);
  $('#cutout-controls').classList.toggle('hidden', !isImg);
}

/* 智能抠图参数 */
let cutEngine = 'rmbg';   // rmbg = 高清最强模型 / person = 极速人像
let personModel = 0;
let personFeather = 2;
let personThreshold = 24;

const FEATHER_DEFAULT = { rmbg: 2, person: 3 };
const THR_DEFAULT = { rmbg: 24, person: 42 };

function setCutEngine(eng) {
  cutEngine = eng;
  $('#seg-engine-rmbg').classList.toggle('active', eng === 'rmbg');
  $('#seg-engine-person').classList.toggle('active', eng === 'person');
  $('#person-mode-row').classList.toggle('hidden', eng !== 'person');
  $('#engine-hint').classList.toggle('hidden', eng !== 'rmbg');
  personFeather = FEATHER_DEFAULT[eng];
  personThreshold = THR_DEFAULT[eng];
  $('#person-feather').value = personFeather; $('#person-feather-val').textContent = personFeather;
  $('#person-thr').value = personThreshold; $('#person-thr-val').textContent = personThreshold;
}
$('#seg-engine-rmbg').onclick = () => setCutEngine('rmbg');
$('#seg-engine-person').onclick = () => setCutEngine('person');
$('#seg-model-0').onclick = () => {
  personModel = 0;
  $('#seg-model-0').classList.add('active'); $('#seg-model-1').classList.remove('active');
};
$('#seg-model-1').onclick = () => {
  personModel = 1;
  $('#seg-model-1').classList.add('active'); $('#seg-model-0').classList.remove('active');
};
$('#person-feather').oninput = e => { personFeather = +e.target.value; $('#person-feather-val').textContent = personFeather; };
$('#person-thr').oninput = e => { personThreshold = +e.target.value; $('#person-thr-val').textContent = personThreshold; };

$('#btn-ai-cutout').onclick = async () => {
  const L = editor.selected;
  if (!L || L.type !== 'image' || !L.image) return;
  const btn = $('#btn-ai-cutout');
  const prog = $('#ai-progress'), fill = $('#ai-progress-fill'), txt = $('#ai-progress-text');
  btn.disabled = true;
  prog.classList.remove('hidden');
  fill.style.width = '4%';
  txt.textContent = cutEngine === 'rmbg' ? '准备高清模型…' : '准备人像模型…';
  try {
    if (!L._originalSrc) L._originalSrc = L.src;
    const opts = { feather: personFeather, threshold: personThreshold };
    const { dataUrl, stats } = cutEngine === 'rmbg'
      ? await rmbgRemoveBackground(L.image, opts, (p, msg) => { fill.style.width = Math.round(p * 100) + '%'; txt.textContent = msg; })
      : await personRemoveBackground(L.image, { ...opts, modelSelection: personModel },
          (p, msg) => { fill.style.width = Math.round(p * 100) + '%'; txt.textContent = msg; });
    editor.pushHistory();
    await editor.updateLayerImage(L, dataUrl);
    /* 抠图完成后默认开启白色轮廓描边，一键得到 VLOG 封面常见的贴纸人效果 */
    L.fx.outline.on = true;
    if (editor.selected === L) renderProps(L);
    toast(`抠图完成（去除背景 ${Math.round(stats.transparentRatio * 100)}%），已自动加白色描边，可在右侧「抠图特效」调整`, 'success');
  } catch (err) {
    console.error(err);
    if (err.message === 'NO_PERSON') {
      toast('未检测到清晰人像：请换「全身/多人」模式，或改用「高清 AI」模型', 'error');
    } else if (err.message === 'NO_SUBJECT') {
      toast('未识别到明确主体，请确认主体与背景有一定对比后重试', 'error');
    } else if (err.message === 'NO_EFFECT') {
      toast('分割异常未生效，可改用「色度键抠图」', 'error');
    } else {
      toast('本地抠图引擎启动失败：' + err.message, 'error');
    }
  } finally {
    btn.disabled = false;
    setTimeout(() => prog.classList.add('hidden'), 1500);
  }
};

let chromaTol = 42, chromaFeather = 18;
$('#chroma-tol').oninput = e => { chromaTol = +e.target.value; $('#chroma-tol-val').textContent = chromaTol; };
$('#chroma-feather').oninput = e => { chromaFeather = +e.target.value; $('#chroma-feather-val').textContent = chromaFeather; };
$('#btn-chroma-cutout').onclick = async () => {
  const L = editor.selected;
  if (!L || L.type !== 'image' || !L.image) return;
  try {
    if (!L._originalSrc) L._originalSrc = L.src;
    const dataUrl = await chromaRemoveBackground(L.image, { tolerance: chromaTol, feather: chromaFeather });
    editor.pushHistory();
    await editor.updateLayerImage(L, dataUrl);
    toast('色度键抠图完成，可调容差后重试', 'success');
  } catch (err) {
    console.error(err);
    toast('抠图失败：' + err.message, 'error');
  }
};
$('#btn-restore-original').onclick = async () => {
  const L = editor.selected;
  if (!L || !L._originalSrc) return;
  editor.pushHistory();
  await editor.updateLayerImage(L, L._originalSrc);
  L._originalSrc = null;
  toast('已恢复原图');
};

/* ============================================================
 * 右侧属性面板
 * ============================================================ */
const propBody = $('#prop-body'), propEmpty = $('#prop-empty');

const hx = (hex, a) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000');
  if (!m) return hex;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
};
const alphaOf = v => {
  const m = /rgba?\(([^)]+)\)/.exec(v || '');
  if (!m) return 1;
  const parts = m[1].split(',');
  return parts.length === 4 ? (+parts[3].trim() || 1) : 1;
};
const baseHex = v => {
  const m = /rgba?\(([^)]+)\)/.exec(v || '');
  if (!m) return v || '#000000';
  const [r, g, b] = m[1].split(',').map(x => +x);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

/* 在控件开始交互前保存一次历史 */
function arm(el) {
  const save = () => editor.pushHistory();
  el.addEventListener('pointerdown', save, { once: true });
  el.addEventListener('focus', save, { once: true });
}
function toggleRow(label, checked, onchange) {
  const id = 'sw' + Math.random().toString(36).slice(2, 8);
  setTimeout(() => {
    const i = document.getElementById(id);
    /* 面板已被重建（旧标记脱离 DOM）时放弃本次绑定，避免抛异常导致控件失活 */
    if (!i) return;
    i.addEventListener('change', () => { editor.pushHistory(); onchange(i.checked); editor.render(); });
  }, 0);
  return `<div class="toggle-row"><span>${label}</span>
    <label class="switch"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}><i></i></label></div>`;
}
function rangeField(label, value, min, max, step, oninput) {
  const id = 'rg' + Math.random().toString(36).slice(2, 9);
  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    arm(el);
    el.addEventListener('input', () => {
      const v = +el.value;
      el.previousElementSibling.querySelector('span').textContent = v;
      oninput(v);
      editor.render();
    });
  }, 0);
  return `<div class="field"><label>${label}<span>${value}</span></label>
    <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
}
function colorField(label, value, oninput) {
  const id = 'co' + Math.random().toString(36).slice(2, 9);
  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    arm(el);
    el.addEventListener('input', () => { oninput(el.value); editor.render(); });
  }, 0);
  return `<div class="field"><label>${label}</label>
    <div class="color-row"><input type="color" id="${id}" value="${baseHex(value)}"></div></div>`;
}

function layerOps(L) {
  return `<div class="prop-head">
    <b>${typeName(L)}</b>
    <div class="layer-ops">
      <button title="上移一层" id="op-up">↑</button>
      <button title="下移一层" id="op-down">↓</button>
      <button title="水平翻转" id="op-fliph">⇋</button>
      <button title="复制 Ctrl+D" id="op-dup">⧉</button>
      <button title="删除 Del" class="del" id="op-del">✕</button>
    </div></div>`;
}
function typeName(L) {
  return { image: '图片', text: '文字', shape: L.placeholder ? '图片占位' : '形状', emoji: '贴纸' }[L.type] || '元素';
}
function bindOps(L) {
  /* layers 数组按「从底到顶」顺序绘制：索引 +1 即视觉上移一层 */
  $('#op-up').onclick = () => editor.moveLayer(L.id, 1);
  $('#op-down').onclick = () => editor.moveLayer(L.id, -1);
  $('#op-fliph').onclick = () => editor.flip(L.id, 'h');
  $('#op-dup').onclick = () => editor.duplicate(L.id);
  $('#op-del').onclick = () => editor.remove(L.id);
}
function transformGroup(L) {
  return `<div class="prop-group"><h4>变换</h4>
    ${rangeField('旋转', Math.round((L.rotation || 0) * 180 / Math.PI), -180, 180, 1, v => L.rotation = v * Math.PI / 180)}
    ${rangeField('不透明度', Math.round((L.opacity ?? 1) * 100), 0, 100, 1, v => L.opacity = v / 100)}
    ${L.type !== 'emoji' ? '' : rangeField('大小', Math.round(L.w), 40, 520, 1, v => { L.w = v; L.h = v; })}
  </div>`;
}
const MINI_COLORS = ['#ffffff', '#000000', '#ff3b30', '#ffb224', '#ffd400', '#34c759', '#00e5ff', '#007aff', '#8b5cf6', '#ff2d92'];
function miniSwatches(current, onpick) {
  return `<div class="mini-swatches">${MINI_COLORS.map(c =>
    `<div class="mini-sw ${c === current ? 'active' : ''}" style="background:${c}" data-c="${c}"></div>`).join('')}</div>`;
}
function bindMini(scope, onpick) {
  scope.querySelectorAll('.mini-sw').forEach(s => s.onclick = () => {
    editor.pushHistory();
    scope.querySelectorAll('.mini-sw').forEach(x => x.classList.remove('active'));
    s.classList.add('active');
    onpick(s.dataset.c);
    editor.render();
  });
}

/* ---------- 图片属性 ---------- */
function renderImageProps(L) {
  const isPh = L.placeholder;
  const fx = ensureImageFx(L);
  let html = layerOps(L);
  if (isPh) {
    html += `<div class="prop-group">
      <button class="btn-block primary" id="ph-replace">🖼 替换为我的图片</button>
      <p style="font-size:11px;color:var(--txt-3);margin-top:8px;line-height:1.6">替换后自动按占位框比例裁剪。</p>
    </div>`;
  } else {
    html += `<div class="prop-group"><h4>图片</h4>
      <button class="btn-block" id="img-replace" style="margin-bottom:10px">更换图片</button>
      <div class="field-row">
        <button class="seg ${L.fit === 'cover' ? 'active' : ''}" data-fit="cover">填满裁剪</button>
        <button class="seg ${L.fit === 'contain' ? 'active' : ''}" data-fit="contain">完整显示</button>
        <button class="seg ${L.fit === 'fill' ? 'active' : ''}" data-fit="fill">拉伸</button>
      </div>
      ${rangeField('圆角', L.radius, 0, 400, 1, v => L.radius = v)}
    </div>
    <div class="prop-group"><h4>抠图特效</h4>
      <p style="font-size:10.5px;color:var(--txt-3);line-height:1.6;margin:-4px 0 9px">基于抠图后的透明边缘生成，抠完图默认开启白色描边。</p>
      ${toggleRow('轮廓描边', fx.outline.on, v => fx.outline.on = v)}
      <div id="fx-outline-box" class="${fx.outline.on ? '' : 'hidden'}">
        ${colorField('描边颜色', fx.outline.color, v => fx.outline.color = v)}
        ${miniSwatches(fx.outline.color, c => fx.outline.color = c)}
        ${rangeField('描边粗细', fx.outline.width, 1, 80, 1, v => fx.outline.width = v)}
        ${rangeField('描边不透明度', fx.outline.alpha, 10, 100, 1, v => fx.outline.alpha = v)}
      </div>
      ${toggleRow('投影', fx.shadow.on, v => fx.shadow.on = v)}
      <div id="fx-shadow-box" class="${fx.shadow.on ? '' : 'hidden'}">
        ${colorField('投影颜色', fx.shadow.color, v => fx.shadow.color = v)}
        ${rangeField('投影浓度', fx.shadow.alpha, 5, 100, 1, v => fx.shadow.alpha = v)}
        ${rangeField('投影模糊', fx.shadow.blur, 0, 100, 1, v => fx.shadow.blur = v)}
        ${rangeField('横向偏移', fx.shadow.dx, -60, 60, 1, v => fx.shadow.dx = v)}
        ${rangeField('纵向偏移', fx.shadow.dy, -60, 60, 1, v => fx.shadow.dy = v)}
      </div>
      ${toggleRow('外发光', fx.glow.on, v => fx.glow.on = v)}
      <div id="fx-glow-box" class="${fx.glow.on ? '' : 'hidden'}">
        ${colorField('发光颜色', fx.glow.color, v => fx.glow.color = v)}
        ${miniSwatches(fx.glow.color, c => fx.glow.color = c)}
        ${rangeField('发光强度', fx.glow.alpha, 10, 100, 1, v => fx.glow.alpha = v)}
        ${rangeField('发光范围', fx.glow.blur, 2, 100, 1, v => fx.glow.blur = v)}
      </div>
    </div>
    <div class="prop-group"><h4>滤镜调整</h4>
      ${rangeField('亮度', L.filters.brightness, 0, 200, 1, v => L.filters.brightness = v)}
      ${rangeField('对比度', L.filters.contrast, 0, 200, 1, v => L.filters.contrast = v)}
      ${rangeField('饱和度', L.filters.saturate, 0, 200, 1, v => L.filters.saturate = v)}
      ${rangeField('模糊', L.filters.blur, 0, 30, 0.5, v => L.filters.blur = v)}
      <div class="field-2col">
        <button class="btn-block ghost" id="img-flipv">垂直翻转</button>
        <button class="btn-block ghost" id="img-cutout">去抠图面板</button>
      </div>
    </div>`;
  }
  html += transformGroup(L);
  propBody.innerHTML = html;
  bindOps(L);
  if (isPh) {
    $('#ph-replace').onclick = () => { replaceTarget = L; replaceInput.click(); };
  } else {
    $('#img-replace').onclick = () => { replaceTarget = L; replaceInput.click(); };
    propBody.querySelectorAll('[data-fit]').forEach(b => b.onclick = () => {
      editor.pushHistory(); L.fit = b.dataset.fit; editor.render(); renderProps(L);
    });
    $('#img-flipv').onclick = () => editor.flip(L.id, 'v');
    $('#img-cutout').onclick = () => document.querySelector('.rail-btn[data-panel="cutout"]').click();
    /* 特效折叠 */
    [['#fx-outline-box', fx.outline.on], ['#fx-shadow-box', fx.shadow.on], ['#fx-glow-box', fx.glow.on]]
      .forEach(([sel]) => {
        const box = $(sel);
        const inp = box?.previousElementSibling?.querySelector('input');
        inp?.addEventListener('change', () => setTimeout(() => box.classList.toggle('hidden', !inp.checked), 0));
      });
    bindMini($('#fx-outline-box'), c => { fx.outline.color = c; });
    bindMini($('#fx-glow-box'), c => { fx.glow.color = c; });
  }
}

/* ---------- 文字属性 ---------- */
function renderTextProps(L) {
  let html = layerOps(L);
  html += `<div class="prop-group"><h4>文字内容</h4>
    <div class="field"><textarea id="tp-text" rows="2">${L.text.replace(/</g, '&lt;')}</textarea></div>
    <div class="field">
      <select id="tp-font" class="font-select">
        ${FONTS.map(f => `<option value="${f.name}" ${L.fontFamily === f.name ? 'selected' : ''} style="font-family:'${f.name}'">${f.name}</option>`).join('')}
      </select>
    </div>
    ${rangeField('字号', L.fontSize, 8, 300, 1, v => L.fontSize = v)}
    <div class="op-grid" id="tp-align">
      ${['left', 'center', 'right'].map(a =>
        `<button class="op-btn ${L.align === a ? 'active' : ''}" data-a="${a}">${a === 'left' ? '左对齐' : a === 'center' ? '居中' : '右对齐'}</button>`).join('')}
    </div>
  </div>

  <div class="prop-group"><h4>填充</h4>
    <div class="field-row">
      <button class="seg ${!L.gradient ? 'active' : ''}" id="fill-solid">纯色</button>
      <button class="seg ${L.gradient ? 'active' : ''}" id="fill-grad">渐变</button>
    </div>
    <div id="fill-solid-box" class="${L.gradient ? 'hidden' : ''}">${colorField('文字颜色', L.color, v => L.color = v)}${miniSwatches(baseHex(L.color), c => { L.color = c; })}</div>
    <div id="fill-grad-box" class="${L.gradient ? '' : 'hidden'}">
      ${colorField('渐变起始', L.gradient?.from || '#ffe600', v => L.gradient && (L.gradient.from = v))}
      ${colorField('渐变结束', L.gradient?.to || '#ff3b30', v => L.gradient && (L.gradient.to = v))}
      ${rangeField('渐变角度', L.gradient?.angle ?? 90, 0, 360, 1, v => { if (L.gradient) L.gradient.angle = v; })}
    </div>
  </div>

  <div class="prop-group"><h4>特效</h4>
    ${toggleRow('多层描边', L.stroke.on, v => {
      L.stroke.on = v;
      if (v && !L.strokes.length) L.strokes.push({ color: '#000000', width: 8 });
    })}
    <div id="stroke-box" class="${L.stroke.on ? '' : 'hidden'}">
      <p style="font-size:10px;color:var(--txt-3);line-height:1.5;margin:-2px 0 8px">从上到下依次为<b>外层 → 内层</b>，典型做法：外层粗深色、内层细浅色。</p>
      <div id="stroke-layers">
      ${normalizeStrokes(L).map((s, i) => `
        <div class="stroke-layer" data-i="${i}">
          <span class="layer-tag">第${i + 1}层</span>
          ${colorField('颜色', s.color, v => L.strokes[i].color = v)}
          <div class="sw">${rangeField('粗细', s.width, 0, 60, 1, v => L.strokes[i].width = v)}</div>
          <button class="mini-btn s-up" data-i="${i}" title="上移（更靠外）">↑</button>
          <button class="mini-btn s-down" data-i="${i}" title="下移（更靠内）">↓</button>
          <button class="mini-btn del s-del" data-i="${i}" title="删除该层">✕</button>
        </div>`).join('')}
      </div>
      <button class="btn-block ghost btn-add-stroke" id="btn-add-stroke">＋ 添加描边层（最多 5 层）</button>
    </div>
    ${toggleRow('阴影', L.shadow.on, v => L.shadow.on = v)}
    <div id="shadow-box" class="${L.shadow.on ? '' : 'hidden'}">
      ${colorField('阴影颜色', L.shadow.color, v => L.shadow.color = hx(v, alphaOf(L.shadow.color)))}
      ${rangeField('阴影浓度', Math.round(alphaOf(L.shadow.color) * 100), 5, 100, 1,
        v => L.shadow.color = hx(baseHex(L.shadow.color), v / 100))}
      ${rangeField('模糊', L.shadow.blur, 0, 80, 1, v => L.shadow.blur = v)}
      ${rangeField('横向偏移', L.shadow.dx, -40, 40, 1, v => L.shadow.dx = v)}
      ${rangeField('纵向偏移', L.shadow.dy, -40, 40, 1, v => L.shadow.dy = v)}
    </div>
    ${toggleRow('外发光', L.glow.on, v => L.glow.on = v)}
    <div id="glow-box" class="${L.glow.on ? '' : 'hidden'}">
      ${colorField('发光颜色', L.glow.color, v => L.glow.color = v)}
      ${rangeField('发光强度', L.glow.blur, 0, 80, 1, v => L.glow.blur = v)}
    </div>
    ${toggleRow('3D 立体', L.depth.on, v => L.depth.on = v)}
    <div id="depth-box" class="${L.depth.on ? '' : 'hidden'}">
      ${colorField('3D 颜色', L.depth.color, v => L.depth.color = v)}
      ${rangeField('3D 厚度', L.depth.thickness, 2, 60, 1, v => L.depth.thickness = v)}
    </div>
  </div>

  <div class="prop-group"><h4>排版</h4>
    ${rangeField('字间距', L.letterSpacing, -10, 40, 1, v => L.letterSpacing = v)}
    ${rangeField('行高', Math.round(L.lineHeight * 100), 70, 180, 1, v => L.lineHeight = v / 100)}
    ${rangeField('弧形弯曲', L.arc, -100, 100, 1, v => L.arc = v)}
    ${toggleRow('斜体', L.italic, v => L.italic = v)}
    ${toggleRow('强制大写', L.uppercase, v => L.uppercase = v)}
    ${toggleRow('背景标签', L.background.on, v => L.background.on = v)}
    <div id="bg-label-box" class="${L.background.on ? '' : 'hidden'}">
      ${colorField('标签颜色', L.background.color, v => L.background.color = v)}
      ${rangeField('内边距', L.background.padding, 0, 80, 1, v => L.background.padding = v)}
      ${rangeField('圆角', L.background.radius, 0, 80, 1, v => L.background.radius = v)}
    </div>
  </div>
  ${transformGroup(L)}`;

  propBody.innerHTML = html;
  bindOps(L);

  /* 内容 */
  const ta = $('#tp-text');
  arm(ta);
  ta.addEventListener('input', () => { L.text = ta.value; editor.render(); });

  /* 字体 */
  const fs = $('#tp-font');
  fs.addEventListener('change', () => { editor.pushHistory(); L.fontFamily = fs.value; editor.render(); });

  /* 对齐 */
  propBody.querySelectorAll('#tp-align .op-btn').forEach(b => b.onclick = () => {
    editor.pushHistory(); L.align = b.dataset.a; editor.render(); renderProps(L);
  });

  /* 填充切换 */
  $('#fill-solid').onclick = () => {
    editor.pushHistory(); L.gradient = null; editor.render(); renderProps(L);
  };
  $('#fill-grad').onclick = () => {
    editor.pushHistory();
    if (!L.gradient) L.gradient = { from: '#ffe600', to: '#ff3b30', angle: 90 };
    editor.render(); renderProps(L);
  };

  /* 文字填充预设色（仅绑定纯色区，点击后同步自定义颜色选择器） */
  bindMini($('#fill-solid-box'), c => {
    L.color = c;
    const ci = $('#fill-solid-box').querySelector('input[type=color]');
    if (ci) ci.value = c;
  });

  /* 多层描边：增 / 删 / 排序（结构变化重渲染面板） */
  $('#btn-add-stroke').onclick = () => {
    if (L.strokes.length >= 5) { toast('最多支持 5 层描边'); return; }
    editor.pushHistory();
    const palette = ['#000000', '#ffffff', '#ff3b30', '#ffd400', '#007aff'];
    const lastW = L.strokes.length ? L.strokes[L.strokes.length - 1].width : 8;
    L.strokes.push({ color: palette[L.strokes.length % palette.length], width: Math.max(2, lastW - 4) });
    L.stroke.on = true;
    editor.render(); renderProps(L);
  };
  const swapStroke = (i, j) => {
    if (j < 0 || j >= L.strokes.length) return;
    editor.pushHistory();
    [L.strokes[i], L.strokes[j]] = [L.strokes[j], L.strokes[i]];
    editor.render(); renderProps(L);
  };
  propBody.querySelectorAll('.s-up').forEach(b => b.onclick = () => swapStroke(+b.dataset.i, +b.dataset.i - 1));
  propBody.querySelectorAll('.s-down').forEach(b => b.onclick = () => swapStroke(+b.dataset.i, +b.dataset.i + 1));
  propBody.querySelectorAll('.s-del').forEach(b => b.onclick = () => {
    editor.pushHistory();
    L.strokes.splice(+b.dataset.i, 1);
    editor.render(); renderProps(L);
  });

  /* 特效折叠：等 toggleRow 的 change 回调更新完数据后再同步显隐 */
  propBody.querySelectorAll('.switch input').forEach(inp => {
    inp.addEventListener('change', () => setTimeout(() => {
      $('#stroke-box')?.classList.toggle('hidden', !L.stroke.on);
      $('#shadow-box')?.classList.toggle('hidden', !L.shadow.on);
      $('#glow-box')?.classList.toggle('hidden', !L.glow.on);
      $('#depth-box')?.classList.toggle('hidden', !L.depth.on);
      $('#bg-label-box')?.classList.toggle('hidden', !L.background.on);
    }, 0));
  });
}

/* ---------- 形状属性 ---------- */
function renderShapeProps(L) {
  let html = layerOps(L);
  html += `<div class="prop-group"><h4>填充</h4>
    ${colorField('填充颜色', L.fill, v => L.fill = v)}
    ${miniSwatches(baseHex(L.fill), c => L.fill = c)}
  </div>
  <div class="prop-group"><h4>描边</h4>
    ${toggleRow('启用描边', L.stroke.on, v => L.stroke.on = v)}
    ${colorField('描边颜色', L.stroke.color, v => L.stroke.color = v)}
    ${rangeField('描边宽度', L.stroke.width, 0, 60, 1, v => L.stroke.width = v)}
  </div>
  ${transformGroup(L)}`;
  propBody.innerHTML = html;
  bindOps(L);
  bindMini(propBody, c => L.fill = c);
}

/* ---------- Emoji 属性 ---------- */
function renderEmojiProps(L) {
  propBody.innerHTML = layerOps(L) + transformGroup(L);
  bindOps(L);
}

function renderProps(L) {
  if (!L) {
    propBody.classList.add('hidden');
    propEmpty.classList.remove('hidden');
    refreshCutoutPanel();
    return;
  }
  propEmpty.classList.add('hidden');
  propBody.classList.remove('hidden');
  if (L.type === 'image' || L.placeholder) renderImageProps(L);
  else if (L.type === 'text') renderTextProps(L);
  else if (L.type === 'shape') renderShapeProps(L);
  else if (L.type === 'emoji') renderEmojiProps(L);
}
editor.onSelect = renderProps;

/* ---------------- 导出 ---------------- */
const exportModal = $('#export-modal');
$('#btn-export').onclick = async () => {
  const { url } = await editor.exportImage('png', 0.95);
  $('#export-preview-img').src = url;
  exportModal.classList.remove('hidden');
};
$('#btn-export-cancel').onclick = () => exportModal.classList.add('hidden');
$('#export-q').oninput = e => $('#export-q-val').textContent = (+e.target.value).toFixed(2);
$('#btn-export-confirm').onclick = async () => {
  const fmt = document.querySelector('input[name="export-fmt"]:checked').value;
  const q = +$('#export-q').value;
  const { url } = await editor.exportImage(fmt, q);
  const a = document.createElement('a');
  a.href = url;
  a.download = `youtube-cover-1280x720.${fmt === 'jpeg' ? 'jpg' : 'png'}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  exportModal.classList.add('hidden');
  toast('封面已导出（1280×720）', 'success');
};

/* ---------------- 启动 ---------------- */
function init() {
  fitCanvas();
  renderTemplateThumbnails();
  renderFontList();
  renderShapes();
  renderEmojis();
  renderSwatches();
  editor.onSceneChange = () => {
    $('#btn-undo').disabled = !editor.history.length;
    $('#btn-redo').disabled = !editor.future.length;
    refreshCutoutPanel();
    renderSwatches();
  };
  /* 字体加载完成后重绘（模板缩略图 + 画布） */
  document.fonts.ready.then(() => {
    renderTemplateThumbnails();
    editor.loadScene(TEMPLATES[0].build(), { snap: false });
    editor.render();
  });
  refreshCutoutPanel();
}
init();
