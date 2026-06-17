import Quagga from '@ericblade/quagga2'

export interface ScanResult {
  isbn: string
}

export function startIsbnScanner(videoElementId: string): Promise<ScanResult> {
  return new Promise((resolve, reject) => {
    try {
      Quagga.init(
        {
          inputStream: {
            type: 'LiveStream',
            target: `#${videoElementId}`,
            constraints: {
              facingMode: 'environment',
              width: { min: 640 },
              height: { min: 480 },
            },
          } as any,
          locator: {
            patchSize: 'medium',
            halfSample: true,
          },
          numOfWorkers: 2,
          decoder: {
            readers: ['ean_reader', 'ean_8_reader'],
          },
          locate: true,
        },
        (err) => {
          if (err) {
            reject(err)
            return
          }
          Quagga.start()
        }
      )

      Quagga.onDetected((result) => {
        const code = result.codeResult.code
        if (code && (code.length === 10 || code.length === 13)) {
          Quagga.stop()
          resolve({ isbn: code })
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

export function stopIsbnScanner(): void {
  try {
    Quagga.stop()
  } catch {
    // ignore
  }
}

export function mockScanIsbn(): Promise<ScanResult> {
  const mockIsbns = ['9787020024759', '9787506365437', '9787530209844', '9787544253994']
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ isbn: mockIsbns[Math.floor(Math.random() * mockIsbns.length)] })
    }, 2000)
  })
}
