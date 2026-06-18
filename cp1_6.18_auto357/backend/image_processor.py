from PIL import Image
import numpy as np
from typing import Tuple
import os
import io


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hsv(r: int, g: int, b: int) -> Tuple[float, float, float]:
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    mx = max(r, g, b)
    mn = min(r, g, b)
    df = mx - mn
    
    if mx == mn:
        h = 0
    elif mx == r:
        h = (60 * ((g - b) / df) + 360) % 360
    elif mx == g:
        h = (60 * ((b - r) / df) + 120) % 360
    else:
        h = (60 * ((r - g) / df) + 240) % 360
    
    s = 0 if mx == 0 else df / mx
    v = mx
    
    return h, s, v


def hsv_to_rgb(h: float, s: float, v: float) -> Tuple[int, int, int]:
    h = h % 360
    c = v * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = v - c
    
    if 0 <= h < 60:
        r, g, b = c, x, 0
    elif 60 <= h < 120:
        r, g, b = x, c, 0
    elif 120 <= h < 180:
        r, g, b = 0, c, x
    elif 180 <= h < 240:
        r, g, b = 0, x, c
    elif 240 <= h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    
    return int((r + m) * 255), int((g + m) * 255), int((b + m) * 255)


def find_dominant_color(image: Image.Image) -> Tuple[int, int, int]:
    small_image = image.resize((50, 50))
    pixels = np.array(small_image).reshape(-1, 3)
    
    pixels = pixels[(pixels[:, 0] < 250) | (pixels[:, 1] < 250) | (pixels[:, 2] < 250)]
    
    if len(pixels) == 0:
        return (128, 128, 128)
    
    avg_color = np.mean(pixels, axis=0)
    return tuple(int(c) for c in avg_color)


def replace_clothing_color(
    image_path: str,
    target_color_hex: str,
    output_path: str,
    color_tolerance: float = 0.3
) -> bool:
    try:
        if not os.path.exists(image_path):
            return False
        
        image = Image.open(image_path).convert('RGBA')
        pixels = np.array(image)
        
        dominant_rgb = find_dominant_color(image.convert('RGB'))
        target_rgb = hex_to_rgb(target_color_hex)
        
        dominant_h, dominant_s, dominant_v = rgb_to_hsv(*dominant_rgb)
        target_h, target_s, target_v = rgb_to_hsv(*target_rgb)
        
        for i in range(pixels.shape[0]):
            for j in range(pixels.shape[1]):
                r, g, b, a = pixels[i, j]
                
                if a == 0:
                    continue
                
                h, s, v = rgb_to_hsv(r, g, b)
                
                h_diff = min(abs(h - dominant_h), 360 - abs(h - dominant_h)) / 180.0
                s_diff = abs(s - dominant_s)
                v_diff = abs(v - dominant_v) / 2.0
                
                color_diff = h_diff * 0.5 + s_diff * 0.3 + v_diff * 0.2
                
                if color_diff < color_tolerance:
                    weight = 1.0 - (color_diff / color_tolerance) * 0.5
                    
                    new_h = target_h
                    new_s = s * (1 - weight) + target_s * weight
                    new_v = v * (1 - weight) + target_v * weight
                    
                    new_r, new_g, new_b = hsv_to_rgb(new_h, new_s, new_v)
                    pixels[i, j] = [new_r, new_g, new_b, a]
        
        result = Image.fromarray(pixels, 'RGBA')
        result.save(output_path)
        return True
        
    except Exception as e:
        print(f"Error processing image: {e}")
        return False


def process_uploaded_image(file_content: bytes, output_path: str) -> dict:
    try:
        image = Image.open(io.BytesIO(file_content))
        image = image.convert('RGBA')
        
        max_size = 1024
        w, h = image.size
        if max(w, h) > max_size:
            scale = max_size / max(w, h)
            new_w, new_h = int(w * scale), int(h * scale)
            image = image.resize((new_w, new_h), Image.LANCZOS)
        
        image.save(output_path, 'PNG')
        
        dominant_color = find_dominant_color(image.convert('RGB'))
        hex_color = '#{:02x}{:02x}{:02x}'.format(*dominant_color)
        
        return {
            'success': True,
            'width': image.size[0],
            'height': image.size[1],
            'dominant_color': hex_color
        }
        
    except Exception as e:
        print(f"Error processing uploaded image: {e}")
        return {'success': False, 'error': str(e)}
