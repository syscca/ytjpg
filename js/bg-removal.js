/* ============================================================
 * 抠图模块（全部本地运行，无需联网）
 *  1) 高清智能抠图：RMBG-1.4（IS-Net, 44M 参数）
 *     ONNX Runtime Web（WASM）本地推理，人物 / 商品 / 宠物 /
 *     物体通用，发丝级边缘。权重与运行时均在 vendor/rmbg/ 内。
 *     注意：RMBG-1.4 为 BRIA AI「非商业使用」授权。
 *  2) 极速人像抠图：MediaPipe Selfie Segmentation（Apache-2.0，可商用）
 *     近景自拍 / 广角全身两种模型，适合快速处理人像。
 *  3) 色度键抠图：纯色 / 绿幕背景，容差 + 羽化 + 溢色抑制。
 *  所有输出均为带软边的透明 PNG，并通过 alpha 质量门禁拦截废片。
 * ============================================================ */

const MEDIAPIPE_BASE = new URL('../vendor/selfie_segmentation/', import.meta.url).href;
const RMBG_BASE = new URL('../vendor/rmbg/', import.meta.url).href;

/* ============================================================
 * 通用工具
 * ============================================================ */
function imageToCanvas(img, maxSide = 1600) {
  const c = document.createElement('canvas');
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const k = Math.min(1, maxSide / Math.max(iw, ih));
  c.width = Math.max(1, Math.round(iw * k));
  c.height = Math.max(1, Math.round(ih * k));
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/**
 * 把灰度 mask（Uint8，白=前景）合成进源画布的 alpha 通道
 * @param {HTMLCanvasElement} src 源画布（会被改写 alpha）
 * @param {HTMLCanvasElement} maskCanvas 与 src 同尺寸的灰度画布
 * @param {object} opts { feather 0-12, threshold 10-120 }
 * @returns {object} alpha 统计
 */
function compositeMask(src, maskCanvas, { feather = 3, threshold = 42 } = {}) {
  const ctx = src.getContext('2d');
  const w = src.width, h = src.height;

  if (feather > 0) {
    const blurred = document.createElement('canvas');
    blurred.width = w; blurred.height = h;
    const bctx = blurred.getContext('2d');
    bctx.filter = `blur(${feather}px)`;
    bctx.drawImage(maskCanvas, 0, 0);
    maskCanvas = blurred;
  }
  const md = maskCanvas.getContext('2d').getImageData(0, 0, w, h).data;

  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;
  const lo = Math.min(threshold, 120);
  const hi = 255 - lo;
  let fgCount = 0, transparentCount = 0, edgeCount = 0;
  for (let i = 0; i < d.length; i += 4) {
    const conf = md[i];
    let a;
    if (conf <= lo) a = 0;
    else if (conf >= hi) a = 255;
    else a = Math.round(((conf - lo) / (hi - lo)) * 255);
    const finalA = Math.min(d[i + 3], a);
    d[i + 3] = finalA;
    if (finalA < 2) transparentCount++;
    else if (finalA > 250) fgCount++;
    else edgeCount++;
  }
  ctx.putImageData(frame, 0, 0);

  const total = w * h;
  return {
    fgRatio: +(fgCount / total).toFixed(4),
    transparentRatio: +(transparentCount / total).toFixed(4),
    edgeRatio: +(edgeCount / total).toFixed(4),
    width: w, height: h,
  };
}

/** alpha 质量门禁 */
function gate(stats) {
  if (stats.fgRatio < 0.008) {
    const err = new Error('NO_SUBJECT');
    err.stats = stats;
    throw err;
  }
  if (stats.transparentRatio < 0.02 && stats.edgeRatio < 0.002) {
    const err = new Error('NO_EFFECT');
    err.stats = stats;
    throw err;
  }
}

/* ============================================================
 * 引擎一：RMBG-1.4 高清模型（transformers.js + ONNX Runtime Web）
 * ============================================================ */
let tfPromise = null;
let rmbgModelPromise = null;

function loadTransformers() {
  if (tfPromise) return tfPromise;
  tfPromise = (async () => {
    const tf = await import(RMBG_BASE + 'transformers.min.js');
    /* 自托管模型：v2 的文件 URL = remoteHost + remotePathTemplate(模型id) + 文件路径。
       host 取本站源、模型 id 取站点相对路径，最终只 fetch vendor/rmbg/
       下的文件（config / onnx / preprocessor），零外网请求。 */
    tf.env.allowLocalModels = true;
    tf.env.allowRemoteModels = true;
    tf.env.remoteHost = self.location.origin;
    tf.env.remotePathTemplate = '{model}/';
    tf.env.backends.onnx.wasm.wasmPaths = new URL('wasm/', RMBG_BASE).href;
    tf.env.backends.onnx.wasm.numThreads = self.crossOriginIsolated ? 4 : 1;
    return tf;
  })();
  return tfPromise;
}

async function getRmbg(onProgress) {
  if (rmbgModelPromise) return rmbgModelPromise;
  rmbgModelPromise = (async () => {
    const tf = await loadTransformers();
    onProgress?.(0.05, '加载高清抠图模型（约 44MB，仅首次）…');
    /* 站点相对路径（去掉开头斜杠），配合 env.remoteHost=origin 拼出同源 URL */
    const modelId = new URL('model/', RMBG_BASE).pathname.replace(/^\//, '');
    /* BriaRMBG 是自定义架构，config 显式指定 custom 走通用 ONNX 推理 */
    const model = await tf.AutoModel.from_pretrained(modelId, {
      quantized: true,
      config: { model_type: 'custom' },
      progress_callback: p => {
        if (p.status === 'progress' && p.total) {
          onProgress?.(0.05 + 0.55 * (p.progress || 0) / 100, `加载模型 ${Math.round((p.progress || 0))}%`);
        }
      },
    });
    onProgress?.(0.62, '初始化图像处理器…');
    const processor = await tf.AutoProcessor.from_pretrained(modelId);
    return { tf, model, processor };
  })();
  return rmbgModelPromise;
}

/**
 * 高清智能抠图（RMBG-1.4，本地 WASM 推理）
 * @returns {Promise<{dataUrl:string, stats:object}>}
 */
export async function rmbgRemoveBackground(img, opts = {}, onProgress) {
  const { feather = 2, threshold = 24 } = opts;
  const { tf, model, processor } = await getRmbg(onProgress);

  onProgress?.(0.68, 'AI 分析画面（高清模型）…');
  /* 模型输入固定 1024×1024，输出再放大回原始尺寸 */
  const src = imageToCanvas(img, 1600);
  const inCanvas = imageToCanvas(img, 1024);
  const inCtx = inCanvas.getContext('2d');
  /* 注意：transformers.js v2 的 RawImage 构造签名是 (data,w,h,channels)，
     与 v3 的 (w,h,channels,data) 顺序不同。 */
  const raw = new tf.RawImage(
    inCtx.getImageData(0, 0, inCanvas.width, inCanvas.height).data,
    inCanvas.width, inCanvas.height, 4
  );

  const { pixel_values } = await processor(raw);
  const result = await model({ input: pixel_values });
  /* v2 自定义模型返回 { 输出名: Tensor }，Tensor 本身即含 data/dims */
  const pick = result.output ?? result.logits ?? Object.values(result)[0];
  const out = Array.isArray(pick) ? pick[0] : pick;
  const data = /** @type {Float32Array} */ (out.data);

  /* 判断 ONNX 是否已内置 sigmoid：值域超出 [0,1] 则视为原始 logits */
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < data.length; i += 4096) {
    const v = data[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const needsSigmoid = max > 1.05 || min < -0.05;
  const u8 = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    const p = needsSigmoid ? 1 / (1 + Math.exp(-data[i])) : data[i];
    u8[i] = p * 255;
  }

  onProgress?.(0.86, '生成发丝级边缘…');
  const oh = out.dims ? out.dims[out.dims.length - 2] : 1024;
  const ow = out.dims ? out.dims[out.dims.length - 1] : 1024;
  const maskSmall = new tf.RawImage(u8, ow, oh, 1);
  /* v2 的 resize 走 canvas，是异步方法，必须 await */
  const maskFull = await maskSmall.resize(src.width, src.height);

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = src.width; maskCanvas.height = src.height;
  const mctx = maskCanvas.getContext('2d');
  const maskImageData = mctx.createImageData(src.width, src.height);
  const md = maskImageData.data;
  for (let i = 0, p = 0; i < md.length; i += 4, p++) {
    md[i] = md[i + 1] = md[i + 2] = maskFull.data[p];
    md[i + 3] = 255;
  }
  mctx.putImageData(maskImageData, 0, 0);

  const stats = compositeMask(src, maskCanvas, { feather, threshold });
  stats.engine = 'rmbg';
  gate(stats);

  onProgress?.(1, '完成');
  return { dataUrl: src.toDataURL('image/png'), stats };
}

/* ============================================================
 * 引擎二：MediaPipe Selfie Segmentation（极速人像，Apache-2.0）
 * ============================================================ */
let scriptPromise = null;
function loadEngineScript() {
  if (window.SelfieSegmentation) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = MEDIAPIPE_BASE + 'selfie_segmentation.js';
    s.async = true;
    s.onload = () => window.SelfieSegmentation ? resolve() : reject(new Error('分割引擎初始化失败'));
    s.onerror = () => reject(new Error('本地分割引擎文件缺失'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

let segmenter = null;
let segmenterModel = null;
async function getSegmenter(modelSelection, onProgress) {
  await loadEngineScript();
  if (!segmenter) {
    onProgress?.(0.12, '加载本地人像模型…');
    segmenter = new window.SelfieSegmentation({
      locateFile: file => MEDIAPIPE_BASE + file,
    });
    segmenter.setOptions({ modelSelection, selfieMode: false });
    segmenterModel = modelSelection;
    return segmenter;
  }
  /* modelSelection: 0 = 近景人像（自拍/半身，边缘更精细）
                     1 = 广角（全身/多人/旅行照） */
  if (segmenterModel !== modelSelection) {
    onProgress?.(0.12, '切换分割模型…');
    segmenter.setOptions({ modelSelection, selfieMode: false });
    segmenterModel = modelSelection;
  }
  return segmenter;
}

/**
 * 人像智能抠图（本地神经网络，极速）
 * @param {object} opts { modelSelection 0|1, feather 0-12, threshold 10-120 }
 * @returns {Promise<{dataUrl:string, stats:object}>}
 */
export async function personRemoveBackground(img, opts = {}, onProgress) {
  const { modelSelection = 0, feather = 3, threshold = 42 } = opts;
  const ss = await getSegmenter(modelSelection, onProgress);

  onProgress?.(0.25, '神经网络识别人像…');
  const src = imageToCanvas(img, 1600);
  const w = src.width, h = src.height;

  const result = await new Promise((resolve, reject) => {
    ss.onResults(resolve);
    ss.send({ image: src }).catch(reject);
  });
  if (!result || !result.segmentationMask) throw new Error('分割结果为空');

  onProgress?.(0.72, '提取边缘并羽化…');
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w; maskCanvas.height = h;
  maskCanvas.getContext('2d').drawImage(result.segmentationMask, 0, 0, w, h);

  const stats = compositeMask(src, maskCanvas, { feather, threshold });
  stats.engine = 'selfie';
  /* 人像引擎对“无人”给出更明确的错误码 */
  if (stats.fgRatio < 0.008) {
    const err = new Error('NO_PERSON');
    err.stats = stats;
    throw err;
  }
  gate(stats);

  onProgress?.(1, '完成');
  return { dataUrl: src.toDataURL('image/png'), stats };
}

/* ============================================================
 * 引擎三：色度键抠图（绿幕 / 纯色背景）
 * ============================================================ */
function sampleCorners(data, w, h) {
  const pts = [
    [4, 4], [w - 5, 4], [4, h - 5], [w - 5, h - 5],
    [Math.floor(w / 2), 4],
  ];
  let r = 0, g = 0, b = 0;
  for (const [x, y] of pts) {
    const i = (y * w + x) * 4;
    r += data[i]; g += data[i + 1]; b += data[i + 2];
  }
  return [r / pts.length, g / pts.length, b / pts.length];
}

export function chromaRemoveBackground(img, {
  tolerance = 42,
  feather = 18,
  keyColor = null,
} = {}) {
  const canvas = imageToCanvas(img, 1600);
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;

  let key = keyColor;
  if (!key) key = sampleCorners(d, w, h);
  const [kr, kg, kb] = key;

  const tol2 = tolerance * tolerance * 3;
  const feather2 = feather * feather * 3;

  for (let i = 0; i < d.length; i += 4) {
    const dr = d[i] - kr, dg = d[i + 1] - kg, db = d[i + 2] - kb;
    const dist2 = dr * dr + dg * dg + db * db;
    if (dist2 < tol2) {
      d[i + 3] = 0;
    } else if (feather > 0 && dist2 < tol2 + feather2) {
      const t = (dist2 - tol2) / feather2;
      d[i + 3] = Math.round(d[i + 3] * t);
    }
    /* 绿色溢色抑制 */
    if (d[i + 3] > 0 && d[i + 3] < 230) {
      if (d[i + 1] > Math.max(d[i], d[i + 2]) * 1.05) {
        d[i + 1] = Math.max(d[i], d[i + 2]);
      }
    }
  }
  ctx.putImageData(frame, 0, 0);
  return Promise.resolve(canvas.toDataURL('image/png'));
}

export function pickColorFromImage(img, ratioX, ratioY) {
  const canvas = imageToCanvas(img, 400);
  const ctx = canvas.getContext('2d');
  const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(ratioX * canvas.width)));
  const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(ratioY * canvas.height)));
  const d = ctx.getImageData(x, y, 1, 1).data;
  return [d[0], d[1], d[2]];
}
