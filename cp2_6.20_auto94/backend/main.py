import math
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

app = FastAPI(title="FFT Spectrum Analyzer Microservice",
              description="FastAPI-based FFT spectrum analysis service for audio waveform analysis")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FFTRequest(BaseModel):
    samples: list[float]
    sample_rate: int = 44100
    fft_size: int = 2048


class SpectrumBinResponse(BaseModel):
    frequency: float
    magnitude: float


class FFTResponse(BaseModel):
    bins: list[SpectrumBinResponse]


def _next_power_of_2(n: int) -> int:
    n -= 1
    n |= n >> 1
    n |= n >> 2
    n |= n >> 4
    n |= n >> 8
    n |= n >> 16
    n += 1
    return n


def _bit_reverse(n: int, bits: int) -> int:
    reversed_val = 0
    for i in range(bits):
        reversed_val = (reversed_val << 1) | (n & 1)
        n >>= 1
    return reversed_val


def _cooley_tukey_fft(real: np.ndarray, imag: np.ndarray) -> None:
    n = len(real)
    bits = int(np.log2(n))

    for i in range(n):
        j = _bit_reverse(i, bits)
        if j > i:
            real[i], real[j] = real[j], real[i]
            imag[i], imag[j] = imag[j], imag[i]

    for size in range(2, n + 1, 2):
        half = size // 2
        angle = -2 * math.pi / size
        w_real = math.cos(angle)
        w_imag = math.sin(angle)

        for i in range(0, n, size):
            cur_real, cur_imag = 1.0, 0.0
            for j in range(half):
                even_idx = i + j
                odd_idx = i + j + half

                t_real = cur_real * real[odd_idx] - cur_imag * imag[odd_idx]
                t_imag = cur_real * imag[odd_idx] + cur_imag * real[odd_idx]

                real[odd_idx] = real[even_idx] - t_real
                imag[odd_idx] = imag[even_idx] - t_imag
                real[even_idx] += t_real
                imag[even_idx] += t_imag

                new_cur_real = cur_real * w_real - cur_imag * w_imag
                cur_imag = cur_real * w_imag + cur_imag * w_real
                cur_real = new_cur_real


def _hann_window(n: int) -> np.ndarray:
    return 0.5 - 0.5 * np.cos(2 * math.pi * np.arange(n) / max(n - 1, 1))


@app.post("/fft", response_model=FFTResponse)
async def compute_fft(request: FFTRequest):
    try:
        samples = np.array(request.samples, dtype=np.float64)
        n = _next_power_of_2(min(len(samples), request.fft_size))

        if n < 2:
            raise HTTPException(status_code=400, detail="Input too small for FFT")

        start = max(0, len(samples) - n)
        real = np.zeros(n, dtype=np.float64)
        imag = np.zeros(n, dtype=np.float64)

        windowed = samples[start:start + n] * _hann_window(min(len(samples[start:start + n]), n))
        real[:len(windowed)] = windowed

        _cooley_tukey_fft(real, imag)

        num_bins = n // 2
        magnitudes = np.sqrt(real[:num_bins]**2 + imag[:num_bins]**2) / n
        frequencies = np.arange(num_bins) * request.sample_rate / n

        bins = [
            SpectrumBinResponse(frequency=float(f), magnitude=float(m))
            for f, m in zip(frequencies, magnitudes)
        ]

        return FFTResponse(bins=bins)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
