import os
import uuid
import tempfile
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import librosa
import soundfile as sf

from effector import apply_effects

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

audio_store: Dict[str, Dict[str, Any]] = {}

PRESETS = {
    "echo": {
        "name": "回声",
        "params": {
            "delay": {"default": 0.3, "min": 0, "max": 2, "step": 0.01},
            "feedback": {"default": 0.5, "min": 0, "max": 1, "step": 0.01},
            "wet": {"default": 0.5, "min": 0, "max": 1, "step": 0.01},
            "dry": {"default": 0.5, "min": 0, "max": 1, "step": 0.01}
        }
    },
    "compressor": {
        "name": "压缩器",
        "params": {
            "threshold": {"default": -20, "min": -60, "max": 0, "step": 0.1},
            "ratio": {"default": 4, "min": 1, "max": 20, "step": 0.1},
            "attack": {"default": 0.01, "min": 0, "max": 1, "step": 0.001},
            "release": {"default": 0.2, "min": 0, "max": 5, "step": 0.01}
        }
    },
    "filter": {
        "name": "滤波器",
        "params": {
            "filter_type": {
                "default": "lowpass",
                "options": ["lowpass", "highpass", "bandpass"]
            },
            "cutoff": {"default": 1000, "min": 20, "max": 20000, "step": 1},
            "q": {"default": 1.0, "min": 0.1, "max": 20, "step": 0.1}
        }
    }
}


class EffectParam(BaseModel):
    type: str
    params: Dict[str, Any]


class Track(BaseModel):
    file_id: str
    effects: List[EffectParam]
    position: float
    volume: Optional[float] = 1.0


class ExportRequest(BaseModel):
    tracks: List[Track]
    sample_rate: Optional[int] = 44100


@app.post("/api/upload")
async def upload_audio(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.mp3', '.wav']:
        raise HTTPException(status_code=400, detail="Only MP3 and WAV files are supported")
    
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    
    try:
        audio, sr = librosa.load(file_path, sr=None, mono=False)
        if audio.ndim == 1:
            channels = 1
        else:
            channels = audio.shape[0]
        duration = len(audio[0]) / sr if channels > 1 else len(audio) / sr
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Invalid audio file: {str(e)}")
    
    audio_store[file_id] = {
        "path": file_path,
        "sample_rate": sr,
        "channels": channels,
        "duration": duration,
        "filename": file.filename
    }
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "sample_rate": sr,
        "channels": channels,
        "duration": duration
    }


@app.get("/api/presets")
async def get_presets():
    return PRESETS


@app.post("/api/export")
async def export_mix(request: ExportRequest):
    if not request.tracks:
        raise HTTPException(status_code=400, detail="No tracks provided")
    
    target_sr = request.sample_rate
    max_duration = 0
    track_data = []
    
    for track in request.tracks:
        if track.file_id not in audio_store:
            raise HTTPException(status_code=404, detail=f"File not found: {track.file_id}")
        
        audio_info = audio_store[track.file_id]
        audio, sr = librosa.load(audio_info["path"], sr=target_sr, mono=False)
        
        if audio.ndim == 1:
            audio = audio.reshape(1, -1)
        
        effects_chain = [e.model_dump() for e in track.effects]
        processed_audio = apply_effects(audio, effects_chain, sample_rate=target_sr)
        
        processed_audio = processed_audio * track.volume
        
        track_end = track.position + (processed_audio.shape[1] / target_sr)
        if track_end > max_duration:
            max_duration = track_end
        
        track_data.append({
            "audio": processed_audio,
            "position": track.position,
            "channels": processed_audio.shape[0]
        })
    
    total_samples = int(max_duration * target_sr)
    max_channels = max(t["channels"] for t in track_data)
    
    mix = np.zeros((max_channels, total_samples), dtype=np.float32)
    
    for track in track_data:
        audio = track["audio"]
        start_sample = int(track["position"] * target_sr)
        track_samples = audio.shape[1]
        end_sample = min(start_sample + track_samples, total_samples)
        actual_samples = end_sample - start_sample
        
        if audio.shape[0] == 1 and max_channels == 2:
            audio = np.tile(audio, (2, 1))
        elif audio.shape[0] == 2 and max_channels == 1:
            audio = np.mean(audio, axis=0, keepdims=True)
        
        mix[:, start_sample:end_sample] += audio[:, :actual_samples]
    
    max_amplitude = np.max(np.abs(mix))
    if max_amplitude > 0:
        mix = mix / max_amplitude * 0.9
    
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name
    
    sf.write(tmp_path, mix.T if max_channels > 1 else mix[0], target_sr)
    
    return FileResponse(
        tmp_path,
        media_type="audio/wav",
        filename="mix_output.wav"
    )
