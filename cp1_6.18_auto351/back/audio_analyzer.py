import numpy as np
import wave
import tempfile
import os
from typing import Tuple, Dict


class AudioAnalyzer:
    def __init__(self):
        self.emotion_types = ["开心", "平静", "忧伤", "焦虑", "愤怒"]

    def analyze(self, audio_bytes: bytes) -> Dict:
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            result = self._analyze_wav(tmp_path)
            os.unlink(tmp_path)
            return result
        except Exception as e:
            return self._fallback_analysis(str(e))

    def _analyze_wav(self, wav_path: str) -> Dict:
        try:
            with wave.open(wav_path, "rb") as wf:
                sample_rate = wf.getframerate()
                n_frames = wf.getnframes()
                n_channels = wf.getnchannels()
                sampwidth = wf.getsampwidth()

                raw_frames = wf.readframes(n_frames)
                audio_data = np.frombuffer(raw_frames, dtype=self._get_dtype(sampwidth))

                if n_channels > 1:
                    audio_data = audio_data.reshape(-1, n_channels).mean(axis=1)

                duration = n_frames / sample_rate if sample_rate > 0 else 1.0

                speech_rate = self._extract_speech_rate(audio_data, sample_rate, duration)
                pitch_mean = self._extract_pitch(audio_data, sample_rate)
                energy_std = self._extract_energy_fluctuation(audio_data)

                emotion_x, emotion_y = self._calculate_emotion_coords(
                    speech_rate, pitch_mean, energy_std
                )
                emotion_type = self._classify_emotion(emotion_x, emotion_y)

                return {
                    "emotion_x": round(float(emotion_x), 2),
                    "emotion_y": round(float(emotion_y), 2),
                    "emotion_type": emotion_type,
                    "speech_rate": round(float(speech_rate), 2),
                    "pitch_mean": round(float(pitch_mean), 2),
                    "energy_std": round(float(energy_std), 4),
                }
        except Exception:
            return self._fallback_analysis()

    def _get_dtype(self, sampwidth: int):
        if sampwidth == 1:
            return np.uint8
        elif sampwidth == 2:
            return np.int16
        elif sampwidth == 4:
            return np.int32
        return np.int16

    def _extract_speech_rate(self, audio_data: np.ndarray, sample_rate: int, duration: float) -> float:
        if len(audio_data) == 0 or duration <= 0:
            return 2.0

        normalized = audio_data.astype(np.float64)
        if np.max(np.abs(normalized)) > 0:
            normalized = normalized / np.max(np.abs(normalized))

        frame_size = int(sample_rate * 0.02)
        hop_size = int(sample_rate * 0.01)

        if frame_size <= 0 or hop_size <= 0:
            return 2.0

        energies = []
        for i in range(0, len(normalized) - frame_size, hop_size):
            frame = normalized[i : i + frame_size]
            energy = np.sqrt(np.mean(frame ** 2))
            energies.append(energy)

        if len(energies) == 0:
            return 2.0

        threshold = np.mean(energies) * 0.3
        speech_frames = sum(1 for e in energies if e > threshold)
        speech_ratio = speech_frames / len(energies)

        estimated_syllables = speech_ratio * duration * 4
        speech_rate = estimated_syllables / duration if duration > 0 else 2.0

        return np.clip(speech_rate, 0.5, 8.0)

    def _extract_pitch(self, audio_data: np.ndarray, sample_rate: int) -> float:
        if len(audio_data) == 0 or sample_rate <= 0:
            return 200.0

        normalized = audio_data.astype(np.float64)
        if np.max(np.abs(normalized)) > 0:
            normalized = normalized / np.max(np.abs(normalized))

        frame_size = min(len(normalized), int(sample_rate * 0.05))
        if frame_size < 128:
            return 200.0

        frame = normalized[:frame_size]
        windowed = frame * np.hanning(len(frame))

        spectrum = np.abs(np.fft.rfft(windowed))
        freqs = np.fft.rfftfreq(len(windowed), 1.0 / sample_rate)

        voiced_mask = (freqs >= 80) & (freqs <= 400)
        if np.sum(voiced_mask) == 0:
            return 200.0

        voiced_spectrum = spectrum[voiced_mask]
        voiced_freqs = freqs[voiced_mask]

        if np.sum(voiced_spectrum) == 0:
            return 200.0

        weighted_sum = np.sum(voiced_freqs * voiced_spectrum)
        total_weight = np.sum(voiced_spectrum)
        mean_pitch = weighted_sum / total_weight if total_weight > 0 else 200.0

        return float(np.clip(mean_pitch, 80.0, 400.0))

    def _extract_energy_fluctuation(self, audio_data: np.ndarray) -> float:
        if len(audio_data) == 0:
            return 0.01

        normalized = audio_data.astype(np.float64)
        if np.max(np.abs(normalized)) > 0:
            normalized = normalized / np.max(np.abs(normalized))

        chunk_size = max(1, len(normalized) // 50)
        chunk_energies = []

        for i in range(0, len(normalized), chunk_size):
            chunk = normalized[i : i + chunk_size]
            if len(chunk) > 0:
                energy = np.sqrt(np.mean(chunk ** 2))
                chunk_energies.append(energy)

        if len(chunk_energies) < 2:
            return 0.01

        energy_std = float(np.std(chunk_energies))
        return np.clip(energy_std, 0.0, 0.5)

    def _calculate_emotion_coords(
        self, speech_rate: float, pitch_mean: float, energy_std: float
    ) -> Tuple[float, float]:
        norm_rate = (speech_rate - 0.5) / (8.0 - 0.5)
        norm_pitch = (pitch_mean - 80.0) / (400.0 - 80.0)
        norm_energy = energy_std / 0.5 if 0.5 > 0 else 0.0

        activation = (norm_rate * 0.4 + norm_energy * 0.4 + norm_pitch * 0.2) * 100
        emotion_x = np.clip(activation, 0.0, 100.0)

        if norm_pitch > 0.6 and norm_rate > 0.5 and norm_energy < 0.3:
            pleasure = 75.0
        elif norm_rate > 0.7 and norm_energy > 0.5:
            pleasure = 25.0
        elif norm_rate < 0.3 and norm_pitch < 0.3:
            pleasure = 30.0
        elif norm_pitch > 0.7 and norm_energy > 0.4:
            pleasure = 20.0
        else:
            pleasure = 50.0 + (norm_pitch - 0.5) * 20

        emotion_y = np.clip(pleasure, 0.0, 100.0)

        return emotion_x, emotion_y

    def _classify_emotion(self, emotion_x: float, emotion_y: float) -> str:
        if emotion_x > 70 and emotion_y > 60:
            return "开心"
        elif emotion_x > 70 and emotion_y < 40:
            if emotion_y < 25:
                return "愤怒"
            return "焦虑"
        elif emotion_x < 30 and emotion_y < 40:
            return "忧伤"
        else:
            return "平静"

    def _fallback_analysis(self, error_msg: str = "") -> Dict:
        return {
            "emotion_x": 50.0,
            "emotion_y": 50.0,
            "emotion_type": "平静",
            "speech_rate": 2.0,
            "pitch_mean": 200.0,
            "energy_std": 0.05,
        }


audio_analyzer = AudioAnalyzer()
