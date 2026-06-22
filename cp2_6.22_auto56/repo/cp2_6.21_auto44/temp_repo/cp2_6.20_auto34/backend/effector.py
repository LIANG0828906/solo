import numpy as np
from scipy import signal


def _check_stereo(audio: np.ndarray) -> np.ndarray:
    if audio.ndim == 1:
        return audio.reshape(1, -1)
    return audio


def echo(audio: np.ndarray, delay: float = 0.3, feedback: float = 0.5, wet: float = 0.5, dry: float = 0.5, sample_rate: int = 44100) -> np.ndarray:
    audio = _check_stereo(audio)
    delay_samples = int(delay * sample_rate)
    output = np.zeros_like(audio)
    
    for ch in range(audio.shape[0]):
        channel_data = audio[ch]
        delayed = np.zeros_like(channel_data)
        current_feedback = feedback
        delay_ptr = delay_samples
        
        while delay_ptr < len(channel_data):
            end = min(delay_ptr + len(channel_data), len(delayed))
            source_end = min(len(channel_data), end - delay_ptr)
            delayed[delay_ptr:end] += channel_data[:source_end] * current_feedback
            current_feedback *= feedback
            delay_ptr += delay_samples
            if current_feedback < 0.001:
                break
        
        output[ch] = dry * channel_data + wet * delayed
    
    if audio.shape[0] == 1:
        return output[0]
    return output


def compressor(audio: np.ndarray, threshold: float = -20, ratio: float = 4, attack: float = 0.01, release: float = 0.2, sample_rate: int = 44100) -> np.ndarray:
    audio = _check_stereo(audio)
    threshold_linear = 10 ** (threshold / 20)
    attack_samples = int(attack * sample_rate)
    release_samples = int(release * sample_rate)
    
    output = np.zeros_like(audio)
    
    for ch in range(audio.shape[0]):
        channel_data = audio[ch]
        envelope = np.abs(channel_data)
        gain_reduction = np.ones_like(envelope)
        
        for i in range(len(envelope)):
            if envelope[i] > threshold_linear:
                excess = envelope[i] / threshold_linear
                target_gain = 1 / (excess ** ((ratio - 1) / ratio))
            else:
                target_gain = 1.0
            
            if target_gain < gain_reduction[i-1] if i > 0 else 1.0:
                coeff = np.exp(-1 / attack_samples)
            else:
                coeff = np.exp(-1 / release_samples)
            
            if i > 0:
                gain_reduction[i] = gain_reduction[i-1] * coeff + target_gain * (1 - coeff)
            else:
                gain_reduction[i] = target_gain
        
        output[ch] = channel_data * gain_reduction
    
    if audio.shape[0] == 1:
        return output[0]
    return output


def filter(audio: np.ndarray, filter_type: str = 'lowpass', cutoff: float = 1000, q: float = 1.0, sample_rate: int = 44100) -> np.ndarray:
    audio = _check_stereo(audio)
    nyquist = sample_rate / 2
    normalized_cutoff = cutoff / nyquist
    
    if filter_type == 'lowpass':
        b, a = signal.iirfilter(2, normalized_cutoff, btype='low', ftype='butter')
    elif filter_type == 'highpass':
        b, a = signal.iirfilter(2, normalized_cutoff, btype='high', ftype='butter')
    elif filter_type == 'bandpass':
        low = max(20, cutoff - cutoff / (2 * q)) / nyquist
        high = min(20000, cutoff + cutoff / (2 * q)) / nyquist
        b, a = signal.iirfilter(2, [low, high], btype='band', ftype='butter')
    else:
        raise ValueError(f"Unknown filter type: {filter_type}")
    
    output = np.zeros_like(audio)
    for ch in range(audio.shape[0]):
        output[ch] = signal.lfilter(b, a, audio[ch])
    
    if audio.shape[0] == 1:
        return output[0]
    return output


def apply_effects(audio: np.ndarray, effects_chain: list, sample_rate: int = 44100) -> np.ndarray:
    result = audio.copy()
    for effect in effects_chain:
        effect_type = effect.get('type', '').lower()
        params = effect.get('params', {})
        
        mapped_params = {'sample_rate': sample_rate}
        
        if effect_type == 'echo':
            if 'delayTime' in params:
                mapped_params['delay'] = params['delayTime']
            if 'feedback' in params:
                mapped_params['feedback'] = params['feedback']
            if 'mix' in params:
                mapped_params['wet'] = params['mix']
                mapped_params['dry'] = 1 - params['mix']
            if 'delay' in params:
                mapped_params['delay'] = params['delay']
            if 'wet' in params:
                mapped_params['wet'] = params['wet']
            if 'dry' in params:
                mapped_params['dry'] = params['dry']
            result = echo(result, **mapped_params)
        elif effect_type == 'compressor':
            if 'threshold' in params:
                mapped_params['threshold'] = params['threshold']
            if 'ratio' in params:
                mapped_params['ratio'] = params['ratio']
            if 'attack' in params:
                mapped_params['attack'] = params['attack']
            if 'release' in params:
                mapped_params['release'] = params['release']
            result = compressor(result, **mapped_params)
        elif effect_type == 'filter':
            if 'filter_type' in params:
                mapped_params['filter_type'] = params['filter_type']
            elif 'type' in params:
                mapped_params['filter_type'] = params['type']
            else:
                mapped_params['filter_type'] = 'lowpass'
            if 'frequency' in params:
                mapped_params['cutoff'] = params['frequency']
            elif 'cutoff' in params:
                mapped_params['cutoff'] = params['cutoff']
            if 'Q' in params:
                mapped_params['q'] = params['Q']
            elif 'q' in params:
                mapped_params['q'] = params['q']
            result = filter(result, **mapped_params)
    
    return result
