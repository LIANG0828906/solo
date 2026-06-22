import { WeftPick, HistoryEntry, MAX_HISTORY, CANVAS_WIDTH, CANVAS_HEIGHT } from './types';
import { PatternRenderer } from './patternRenderer';
import { LoomEngine } from './loomEngine';

class GifEncoder {
  private width: number;
  private height: number;
  private delay: number;
  private image: number[] = [];
  private pixels: number[] = [];
  private indexedPixels: number[] = [];
  private colorTab: number[] = [];
  private neuQuant: NeuQuant | null = null;
  private nq: number = 1;
  private usedEntry: boolean[] = [];
  private out: number[] = [];
  private globalPalette: boolean = false;
  private repeat: number = -1;
  private disposed: number = -1;
  private firstFrame: boolean = true;
  private sizeSet: boolean = false;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.delay = 20;
  }

  setDelay(ms: number): void {
    this.delay = Math.round(ms / 10);
  }

  setRepeat(repeat: number): void {
    this.repeat = repeat;
  }

  start(): void {
    this.out = [];
    this.writeString('GIF89a');
  }

  addFrame(imageData: ImageData): boolean {
    this.getImagePixels(imageData);
    this.analyzePixels();
    if (this.firstFrame) {
      this.writeLSD();
      this.writePalette();
      if (this.repeat >= 0) {
        this.writeNetscapeExt();
      }
    }
    this.writeGraphicCtrlExt();
    this.writeImageDesc();
    if (!this.firstFrame || !this.globalPalette) {
      this.writePalette();
    }
    this.writePixels();
    this.firstFrame = false;
    return true;
  }

  finish(): Uint8Array {
    this.out.push(59);
    return new Uint8Array(this.out);
  }

  private getImagePixels(imageData: ImageData): void {
    const w = this.width;
    const h = this.height;
    this.pixels = new Array(w * h * 3);
    const data = imageData.data;
    let count = 0;
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const b = (i * w * 4) + j * 4;
        this.pixels[count++] = data[b] & 0xff;
        this.pixels[count++] = data[b + 1] & 0xff;
        this.pixels[count++] = data[b + 2] & 0xff;
      }
    }
  }

  private analyzePixels(): void {
    const len = this.pixels.length;
    const nPix = len / 3;
    this.indexedPixels = new Array(nPix);

    this.neuQuant = new NeuQuant(this.pixels, len, this.nq);
    this.colorTab = this.neuQuant.process();

    let k = 0;
    for (let j = 0; j < nPix; j++) {
      const r = this.pixels[k++] & 0xff;
      const g = this.pixels[k++] & 0xff;
      const b = this.pixels[k++] & 0xff;
      const index = this.neuQuant.map(r, g, b);
      this.usedEntry[index] = true;
      this.indexedPixels[j] = index;
    }

    this.pixels = [];
    this.nq = 0;
  }

  private writeLSD(): void {
    this.writeShort(this.width);
    this.writeShort(this.height);
    this.out.push(0x80 | 0x70 | 0x07);
    this.out.push(0);
    this.out.push(0);
  }

  private writePalette(): void {
    this.out.push(...this.colorTab);
    const n = (3 * 256) - this.colorTab.length;
    for (let i = 0; i < n; i++) {
      this.out.push(0);
    }
  }

  private writeNetscapeExt(): void {
    this.out.push(0x21);
    this.out.push(0xff);
    this.out.push(11);
    this.writeString('NETSCAPE2.0');
    this.out.push(3);
    this.out.push(1);
    this.writeShort(this.repeat);
    this.out.push(0);
  }

  private writeGraphicCtrlExt(): void {
    this.out.push(0x21);
    this.out.push(0xf9);
    this.out.push(4);
    const transp = 0;
    let disp = this.disposed;
    if (disp < 0) disp = 2;
    this.out.push(0 | (disp << 2) | 0 | 0);
    this.writeShort(this.delay);
    this.out.push(transp);
    this.out.push(0);
  }

  private writeImageDesc(): void {
    this.out.push(0x2c);
    this.writeShort(0);
    this.writeShort(0);
    this.writeShort(this.width);
    this.writeShort(this.height);
    if (this.firstFrame || this.globalPalette) {
      this.out.push(0);
    } else {
      this.out.push(0x80 | 0x07);
    }
  }

  private writePixels(): void {
    const enc = new LZWEncoder(this.width, this.height, this.indexedPixels, 8);
    enc.encode(this.out);
  }

  private writeShort(value: number): void {
    this.out.push(value & 0xff);
    this.out.push((value >> 8) & 0xff);
  }

  private writeString(str: string): void {
    for (let i = 0; i < str.length; i++) {
      this.out.push(str.charCodeAt(i));
    }
  }
}

class NeuQuant {
  private static readonly NETSIZE = 256;
  private static readonly PRIME1 = 49979687;
  private static readonly PRIME2 = 39916801;
  private static readonly PRIME3 = 161162377;
  private static readonly PRIME4 = 25165843;
  private static readonly GAMMA = 1024;
  private static readonly BETA = 64;
  private static readonly BETA_GAMMA = (NeuQuant.BETA * NeuQuant.GAMMA);
  private static readonly RADIUS_DEC = 30;
  private static readonly INIT_RADIUS = (NeuQuant.NETSIZE >> 3);
  private static readonly INIT_BIAS = ((NeuQuant.NETSIZE << 3) - 1);

  private network: number[][] = [];
  private colormap: number[] = new Array(3 * NeuQuant.NETSIZE);
  private netindex: number[] = new Array(256);
  private bias: number[] = new Array(NeuQuant.NETSIZE);
  private freq: number[] = new Array(NeuQuant.NETSIZE);
  private radpower: number[] = new Array(NeuQuant.NETSIZE >> 3);
  private thepicture: number[];
  private lengthcount: number;
  private samplefac: number;
  private alphadec: number;

  constructor(thepic: number[], len: number, sample: number) {
    this.thepicture = thepic;
    this.lengthcount = len;
    this.samplefac = sample;
    this.alphadec = 30 + ((sample - 1) / 3);

    for (let i = 0; i < NeuQuant.NETSIZE; i++) {
      this.network[i] = new Array(4);
      const v = (i << 8) / NeuQuant.NETSIZE;
      this.network[i][0] = v;
      this.network[i][1] = v;
      this.network[i][2] = v;
      this.freq[i] = ~~(65536 / NeuQuant.NETSIZE);
      this.bias[i] = 0;
    }
  }

  process(): number[] {
    let i;
    let j;
    let b;
    let g;
    let r;
    let radius;
    let rad;
    let alpha;
    let step;
    let delta;
    let samplepixels;
    let p;
    let pix;
    let lim;
    let maxnetpos = ~~(NeuQuant.NETSIZE - 1);
    let netbiasshift = 12;

    delta = ~~(0x10000 / this.alphadec);
    if (this.lengthcount < 3000) {
      this.samplefac = ~~1;
      alpha = ~~1;
    } else {
      alpha = ~~1024;
    }
    radius = ~~NeuQuant.INIT_RADIUS;
    rad = radius >> netbiasshift;
    if (rad <= 1) rad = 0;
    for (i = 0; i < rad; i++) {
      this.radpower[i] = ~~Math.exp(((i * i) / (-2 * (rad * rad / 4))) * NeuQuant.GAMMA);
    }
    step = Math.floor(this.lengthcount / (3 * this.samplefac));

    p = 0;
    pix = 0;
    if (step < 1) {
      step = 1;
    }
    for (i = 0; i < NeuQuant.NETSIZE; i++) {
      this.network[i][0] <<= 4;
      this.network[i][1] <<= 4;
      this.network[i][2] <<= 4;
      this.bias[i] = 0;
    }
    lim = ~~(this.lengthcount / 3);
    samplepixels = lim;
    for (i = 0; i < samplepixels; i++) {
      b = (this.thepicture[pix + 0] & 0xff) << 4;
      g = (this.thepicture[pix + 1] & 0xff) << 4;
      r = (this.thepicture[pix + 2] & 0xff) << 4;
      j = this.contest(b, g, r);

      this.alter(alpha, j, b, g, r);
      if (rad > 0) {
        this.alterneigh(rad, j, b, g, r);
      }

      pix += 3;
      if (pix >= lim) {
        pix = 0;
      }

      alpha -= delta;
      if ((i & 0xff) === 0) {
        radius -= NeuQuant.RADIUS_DEC;
        if (radius < 1) {
          rad = 0;
          break;
        }
        rad = radius >> netbiasshift;
        if (rad <= 1) rad = 0;
        for (j = 0; j < rad; j++) {
          this.radpower[j] = ~~Math.exp(((j * j) / (-2 * (rad * rad / 4))) * NeuQuant.GAMMA);
        }
      }
    }

    for (i = 0; i < NeuQuant.NETSIZE; i++) {
      this.colormap[3 * i] = (this.network[i][0] >> 4) & 0xff;
      this.colormap[3 * i + 1] = (this.network[i][1] >> 4) & 0xff;
      this.colormap[3 * i + 2] = (this.network[i][2] >> 4) & 0xff;
      this.network[i][0] = this.colormap[3 * i] | (this.colormap[3 * i] << 8);
      this.network[i][1] = this.colormap[3 * i + 1] | (this.colormap[3 * i + 1] << 8);
      this.network[i][2] = this.colormap[3 * i + 2] | (this.colormap[3 * i + 2] << 8);
    }
    this.inxbuild();
    return this.colormap;
  }

  map(b: number, g: number, r: number): number {
    return this.inxsearch(b, g, r);
  }

  private contest(b: number, g: number, r: number): number {
    let bestd = ~~1000000000;
    let best = ~~-1;
    let bestbiasd = ~~bestd;
    let bestbias = ~~best;

    for (let i = 0; i < NeuQuant.NETSIZE; i++) {
      let dist;
      const n = this.network[i];
      const dx = ~~((n[0] - b) >> 2);
      const dy = ~~((n[1] - g) >> 2);
      const dz = ~~((n[2] - r) >> 2);
      dist = dx * dx + dy * dy + dz * dz;

      if (dist < bestd) {
        bestd = dist;
        best = i;
      }
      const biasdist = dist - ((this.bias[i]) >> (12 - 2));
      if (biasdist < bestbiasd) {
        bestbiasd = biasdist;
        bestbias = i;
      }
      let betafreq = (this.freq[i] >> 10);
      this.freq[i] -= betafreq;
      this.bias[i] += (betafreq << 10);
    }
    this.freq[best] += NeuQuant.BETA;
    this.bias[best] -= NeuQuant.BETA_GAMMA;
    return bestbias;
  }

  private alter(alpha: number, i: number, b: number, g: number, r: number): void {
    this.network[i][0] -= (alpha * (this.network[i][0] - b)) / NeuQuant.INIT_BIAS;
    this.network[i][1] -= (alpha * (this.network[i][1] - g)) / NeuQuant.INIT_BIAS;
    this.network[i][2] -= (alpha * (this.network[i][2] - r)) / NeuQuant.INIT_BIAS;
  }

  private alterneigh(rad: number, i: number, b: number, g: number, r: number): void {
    let lo = ~~Math.abs(i - rad);
    let hi = ~~(i + rad);
    if (lo < 0) lo = 0;
    if (hi >= NeuQuant.NETSIZE) hi = NeuQuant.NETSIZE - 1;
    let j = i + 1;
    let k = i - 1;
    let m = 1;
    let a;
    while ((j < hi) || (k > lo)) {
      a = this.radpower[m++];
      if (j < hi) {
        try {
          this.network[j][0] -= (a * alpha * (this.network[j][0] - b)) / NeuQuant.INIT_BIAS;
          this.network[j][1] -= (a * alpha * (this.network[j][1] - g)) / NeuQuant.INIT_BIAS;
          this.network[j][2] -= (a * alpha * (this.network[j][2] - r)) / NeuQuant.INIT_BIAS;
        } catch (e) {
          // ignore
        }
        j++;
      }
      if (k > lo) {
        try {
          this.network[k][0] -= (a * alpha * (this.network[k][0] - b)) / NeuQuant.INIT_BIAS;
          this.network[k][1] -= (a * alpha * (this.network[k][1] - g)) / NeuQuant.INIT_BIAS;
          this.network[k][2] -= (a * alpha * (this.network[k][2] - r)) / NeuQuant.INIT_BIAS;
        } catch (e) {
          // ignore
        }
        k--;
      }
    }
  }

  private inxbuild(): void {
    let previouscol = 0;
    let startpos = 0;
    for (let i = 0; i < NeuQuant.NETSIZE; i++) {
      let p = this.colormap;
      let q;
      let smallpos = i;
      let smallval = p[i * 3 + 1];
      for (let j = i + 1; j < NeuQuant.NETSIZE; j++) {
        q = p[j * 3 + 1];
        if (q < smallval) {
          smallpos = j;
          smallval = q;
        }
      }
      q = p[smallpos * 3];
      p[smallpos * 3] = p[i * 3];
      p[i * 3] = q;
      q = p[smallpos * 3 + 1];
      p[smallpos * 3 + 1] = p[i * 3 + 1];
      p[i * 3 + 1] = q;
      q = p[smallpos * 3 + 2];
      p[smallpos * 3 + 2] = p[i * 3 + 2];
      p[i * 3 + 2] = q;
      if (smallval !== previouscol) {
        this.netindex[previouscol] = (startpos + i) >> 1;
        for (let j = previouscol + 1; j < smallval; j++) {
          this.netindex[j] = i;
        }
        previouscol = smallval;
        startpos = i;
      }
    }
    this.netindex[previouscol] = (startpos + 255) >> 1;
    for (let j = previouscol + 1; j < 256; j++) {
      this.netindex[j] = 255;
    }
  }

  private inxsearch(b: number, g: number, r: number): number {
    let a;
    let p;
    let q;
    let best;
    let bestd;
    let dist;

    const e = this.colormap;
    best = 0;
    bestd = ~~1000;
    for (let i = this.netindex[g] - 1; i >= 0; i--) {
      p = i * 3;
      if (e[p + 1] === g) {
        if (e[p] === b && e[p + 2] === r) {
          return i;
        }
        dist = Math.abs(e[p] - b);
        dist += Math.abs(e[p + 2] - r);
        if (dist < bestd) {
          bestd = dist;
          best = i;
        }
        break;
      }
    }
    for (let i = this.netindex[g]; i < 256; i++) {
      p = i * 3;
      if (e[p + 1] === g) {
        if (e[p] === b && e[p + 2] === r) {
          return i;
        }
        dist = Math.abs(e[p] - b);
        dist += Math.abs(e[p + 2] - r);
        if (dist < bestd) {
          bestd = dist;
          best = i;
        }
        break;
      }
    }
    return best;
  }
}

class LZWEncoder {
  private static readonly EOF = -1;
  private static readonly BITS = 12;
  private static readonly HSIZE = 5003;

  private width: number;
  private height: number;
  private pixels: number[];
  private initCodeSize: number;
  private remaining: number;
  private curPixel: number;
  private bitMask: number[] = [0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095];
  private accum: number[] = [0, 0, 0];
  private htab: number[] = [];
  private codetab: number[] = [];
  private freeEnt: number;
  private maxCode: number;
  private bitSize: number;
  private clearFlag: boolean;
  private global_init_bits: number;
  private ClearCode: number;
  private EOFCode: number;

  constructor(width: number, height: number, pixels: number[], colorDepth: number) {
    this.width = width;
    this.height = height;
    this.pixels = pixels;
    this.initCodeSize = Math.max(2, colorDepth);
    this.remaining = width * height;
    this.curPixel = 0;
    this.freeEnt = 0;
    this.maxCode = 0;
    this.bitSize = 0;
    this.clearFlag = false;
    this.global_init_bits = 0;
    this.ClearCode = 0;
    this.EOFCode = 0;
  }

  encode(out: number[]): void {
    this.compress(this.initCodeSize + 1, out);
  }

  private nextPixel(): number {
    if (this.remaining === 0) {
      return LZWEncoder.EOF;
    }
    this.remaining--;
    const pix = this.pixels[this.curPixel++] & 0xff;
    return pix;
  }

  private charOut(c: number, outs: number[]): void {
    this.accum[2] &= 0x1F;
    if (this.accum[1] === 8) {
      outs.push(this.accum[0] & 0xFF);
      outs.push((this.accum[0] >> 8) | (this.accum[1] << 5) | (this.accum[2] << 13));
      this.accum[1] = this.accum[2] & 7;
      this.accum[0] >>= 19;
    } else if (this.accum[1] === 16) {
      outs.push(this.accum[0] & 0xFF);
      outs.push((this.accum[0] >> 8) & 0xFF);
      outs.push((this.accum[0] >> 16) | (this.accum[1] << 4) | (this.accum[2] << 12));
      this.accum[1] = this.accum[2] & 0xF;
      this.accum[0] = this.accum[2] >> 4;
    } else {
      this.accum[0] |= c << this.accum[1];
      this.accum[1] += this.bitSize;
      return;
    }
    this.accum[0] |= c << this.accum[1];
    this.accum[1] += this.bitSize;
  }

  private clearBlock(outs: number[]): void {
    this.resetCodeTable(LZWEncoder.HSIZE);
    this.freeEnt = this.ClearCode + 2;
    this.clearFlag = true;
    this.output(this.ClearCode, outs);
  }

  private resetCodeTable(hsize: number): void {
    for (let i = 0; i < hsize; i++) {
      this.htab[i] = -1;
    }
  }

  private compress(init_bits: number, outs: number[]): void {
    let fcode;
    let i;
    let c;
    let ent;
    let disp;
    let hsize_reg;
    let hshift;

    this.global_init_bits = init_bits;
    this.clearFlag = false;
    this.bitSize = this.global_init_bits;
    this.maxCode = this.getMaxCode(this.bitSize);

    this.ClearCode = 1 << (this.bitSize - 1);
    this.EOFCode = this.ClearCode + 1;
    this.freeEnt = this.ClearCode + 2;

    outs.push(0);

    this.accum[0] = 0;
    this.accum[1] = 0;
    this.accum[2] = 0;

    hsize_reg = LZWEncoder.HSIZE;
    this.resetCodeTable(hsize_reg);

    hshift = 0;
    for (fcode = hsize_reg; fcode < 65536; fcode *= 2) {
      ++hshift;
    }
    hshift = 8 - hshift;

    this.clearBlock(outs);

    let c1 = 0;
    if ((c1 = this.nextPixel()) === LZWEncoder.EOF) {
      return;
    }

    ent = c1;

    while ((c = this.nextPixel()) !== LZWEncoder.EOF) {
      fcode = (c << LZWEncoder.BITS) + ent;
      i = (c << hshift) ^ ent;

      if (this.htab[i] === fcode) {
        ent = this.codetab[i];
        continue;
      } else if (this.htab[i] >= 0) {
        disp = hsize_reg - i;
        if (i === 0) {
          disp = 1;
        }
        do {
          if ((i -= disp) < 0) {
            i += hsize_reg;
          }

          if (this.htab[i] === fcode) {
            ent = this.codetab[i];
            break;
          }
        } while (this.htab[i] >= 0);
        continue;
      }
      this.output(ent, outs);
      ent = c;
      if (this.freeEnt < (1 << LZWEncoder.BITS)) {
        this.codetab[i] = this.freeEnt++;
        this.htab[i] = fcode;
      } else {
        this.clearBlock(outs);
      }
    }
    this.output(ent, outs);
    this.output(this.EOFCode, outs);
  }

  private output(code: number, outs: number[]): void {
    this.charOut(code, outs);
    if (this.freeEnt > this.maxCode || this.clearFlag) {
      if (this.clearFlag) {
        this.bitSize = this.global_init_bits;
        this.maxCode = this.getMaxCode(this.bitSize);
        this.clearFlag = false;
      } else {
        ++this.bitSize;
        if (this.bitSize === LZWEncoder.BITS) {
          this.maxCode = 1 << LZWEncoder.BITS;
        } else {
          this.maxCode = this.getMaxCode(this.bitSize);
        }
      }
    }
  }

  private getMaxCode(bits: number): number {
    return (1 << bits) - 1;
  }
}

export class GifExporter {
  private engine: LoomEngine;
  private renderer: PatternRenderer;
  private frameCanvas: HTMLCanvasElement;
  private frameCtx: CanvasRenderingContext2D;

  constructor(engine: LoomEngine, renderer: PatternRenderer) {
    this.engine = engine;
    this.renderer = renderer;
    this.frameCanvas = document.createElement('canvas');
    this.frameCanvas.width = CANVAS_WIDTH / 2;
    this.frameCanvas.height = CANVAS_HEIGHT / 2;
    this.frameCtx = this.frameCanvas.getContext('2d')!;
  }

  async export(onProgress?: (current: number, total: number) => void): Promise<Blob | null> {
    const history = this.engine.getState().history;
    const totalFrames = Math.min(history.length, 200);

    if (totalFrames === 0) {
      return null;
    }

    const encoder = new GifEncoder(this.frameCanvas.width, this.frameCanvas.height);
    encoder.setDelay(200);
    encoder.setRepeat(0);
    encoder.start();

    const tempEngine = new LoomEngine();
    const weftPicks: WeftPick[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const startTime = performance.now();

      const entry = history[i];
      for (const change of entry.harnessChanges) {
        tempEngine.toggleHarness(change.id);
      }
      tempEngine.setWeftColor(entry.weftPick.color);
      const pick = tempEngine.doPick();
      
      if (pick) {
        weftPicks.push(pick);
      }

      this.renderer.renderFrame(weftPicks, this.frameCanvas);
      const imageData = this.frameCtx.getImageData(0, 0, this.frameCanvas.width, this.frameCanvas.height);
      encoder.addFrame(imageData);

      const elapsed = performance.now() - startTime;
      if (elapsed > 500) {
        console.warn(`Frame ${i + 1} took ${elapsed}ms, exceeds 500ms target`);
      }

      if (onProgress) {
        onProgress(i + 1, totalFrames);
      }

      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const bytes = encoder.finish();
    const blob = new Blob([bytes], { type: 'image/gif' });

    if (blob.size > 5 * 1024 * 1024) {
      console.warn(`GIF size ${blob.size} bytes exceeds 5MB limit`);
    }

    return blob;
  }

  async exportAndDownload(filename: string = 'weaving-process.gif', onProgress?: (current: number, total: number) => void): Promise<boolean> {
    const blob = await this.export(onProgress);
    
    if (!blob) {
      return false;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  }
}
