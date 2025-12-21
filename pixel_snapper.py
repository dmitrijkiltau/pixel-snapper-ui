import math
import random
from collections import Counter
from dataclasses import dataclass
from typing import List, Tuple, Optional

import io
import numpy as np
from PIL import Image

# ---------------------------
# Config
# ---------------------------

@dataclass
class Config:
    k_colors: int = 16
    k_seed: int = 42
    max_kmeans_iterations: int = 15
    peak_threshold_multiplier: float = 0.2
    peak_distance_filter: int = 4
    walker_search_window_ratio: float = 0.35
    walker_min_search_window: float = 2.0
    walker_strength_threshold: float = 0.5
    min_cuts_per_axis: int = 4
    fallback_target_segments: int = 64
    max_step_ratio: float = 1.8


# ---------------------------
# Image helpers
# ---------------------------

def validate_image_dimensions(w: int, h: int):
    if w <= 0 or h <= 0:
        raise ValueError("Image dimensions cannot be zero")
    if w > 10000 or h > 10000:
        raise ValueError("Image too large (max 10000x10000)")


# ---------------------------
# K-means color quantization
# ---------------------------

def quantize_image(img: np.ndarray, cfg: Config) -> np.ndarray:
    rng = random.Random(cfg.k_seed)

    pixels = img.reshape(-1, 4)
    mask = pixels[:, 3] > 0
    rgb = pixels[mask][:, :3].astype(np.float32)

    if len(rgb) == 0:
        return img.copy()

    k = min(cfg.k_colors, len(rgb))

    # k-means++ init
    centroids = [rgb[rng.randrange(len(rgb))]]
    dists = np.full(len(rgb), np.inf)

    for _ in range(1, k):
        last = centroids[-1]
        new_d = np.sum((rgb - last) ** 2, axis=1)
        dists = np.minimum(dists, new_d)

        probs = dists / dists.sum()
        idx = np.searchsorted(np.cumsum(probs), rng.random())
        centroids.append(rgb[idx])

    centroids = np.array(centroids)

    # Lloyd iterations
    for _ in range(cfg.max_kmeans_iterations):
        distances = np.linalg.norm(rgb[:, None] - centroids[None, :], axis=2)
        labels = distances.argmin(axis=1)

        new_centroids = []
        for i in range(k):
            pts = rgb[labels == i]
            if len(pts) > 0:
                new_centroids.append(pts.mean(axis=0))
            else:
                new_centroids.append(centroids[i])
        new_centroids = np.array(new_centroids)

        if np.max(np.sum((new_centroids - centroids) ** 2, axis=1)) < 0.01:
            break
        centroids = new_centroids

    # Apply palette
    out = img.copy()
    rgb_all = pixels[:, :3].astype(np.float32)
    distances = np.linalg.norm(rgb_all[:, None] - centroids[None, :], axis=2)
    best = distances.argmin(axis=1)
    pixels[:, :3] = centroids[best].round().astype(np.uint8)
    out[:] = pixels.reshape(img.shape)
    return out


# ---------------------------
# Edge profiles
# ---------------------------

def compute_profiles(img: np.ndarray) -> Tuple[List[float], List[float]]:
    h, w, _ = img.shape
    if w < 3 or h < 3:
        raise ValueError("Image too small (minimum 3x3)")

    gray = (
        0.299 * img[:, :, 0]
        + 0.587 * img[:, :, 1]
        + 0.114 * img[:, :, 2]
    ) * (img[:, :, 3] > 0)

    col = np.zeros(w)
    row = np.zeros(h)

    col[1:-1] = np.abs(gray[:, 2:] - gray[:, :-2]).sum(axis=0)
    row[1:-1] = np.abs(gray[2:, :] - gray[:-2, :]).sum(axis=1)

    return col.tolist(), row.tolist()


# ---------------------------
# Step estimation
# ---------------------------

def estimate_step(profile: List[float], cfg: Config) -> Optional[float]:
    if not profile:
        return None
    m = max(profile)
    if m == 0:
        return None

    thresh = m * cfg.peak_threshold_multiplier
    peaks = [
        i for i in range(1, len(profile) - 1)
        if profile[i] > thresh and profile[i] > profile[i - 1] and profile[i] > profile[i + 1]
    ]

    if len(peaks) < 2:
        return None

    clean = [peaks[0]]
    for p in peaks[1:]:
        if p - clean[-1] >= cfg.peak_distance_filter:
            clean.append(p)

    if len(clean) < 2:
        return None

    diffs = sorted(clean[i + 1] - clean[i] for i in range(len(clean) - 1))
    return float(diffs[len(diffs) // 2])


# ---------------------------
# Walker
# ---------------------------

def walk(profile: List[float], step: float, limit: int, cfg: Config) -> List[int]:
    cuts = [0]
    pos = 0.0
    mean = sum(profile) / len(profile)
    win = max(step * cfg.walker_search_window_ratio, cfg.walker_min_search_window)

    while pos < limit:
        target = pos + step
        if target >= limit:
            cuts.append(limit)
            break

        lo = max(int(target - win), int(pos) + 1)
        hi = min(int(target + win), limit)

        if hi <= lo:
            pos = target
            continue

        idx = max(range(lo, hi), key=lambda i: profile[i])
        if profile[idx] > mean * cfg.walker_strength_threshold:
            cuts.append(idx)
            pos = idx
        else:
            cuts.append(int(target))
            pos = target

    return sorted(set(cuts))


# ---------------------------
# Resampling
# ---------------------------

def resample(img: np.ndarray, cols: List[int], rows: List[int]) -> np.ndarray:
    out = np.zeros((len(rows) - 1, len(cols) - 1, 4), dtype=np.uint8)

    for yi, (y0, y1) in enumerate(zip(rows, rows[1:])):
        for xi, (x0, x1) in enumerate(zip(cols, cols[1:])):
            block = img[y0:y1, x0:x1].reshape(-1, 4)
            if len(block) == 0:
                continue
            out[yi, xi] = Counter(map(tuple, block)).most_common(1)[0][0]

    return out


# ---------------------------
# Pipeline
# ---------------------------

def process_image(input_path: str, output_path: str, cfg: Config = Config()):
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape

    validate_image_dimensions(w, h)

    arr = quantize_image(arr, cfg)
    col_prof, row_prof = compute_profiles(arr)

    sx = estimate_step(col_prof, cfg)
    sy = estimate_step(row_prof, cfg)

    if sx is None and sy is None:
        step = max(min(w, h) / cfg.fallback_target_segments, 1.0)
    else:
        step = sx or sy

    cols = walk(col_prof, step, w, cfg)
    rows = walk(row_prof, step, h, cfg)

    out = resample(arr, cols, rows)
    Image.fromarray(out, "RGBA").save(output_path)

def process_rgba_bytes(input_bytes: bytes, k_colors: int = 16, k_seed: int = 42) -> bytes:
    cfg = Config(k_colors=k_colors, k_seed=k_seed)

    img = Image.open(io.BytesIO(input_bytes)).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    validate_image_dimensions(w, h)

    arr = quantize_image(arr, cfg)
    col_prof, row_prof = compute_profiles(arr)

    sx = estimate_step(col_prof, cfg)
    sy = estimate_step(row_prof, cfg)

    if sx is None and sy is None:
        step = max(min(w, h) / cfg.fallback_target_segments, 1.0)
    else:
        step = sx or sy

    cols = walk(col_prof, step, w, cfg)
    rows = walk(row_prof, step, h, cfg)

    out = resample(arr, cols, rows)

    buf = io.BytesIO()
    Image.fromarray(out, "RGBA").save(buf, format="PNG")
    return buf.getvalue()


# ---------------------------
# CLI
# ---------------------------

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python pixel_snapper.py input.png output.png [k_colors]")
        sys.exit(1)

    cfg = Config()
    if len(sys.argv) > 3:
        cfg.k_colors = int(sys.argv[3])

    process_image(sys.argv[1], sys.argv[2], cfg)

