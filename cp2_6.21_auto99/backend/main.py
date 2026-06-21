import base64
import io
import math
import colorsys
from typing import List

import numpy as np
from PIL import Image
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExtractColorsRequest(BaseModel):
    image_base64: str


class AnalyzeHarmonyRequest(BaseModel):
    primary_colors: List[List[int]]
    secondary_colors: List[List[int]]


def rgb_to_hsl(r, g, b):
    r_n, g_n, b_n = r / 255.0, g / 255.0, b / 255.0
    h, l, s = colorsys.rgb_to_hls(r_n, g_n, b_n)
    return round(h * 360, 1), round(s * 100, 1), round(l * 100, 1)


def rgb_to_hex(r, g, b):
    return "#{:02x}{:02x}{:02x}".format(r, g, b)


def name_color(h, s, l):
    hue_names = [
        (15, "赤红"),
        (30, "橙红"),
        (45, "橙色"),
        (60, "金色"),
        (75, "黄绿"),
        (150, "翠绿"),
        (180, "青色"),
        (210, "天蓝"),
        (240, "深海蓝"),
        (270, "靛蓝"),
        (300, "紫色"),
        (330, "品红"),
        (360, "赤红"),
    ]
    hue_name = "赤红"
    for upper, name in hue_names:
        if h <= upper:
            hue_name = name
            break
    prefix = ""
    if s < 20:
        if l < 20:
            return "黑色"
        elif l > 80:
            return "白色"
        else:
            return "灰色"
    if l < 25:
        prefix = "深"
    elif l > 75:
        prefix = "浅"
    elif s > 70 and l > 50:
        prefix = "亮"
    if h >= 10 and h <= 40 and l < 40 and s > 50:
        return "夕阳红"
    return prefix + hue_name


def build_color_info(r, g, b):
    h, s, l = rgb_to_hsl(r, g, b)
    return {
        "rgb": [r, g, b],
        "hsl": [h, s, l],
        "hex": rgb_to_hex(r, g, b),
        "name": name_color(h, s, l),
    }


def simple_kmeans(pixels, k, max_iter=20):
    n = pixels.shape[0]
    indices = np.random.choice(n, k, replace=False)
    centers = pixels[indices].astype(np.float64)
    for _ in range(max_iter):
        dists = np.linalg.norm(pixels[:, np.newaxis, :] - centers[np.newaxis, :, :], axis=2)
        labels = np.argmin(dists, axis=1)
        new_centers = np.zeros_like(centers)
        for i in range(k):
            mask = labels == i
            if np.any(mask):
                new_centers[i] = pixels[mask].mean(axis=0)
            else:
                new_centers[i] = centers[i]
        if np.allclose(centers, new_centers, atol=1.0):
            break
        centers = new_centers
    return centers, labels


@app.post("/api/extract-colors")
def extract_colors(request: ExtractColorsRequest):
    raw = request.image_base64
    if "," in raw:
        raw = raw.split(",", 1)[1]
    image_data = base64.b64decode(raw)
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    image = image.resize((150, 150))
    pixels = np.array(image).reshape(-1, 3).astype(np.float64)

    k_primary = min(6, len(pixels))
    centers, labels = simple_kmeans(pixels, k_primary)

    unique, counts = np.unique(labels, return_counts=True)
    sorted_indices = np.argsort(-counts)
    primary_centers = centers[sorted_indices].astype(int)
    primary_colors = [build_color_info(int(c[0]), int(c[1]), int(c[2])) for c in primary_centers]

    primary_masks = []
    for idx in sorted_indices:
        primary_masks.append(labels == idx)

    remaining_pixels = []
    for i, pixel in enumerate(pixels):
        is_primary = False
        for mask in primary_masks:
            if mask[i]:
                cluster_center = centers[labels[i]]
                dist = np.linalg.norm(pixel - cluster_center)
                if dist < 50:
                    is_primary = True
                    break
        if not is_primary:
            remaining_pixels.append(pixel)

    secondary_colors = []
    if len(remaining_pixels) > 20:
        remaining_arr = np.array(remaining_pixels)
        k_secondary = min(8, len(remaining_arr))
        sec_centers, sec_labels = simple_kmeans(remaining_arr, k_secondary)
        sec_unique, sec_counts = np.unique(sec_labels, return_counts=True)
        sec_sorted = np.argsort(-sec_counts)
        sec_centers = sec_centers[sec_sorted].astype(int)
        secondary_colors = [build_color_info(int(c[0]), int(c[1]), int(c[2])) for c in sec_centers]
    else:
        quantized = (pixels / 32).astype(int) * 32
        quantized = np.clip(quantized, 0, 255)
        unique_colors, color_counts = np.unique(quantized, axis=0, return_counts=True)
        sorted_color_idx = np.argsort(-color_counts)

        primary_set = set()
        for c in primary_centers:
            primary_set.add((int(c[0]) // 32 * 32, int(c[1]) // 32 * 32, int(c[2]) // 32 * 32))

        count = 0
        for idx in sorted_color_idx:
            qc = tuple(unique_colors[idx])
            if qc not in primary_set:
                c = unique_colors[idx]
                secondary_colors.append(build_color_info(int(c[0]), int(c[1]), int(c[2])))
                primary_set.add(qc)
                count += 1
                if count >= 8:
                    break

    return {
        "primary_colors": primary_colors,
        "secondary_colors": secondary_colors,
    }


def hue_diff(h1, h2):
    d = abs(h1 - h2)
    return min(d, 360 - d)


def compute_harmony_score(primary_hsl):
    if len(primary_hsl) == 0:
        return 0, "自由配色"

    score = 70
    hues = [h for h, s, l in primary_hsl]

    has_complementary = False
    has_analogous = False
    has_triadic = False

    for i in range(len(hues)):
        for j in range(i + 1, len(hues)):
            diff = hue_diff(hues[i], hues[j])
            if 160 <= diff <= 200:
                has_complementary = True
            if diff < 30:
                has_analogous = True
            if 100 <= diff <= 140:
                has_triadic = True

    if has_complementary:
        score += 15
    if has_analogous:
        score += 10
    if has_triadic:
        score += 15

    saturations = [s for h, s, l in primary_hsl]
    if saturations:
        sat_range = max(saturations) - min(saturations)
        if sat_range < 30:
            score += 5
        elif sat_range < 50:
            score += 3

    lightnesses = [l for h, s, l in primary_hsl]
    if lightnesses:
        l_range = max(lightnesses) - min(lightnesses)
        if l_range < 30:
            score += 5
        elif l_range < 50:
            score += 3

    score = max(0, min(100, score))

    if has_complementary and not has_triadic:
        harmony_type = "互补"
    elif has_analogous and not has_complementary:
        harmony_type = "类似"
    elif has_triadic:
        harmony_type = "三角"
    elif has_complementary and has_triadic:
        harmony_type = "分裂互补"
    else:
        harmony_type = "自由配色"

    return score, harmony_type


def get_harmony_description(harmony_type, score):
    descriptions = {
        "互补": "色彩搭配采用了互补色方案，对比鲜明，视觉冲击力强，适合需要突出重点的设计场景。",
        "类似": "色彩搭配采用了类似色方案，过渡自然柔和，整体统一协调，适合营造温馨舒适的氛围。",
        "三角": "色彩搭配采用了三角色方案，三种色彩均匀分布，丰富而平衡，适合活泼多元的设计。",
        "分裂互补": "色彩搭配采用了分裂互补方案，既有对比又不失和谐，兼具活力与秩序感。",
        "自由配色": "色彩搭配较为自由，不拘泥于传统配色规则，具有独特个性，适合创意表达。",
    }
    base = descriptions.get(harmony_type, "色彩搭配独特。")
    if score >= 85:
        return base + "整体配色和谐度很高。"
    elif score >= 70:
        return base + "配色整体较为协调。"
    else:
        return base + "配色仍有优化空间。"


def compute_color_positions(primary_colors_rgb, primary_hsl):
    positions = []
    for i, (h, s, l) in enumerate(primary_hsl):
        angle = h
        rad = math.radians(h)
        x = 0.5 + 0.4 * math.cos(rad)
        y = 0.5 + 0.4 * math.sin(rad)
        r, g, b = primary_colors_rgb[i]
        positions.append({
            "angle": angle,
            "x": round(x, 4),
            "y": round(y, 4),
            "rgb": [r, g, b],
            "hex": rgb_to_hex(r, g, b),
            "name": name_color(h, s, l),
        })
    return positions


def generate_recommendations(primary_hsl):
    if len(primary_hsl) == 0:
        return []

    base_hue = primary_hsl[0][0]
    base_sat = primary_hsl[0][1]
    base_light = primary_hsl[0][2]

    recs = []

    comp_hue = (base_hue + 180) % 360
    comp_colors = []
    for i in range(5):
        hue = (comp_hue + (i - 2) * 15) % 360
        r, g, b = colorsys.hls_to_rgb(hue / 360, base_light / 100, base_sat / 100)
        comp_colors.append(build_color_info(
            int(r * 255), int(g * 255), int(b * 255)
        ))
    recs.append({
        "colors": [c["rgb"] for c in comp_colors],
        "colors_info": comp_colors,
        "reason": "以互补色为基础，增加色彩对比度，使画面更具视觉冲击力。",
    })

    analog_colors = []
    for i in range(5):
        hue = (base_hue + (i - 2) * 20) % 360
        r, g, b = colorsys.hls_to_rgb(hue / 360, base_light / 100, base_sat / 100)
        analog_colors.append(build_color_info(
            int(r * 255), int(g * 255), int(b * 255)
        ))
    recs.append({
        "colors": [c["rgb"] for c in analog_colors],
        "colors_info": analog_colors,
        "reason": "围绕基础色相的类似色搭配，过渡柔和自然，整体统一协调。",
    })

    triadic_colors = []
    for i in range(5):
        offset = (i % 3) * 120
        hue = (base_hue + offset + i * 5) % 360
        sat_boost = min(100, base_sat + 15)
        r, g, b = colorsys.hls_to_rgb(hue / 360, base_light / 100, sat_boost / 100)
        triadic_colors.append(build_color_info(
            int(r * 255), int(g * 255), int(b * 255)
        ))
    recs.append({
        "colors": [c["rgb"] for c in triadic_colors],
        "colors_info": triadic_colors,
        "reason": "三角色搭配并提升饱和度，色彩丰富鲜明，适合活力感强的设计。",
    })

    return recs


@app.post("/api/analyze-harmony")
def analyze_harmony(request: AnalyzeHarmonyRequest):
    primary_hsl = [rgb_to_hsl(r, g, b) for r, g, b in request.primary_colors]
    secondary_hsl = [rgb_to_hsl(r, g, b) for r, g, b in request.secondary_colors]

    score, harmony_type = compute_harmony_score(primary_hsl)
    description = get_harmony_description(harmony_type, score)
    color_positions = compute_color_positions(request.primary_colors, primary_hsl)
    recommendations = generate_recommendations(primary_hsl)

    return {
        "score": score,
        "harmonyType": harmony_type,
        "description": description,
        "colorPositions": color_positions,
        "recommendations": recommendations,
    }
