from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from typing import List

app = FastAPI(title="Geological Deformation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DeformationRequest(BaseModel):
    structure_type: str
    pressure_direction: float
    stress_magnitude: float
    rock_hardness: float


class DeformedLayerOut(BaseModel):
    vertices: List[float]
    indices: List[int]
    colors: List[float]
    layerIndex: int


class DeformationResponse(BaseModel):
    layers: List[DeformedLayerOut]
    layerThickness: float


W = 20.0
D = 12.0
SEGS_W = 40
SEGS_D = 24
NUM_LAYERS = 10
THICKNESS = 0.6

BASE_COLORS = np.array([
    [0.29, 0.17, 0.04],
    [0.35, 0.22, 0.08],
    [0.42, 0.28, 0.12],
    [0.48, 0.33, 0.16],
    [0.54, 0.38, 0.20],
    [0.60, 0.44, 0.25],
    [0.66, 0.50, 0.30],
    [0.72, 0.57, 0.36],
    [0.78, 0.64, 0.43],
    [0.83, 0.72, 0.59],
])


def build_initial_vertices():
    layers = []
    for l in range(NUM_LAYERS):
        y_base = -NUM_LAYERS * THICKNESS / 2.0 + l * THICKNESS
        verts = np.zeros(((SEGS_W + 1) * (SEGS_D + 1), 3), dtype=np.float32)
        idx = 0
        for j in range(SEGS_D + 1):
            for i in range(SEGS_W + 1):
                x = -W / 2.0 + (i / SEGS_W) * W
                z = -D / 2.0 + (j / SEGS_D) * D
                y = y_base + (np.random.random() - 0.5) * 0.02
                verts[idx] = [x, y, z]
                idx += 1
        layers.append(verts)
    return layers


def build_indices():
    indices = []
    for j in range(SEGS_D):
        for i in range(SEGS_W):
            a = j * (SEGS_W + 1) + i
            b = a + 1
            c = a + (SEGS_W + 1)
            d = c + 1
            indices.extend([a, c, b, b, c, d])
    return indices


def generate_colors(layer_index: int, hardness: float, vertex_count: int):
    base = BASE_COLORS[layer_index]
    hardness_t = min(1.0, max(0.0, (hardness - 1.0) / 9.0))
    darken = 1.0 - hardness_t * 0.35
    noise = 0.95 + np.random.random((vertex_count, 1)) * 0.1
    colors = np.clip(base * darken * noise, 0.0, 1.0)
    return colors.astype(np.float32).flatten().tolist()


def apply_deformation(structure_type: str, verts: np.ndarray, layer_idx: int,
                      pressure_direction: float, stress_magnitude: float,
                      rock_hardness: float) -> np.ndarray:
    hardness_factor = 1.0 / max(1.0, rock_hardness)
    stress = stress_magnitude * hardness_factor
    dir_rad = np.radians(pressure_direction)
    dir_x = np.cos(dir_rad)
    dir_z = np.sin(dir_rad)

    x = verts[:, 0]
    z = verts[:, 2]
    proj = x * dir_x + z * dir_z

    dy = np.zeros_like(x)
    dx = np.zeros_like(x)
    dz = np.zeros_like(x)

    layer_offset = (layer_idx - 4.5) * 0.1
    amp = stress * 1.5

    if structure_type == "anticline":
        dy = np.cos((proj / W) * np.pi * 1.5) * amp * (1.0 + layer_offset)
    elif structure_type == "syncline":
        dy = -np.cos((proj / W) * np.pi * 1.5) * amp * (1.0 + layer_offset)
    elif structure_type == "normal_fault":
        mask = proj > 0
        dy[mask] = -amp * 0.6 * (1.0 + layer_offset)
        dx[mask] = dir_x * amp * 0.3
        dz[mask] = dir_z * amp * 0.3
    elif structure_type == "reverse_fault":
        mask = proj > 0
        dy[mask] = amp * 0.6 * (1.0 + layer_offset)
        dx[mask] = -dir_x * amp * 0.3
        dz[mask] = -dir_z * amp * 0.3
    elif structure_type == "strike_slip_fault":
        mask_pos = proj > 0
        mask_neg = ~mask_pos
        dx[mask_pos] = -dir_z * amp * 0.8
        dz[mask_pos] = dir_x * amp * 0.8
        dx[mask_neg] = dir_z * amp * 0.8
        dz[mask_neg] = -dir_x * amp * 0.8

    result = verts.copy()
    result[:, 0] += dx
    result[:, 1] += dy
    result[:, 2] += dz
    return result


@app.post("/api/deform", response_model=DeformationResponse)
def deform(req: DeformationRequest):
    layers_verts = build_initial_vertices()
    indices = build_indices()

    out_layers = []
    for l, verts in enumerate(layers_verts):
        deformed = apply_deformation(
            req.structure_type,
            verts,
            l,
            req.pressure_direction,
            req.stress_magnitude,
            req.rock_hardness,
        )
        colors = generate_colors(l, req.rock_hardness, len(deformed))
        out_layers.append(DeformedLayerOut(
            vertices=deformed.flatten().tolist(),
            indices=indices,
            colors=colors,
            layerIndex=l,
        ))

    return DeformationResponse(layers=out_layers, layerThickness=THICKNESS)


@app.get("/api/health")
def health():
    return {"status": "ok"}
