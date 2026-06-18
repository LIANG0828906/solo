export async function parseAudio(file: File): Promise<{
  duration: number
  audioData: string
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        const audioData = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        resolve({
          duration: audioBuffer.duration,
          audioData: `data:${file.type};base64,${audioData}`,
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

export function generateWaveformData(audioBuffer: AudioBuffer, samples: number): number[] {
  const channelData = audioBuffer.getChannelData(0)
  const blockSize = Math.floor(channelData.length / samples)
  const waveform: number[] = []

  for (let i = 0; i < samples; i++) {
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[i * blockSize + j])
    }
    waveform.push(sum / blockSize)
  }

  const max = Math.max(...waveform)
  return waveform.map((v) => v / max)
}

export function getRealTimeFrequencies(analyser: AnalyserNode): Uint8Array {
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)
  return dataArray
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
