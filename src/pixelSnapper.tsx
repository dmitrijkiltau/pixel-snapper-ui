type PixelSnapperConfig = {
  kColors?: number;
  kSeed?: number;
  maxKmeansIterations?: number;
  peakThresholdMultiplier?: number;
  peakDistanceFilter?: number;
  walkerSearchWindowRatio?: number;
  walkerMinSearchWindow?: number;
  walkerStrengthThreshold?: number;
  minCutsPerAxis?: number;
  fallbackTargetSegments?: number;
  maxStepRatio?: number;
};

type PixelSnapperConfigResolved = Required<PixelSnapperConfig>;

type ImageBuffer = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

const defaultConfig: PixelSnapperConfigResolved = {
  kColors: 16,
  kSeed: 42,
  maxKmeansIterations: 15,
  peakThresholdMultiplier: 0.2,
  peakDistanceFilter: 4,
  walkerSearchWindowRatio: 0.35,
  walkerMinSearchWindow: 2.0,
  walkerStrengthThreshold: 0.5,
  minCutsPerAxis: 4,
  fallbackTargetSegments: 64,
  maxStepRatio: 1.8,
};

const normalizeConfig = (config?: PixelSnapperConfig): PixelSnapperConfigResolved => ({
  ...defaultConfig,
  ...(config ?? {}),
});

const validateImageDimensions = (width: number, height: number) => {
  if (width <= 0 || height <= 0) {
    throw new Error("Image dimensions cannot be zero");
  }
  if (width > 10000 || height > 10000) {
    throw new Error("Image too large (max 10000x10000)");
  }
};

class MTRandom {
  private mt: number[] = new Array(624);
  private mti = 625;

  constructor(seed: number) {
    this.seed(seed);
  }

  seed(seed: number) {
    let s = seed >>> 0;
    this.mt[0] = s;
    for (let i = 1; i < 624; i += 1) {
      const prev = this.mt[i - 1]!;
      this.mt[i] = (Math.imul(1812433253, prev ^ (prev >>> 30)) + i) >>> 0;
    }
    this.mti = 624;
  }

  private nextInt32(): number {
    const mag01 = [0x0, 0x9908b0df];
    let y = 0;

    if (this.mti >= 624) {
      let kk = 0;
      for (; kk < 624 - 397; kk += 1) {
        y = (this.mt[kk]! & 0x80000000) | (this.mt[kk + 1]! & 0x7fffffff);
        this.mt[kk] = this.mt[kk + 397]! ^ (y >>> 1) ^ mag01[y & 0x1]!;
      }
      for (; kk < 623; kk += 1) {
        y = (this.mt[kk]! & 0x80000000) | (this.mt[kk + 1]! & 0x7fffffff);
        this.mt[kk] = this.mt[kk - 227]! ^ (y >>> 1) ^ mag01[y & 0x1]!;
      }
      y = (this.mt[623]! & 0x80000000) | (this.mt[0]! & 0x7fffffff);
      this.mt[623] = this.mt[396]! ^ (y >>> 1) ^ mag01[y & 0x1]!;
      this.mti = 0;
    }

    y = this.mt[this.mti++]!;
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  random(): number {
    const a = this.nextInt32() >>> 5;
    const b = this.nextInt32() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  }

  randrange(stop: number): number {
    if (!Number.isFinite(stop) || stop <= 0) {
      throw new Error("randrange stop must be > 0");
    }
    return Math.floor(this.random() * stop);
  }
}

const quantizeImage = (image: ImageBuffer, cfg: PixelSnapperConfigResolved): ImageBuffer => {
  const { data, width, height } = image;
  const pixelCount = width * height;
  const rgb = new Float32Array(pixelCount * 3);
  let rgbCount = 0;

  for (let i = 0; i < pixelCount; i += 1) {
    const idx = i * 4;
    if (data[idx + 3] > 0) {
      const offset = rgbCount * 3;
      rgb[offset] = data[idx];
      rgb[offset + 1] = data[idx + 1];
      rgb[offset + 2] = data[idx + 2];
      rgbCount += 1;
    }
  }

  if (rgbCount === 0) {
    return { data: new Uint8ClampedArray(data), width, height };
  }

  const k = Math.min(cfg.kColors, rgbCount);
  const rng = new MTRandom(cfg.kSeed);
  const centroids = new Float32Array(k * 3);
  const first = rng.randrange(rgbCount);

  centroids[0] = rgb[first * 3];
  centroids[1] = rgb[first * 3 + 1];
  centroids[2] = rgb[first * 3 + 2];

  const dists = new Float32Array(rgbCount);
  dists.fill(Number.POSITIVE_INFINITY);

  for (let c = 1; c < k; c += 1) {
    const lastIndex = (c - 1) * 3;
    const lastR = centroids[lastIndex];
    const lastG = centroids[lastIndex + 1];
    const lastB = centroids[lastIndex + 2];
    let total = 0;

    for (let i = 0; i < rgbCount; i += 1) {
      const offset = i * 3;
      const dr = rgb[offset] - lastR;
      const dg = rgb[offset + 1] - lastG;
      const db = rgb[offset + 2] - lastB;
      const dist = dr * dr + dg * dg + db * db;
      const next = dist < dists[i] ? dist : dists[i];
      dists[i] = next;
      total += next;
    }

    let chosen = 0;
    if (total <= 0) {
      chosen = rng.randrange(rgbCount);
    } else {
      const target = rng.random() * total;
      let acc = 0;
      for (let i = 0; i < rgbCount; i += 1) {
        acc += dists[i]!;
        if (acc >= target) {
          chosen = i;
          break;
        }
      }
    }

    const srcOffset = chosen * 3;
    const dstOffset = c * 3;
    centroids[dstOffset] = rgb[srcOffset];
    centroids[dstOffset + 1] = rgb[srcOffset + 1];
    centroids[dstOffset + 2] = rgb[srcOffset + 2];
  }

  const newCentroids = new Float32Array(k * 3);

  for (let iter = 0; iter < cfg.maxKmeansIterations; iter += 1) {
    const sums = new Float32Array(k * 3);
    const counts = new Int32Array(k);

    for (let i = 0; i < rgbCount; i += 1) {
      const offset = i * 3;
      let bestIndex = 0;
      let bestDist = Number.POSITIVE_INFINITY;

      for (let c = 0; c < k; c += 1) {
        const cOffset = c * 3;
        const dr = rgb[offset] - centroids[cOffset];
        const dg = rgb[offset + 1] - centroids[cOffset + 1];
        const db = rgb[offset + 2] - centroids[cOffset + 2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = c;
        }
      }

      const sumOffset = bestIndex * 3;
      sums[sumOffset] += rgb[offset];
      sums[sumOffset + 1] += rgb[offset + 1];
      sums[sumOffset + 2] += rgb[offset + 2];
      counts[bestIndex] += 1;
    }

    let maxMove = 0;
    for (let c = 0; c < k; c += 1) {
      const count = counts[c]!;
      const offset = c * 3;
      if (count > 0) {
        newCentroids[offset] = sums[offset] / count;
        newCentroids[offset + 1] = sums[offset + 1] / count;
        newCentroids[offset + 2] = sums[offset + 2] / count;
      } else {
        newCentroids[offset] = centroids[offset];
        newCentroids[offset + 1] = centroids[offset + 1];
        newCentroids[offset + 2] = centroids[offset + 2];
      }
      const dr = newCentroids[offset] - centroids[offset];
      const dg = newCentroids[offset + 1] - centroids[offset + 1];
      const db = newCentroids[offset + 2] - centroids[offset + 2];
      const move = dr * dr + dg * dg + db * db;
      if (move > maxMove) {
        maxMove = move;
      }
    }

    centroids.set(newCentroids);
    if (maxMove < 0.01) {
      break;
    }
  }

  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < pixelCount; i += 1) {
    const idx = i * 4;
    const r = out[idx];
    const g = out[idx + 1];
    const b = out[idx + 2];

    let bestIndex = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let c = 0; c < k; c += 1) {
      const offset = c * 3;
      const dr = r - centroids[offset];
      const dg = g - centroids[offset + 1];
      const db = b - centroids[offset + 2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = c;
      }
    }

    const cOffset = bestIndex * 3;
    out[idx] = Math.round(centroids[cOffset]);
    out[idx + 1] = Math.round(centroids[cOffset + 1]);
    out[idx + 2] = Math.round(centroids[cOffset + 2]);
  }

  return { data: out, width, height };
};

const computeProfiles = (image: ImageBuffer) => {
  const { data, width, height } = image;
  if (width < 3 || height < 3) {
    throw new Error("Image too small (minimum 3x3)");
  }

  const gray = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 0) {
        gray[y * width + x] =
          0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      }
    }
  }

  const col = new Float32Array(width);
  const row = new Float32Array(height);

  for (let x = 1; x < width - 1; x += 1) {
    let sum = 0;
    for (let y = 0; y < height; y += 1) {
      const left = gray[y * width + (x - 1)];
      const right = gray[y * width + (x + 1)];
      sum += Math.abs(right - left);
    }
    col[x] = sum;
  }

  for (let y = 1; y < height - 1; y += 1) {
    let sum = 0;
    for (let x = 0; x < width; x += 1) {
      const top = gray[(y - 1) * width + x];
      const bottom = gray[(y + 1) * width + x];
      sum += Math.abs(bottom - top);
    }
    row[y] = sum;
  }

  return { colProfile: col, rowProfile: row };
};

const estimateStep = (profile: ArrayLike<number>, cfg: PixelSnapperConfigResolved) => {
  if (!profile || profile.length === 0) {
    return null;
  }
  let maxValue = 0;
  for (let i = 0; i < profile.length; i += 1) {
    if (profile[i]! > maxValue) {
      maxValue = profile[i]!;
    }
  }
  if (maxValue === 0) {
    return null;
  }

  const threshold = maxValue * cfg.peakThresholdMultiplier;
  const peaks: number[] = [];
  for (let i = 1; i < profile.length - 1; i += 1) {
    const value = profile[i]!;
    if (value > threshold && value > profile[i - 1]! && value > profile[i + 1]!) {
      peaks.push(i);
    }
  }

  if (peaks.length < 2) {
    return null;
  }

  const clean = [peaks[0]!];
  for (let i = 1; i < peaks.length; i += 1) {
    const current = peaks[i]!;
    if (current - clean[clean.length - 1]! >= cfg.peakDistanceFilter) {
      clean.push(current);
    }
  }

  if (clean.length < 2) {
    return null;
  }

  const diffs = clean.slice(1).map((value, index) => value - clean[index]!);
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)]!;
};

const walk = (
  profile: ArrayLike<number>,
  step: number,
  limit: number,
  cfg: PixelSnapperConfigResolved
) => {
  const cuts = [0];
  let pos = 0;
  let sum = 0;
  for (let i = 0; i < profile.length; i += 1) {
    sum += profile[i]!;
  }
  const mean = sum / profile.length;
  const win = Math.max(step * cfg.walkerSearchWindowRatio, cfg.walkerMinSearchWindow);

  while (pos < limit) {
    const target = pos + step;
    if (target >= limit) {
      cuts.push(limit);
      break;
    }

    const lo = Math.max(Math.floor(target - win), Math.floor(pos) + 1);
    const hi = Math.min(Math.floor(target + win), limit);

    if (hi <= lo) {
      pos = target;
      continue;
    }

    let idx = lo;
    for (let i = lo; i < hi; i += 1) {
      if (profile[i]! > profile[idx]!) {
        idx = i;
      }
    }

    if (profile[idx]! > mean * cfg.walkerStrengthThreshold) {
      cuts.push(idx);
      pos = idx;
    } else {
      cuts.push(Math.floor(target));
      pos = target;
    }
  }

  return Array.from(new Set(cuts)).sort((a, b) => a - b);
};

const blockMode = (
  data: Uint8ClampedArray,
  width: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number
) => {
  let bestKey = 0;
  let bestCount = 0;
  const counts = new Map<number, number>();

  for (let y = y0; y < y1; y += 1) {
    let offset = (y * width + x0) * 4;
    for (let x = x0; x < x1; x += 1) {
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const a = data[offset + 3];
      const key = r * 0x1000000 + g * 0x10000 + b * 0x100 + a;
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      if (next > bestCount) {
        bestCount = next;
        bestKey = key;
      }
      offset += 4;
    }
  }

  return {
    r: (bestKey >>> 24) & 0xff,
    g: (bestKey >>> 16) & 0xff,
    b: (bestKey >>> 8) & 0xff,
    a: bestKey & 0xff,
  };
};

const resample = (image: ImageBuffer, cols: number[], rows: number[]) => {
  const { data, width, height } = image;
  const outWidth = cols.length - 1;
  const outHeight = rows.length - 1;
  const out = new Uint8ClampedArray(outWidth * outHeight * 4);

  for (let yi = 0; yi < rows.length - 1; yi += 1) {
    const y0 = rows[yi]!;
    const y1 = rows[yi + 1]!;
    if (y1 <= y0) {
      continue;
    }
    for (let xi = 0; xi < cols.length - 1; xi += 1) {
      const x0 = cols[xi]!;
      const x1 = cols[xi + 1]!;
      if (x1 <= x0) {
        continue;
      }
      const mode = blockMode(data, width, x0, x1, y0, y1);
      const outIdx = (yi * outWidth + xi) * 4;
      out[outIdx] = mode.r;
      out[outIdx + 1] = mode.g;
      out[outIdx + 2] = mode.b;
      out[outIdx + 3] = mode.a;
    }
  }

  return { data: out, width: outWidth, height: outHeight };
};

const ensureCanvas = (width: number, height: number) => {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error("Canvas is not available in this environment.");
};

const decodeImageData = async (input: Blob): Promise<ImageData> => {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(input);
    const canvas = ensureCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      bitmap.close?.();
      throw new Error("Canvas 2D context is not available.");
    }
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close?.();
    return imageData;
  }

  if (typeof document === "undefined") {
    throw new Error("createImageBitmap is unavailable and document is undefined.");
  }

  const url = URL.createObjectURL(input);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to decode image data."));
    });

    const canvas = ensureCanvas(image.naturalWidth, image.naturalHeight);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Canvas 2D context is not available.");
    }
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const encodePng = async (imageData: ImageData): Promise<Blob> => {
  const canvas = ensureCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is not available.");
  }
  ctx.putImageData(imageData, 0, 0);

  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type: "image/png" });
  }

  if (typeof HTMLCanvasElement === "undefined" || !(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas cannot export to PNG.");
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to encode PNG."));
      }
    }, "image/png");
  });
};

export const processImageData = (
  imageData: ImageData,
  config?: PixelSnapperConfig
): ImageData => {
  const cfg = normalizeConfig(config);
  validateImageDimensions(imageData.width, imageData.height);

  const quantized = quantizeImage(
    { data: imageData.data, width: imageData.width, height: imageData.height },
    cfg
  );
  const { colProfile, rowProfile } = computeProfiles(quantized);

  const stepX = estimateStep(colProfile, cfg);
  const stepY = estimateStep(rowProfile, cfg);

  const step =
    stepX === null && stepY === null
      ? Math.max(Math.min(quantized.width, quantized.height) / cfg.fallbackTargetSegments, 1)
      : stepX ?? stepY ?? 1;

  const cols = walk(colProfile, step, quantized.width, cfg);
  const rows = walk(rowProfile, step, quantized.height, cfg);
  const output = resample(quantized, cols, rows);

  return new ImageData(output.data, output.width, output.height);
};

export const processImageBlob = async (
  input: Blob,
  config?: PixelSnapperConfig
): Promise<Blob> => {
  const imageData = await decodeImageData(input);
  const outputData = processImageData(imageData, config);
  return encodePng(outputData);
};

export const processRgbaBytes = async (
  inputBytes: ArrayBuffer | Uint8Array,
  kColors = 16,
  kSeed = 42
): Promise<Uint8Array> => {
  const buffer = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes);
  const outputBlob = await processImageBlob(new Blob([buffer]), { kColors, kSeed });
  const outputBuffer = await outputBlob.arrayBuffer();
  return new Uint8Array(outputBuffer);
};

export type { PixelSnapperConfig };
