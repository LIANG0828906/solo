const MAX_DIMENSION = 512;
export function computeFrameCount(frameRate) {
    return Math.max(4, Math.min(8, Math.round(frameRate)));
}
export function detectRegions(width, height) {
    const headH = Math.floor(height * 0.3);
    const bodyStart = headH;
    const bodyH = height - headH;
    const torsoH = Math.floor(bodyH * 0.5);
    const legH = bodyH - torsoH;
    const armW = Math.max(4, Math.floor(width * 0.18));
    const torsoW = width - armW * 2;
    return {
        head: { x: Math.floor(width * 0.15), y: 0, w: Math.floor(width * 0.7), h: headH },
        torso: { x: armW, y: bodyStart, w: torsoW, h: torsoH },
        leftArm: { x: 0, y: bodyStart, w: armW, h: torsoH },
        rightArm: { x: width - armW, y: bodyStart, w: armW, h: torsoH },
        leftLeg: { x: armW, y: bodyStart + torsoH, w: Math.floor(torsoW / 2), h: legH },
        rightLeg: { x: armW + Math.floor(torsoW / 2), y: bodyStart + torsoH, w: torsoW - Math.floor(torsoW / 2), h: legH },
    };
}
function inRect(x, y, r) {
    return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}
function nearestNeighborSample(src, sw, sh, srcX, srcY, dst, di) {
    const sx = Math.max(0, Math.min(sw - 1, Math.round(srcX)));
    const sy = Math.max(0, Math.min(sh - 1, Math.round(srcY)));
    const si = (sy * sw + sx) * 4;
    dst[di] = src[si];
    dst[di + 1] = src[si + 1];
    dst[di + 2] = src[si + 2];
    dst[di + 3] = src[si + 3];
}
export function generateFrames(originalData, params) {
    let { width, height, data } = originalData;
    let imageData = originalData;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        const newW = Math.max(1, Math.floor(width * scale));
        const newH = Math.max(1, Math.floor(height * scale));
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = newW;
        tmpCanvas.height = newH;
        const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true });
        tmpCtx.imageSmoothingEnabled = false;
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = width;
        srcCanvas.height = height;
        (srcCanvas.getContext('2d')).putImageData(originalData, 0, 0);
        tmpCtx.drawImage(srcCanvas, 0, 0, newW, newH);
        imageData = tmpCtx.getImageData(0, 0, newW, newH);
        width = newW;
        height = newH;
        data = imageData.data;
    }
    const frameCount = computeFrameCount(params.frameRate);
    const regions = detectRegions(width, height);
    const stridePx = params.stride;
    const armRad = (params.armSwing * Math.PI) / 180;
    const frames = [];
    const srcData = new Uint8ClampedArray(data);
    for (let f = 0; f < frameCount; f++) {
        const phase = (f / frameCount) * Math.PI * 2;
        const dstData = new Uint8ClampedArray(width * height * 4);
        const bodyBob = Math.sin(phase) * 0.8;
        const legASwing = Math.sin(phase) * stridePx * 0.5;
        const legBSwing = Math.sin(phase + Math.PI) * stridePx * 0.5;
        const legALift = Math.max(0, -Math.sin(phase)) * stridePx * 0.15;
        const legBLift = Math.max(0, -Math.sin(phase + Math.PI)) * stridePx * 0.15;
        const armASwing = Math.sin(phase + Math.PI) * armRad;
        const armBSwing = Math.sin(phase) * armRad;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const di = (y * width + x) * 4;
                let srcX = x;
                let srcY = y;
                if (inRect(x, y, regions.leftLeg)) {
                    const lr = regions.leftLeg;
                    const relY = (y - lr.y) / Math.max(1, lr.h);
                    const swing = legASwing * relY;
                    const lift = legALift * (1 - relY * 0.7);
                    const pivotX = lr.x + lr.w / 2;
                    srcX = x - swing;
                    srcY = y + lift;
                    const tanA = Math.sin(phase) * 0.25 * relY;
                    srcX -= (x - pivotX) * 0;
                    srcX += tanA * (y - lr.y) * 0.3;
                    void pivotX;
                }
                else if (inRect(x, y, regions.rightLeg)) {
                    const rr = regions.rightLeg;
                    const relY = (y - rr.y) / Math.max(1, rr.h);
                    const swing = legBSwing * relY;
                    const lift = legBLift * (1 - relY * 0.7);
                    srcX = x - swing;
                    srcY = y + lift;
                    const tanB = Math.sin(phase + Math.PI) * 0.25 * relY;
                    srcX += tanB * (y - rr.y) * 0.3;
                }
                else if (inRect(x, y, regions.leftArm)) {
                    const la = regions.leftArm;
                    const pivotY = la.y + 2;
                    const relY = Math.min(1, Math.max(0, (y - pivotY) / Math.max(1, la.h)));
                    const pivotX = la.x + la.w - 1;
                    const angle = armASwing;
                    const dx = x - pivotX;
                    const dy = y - pivotY;
                    const cosA = Math.cos(angle);
                    const sinA = Math.sin(angle);
                    const rx = dx * cosA - dy * sinA;
                    const ry = dx * sinA + dy * cosA;
                    srcX = pivotX + rx;
                    srcY = pivotY + ry;
                    void relY;
                }
                else if (inRect(x, y, regions.rightArm)) {
                    const ra = regions.rightArm;
                    const pivotY = ra.y + 2;
                    const pivotX = ra.x;
                    const dx = x - pivotX;
                    const dy = y - pivotY;
                    const angle = armBSwing;
                    const cosA = Math.cos(angle);
                    const sinA = Math.sin(angle);
                    const rx = dx * cosA - dy * sinA;
                    const ry = dx * sinA + dy * cosA;
                    srcX = pivotX + rx;
                    srcY = pivotY + ry;
                }
                else if (inRect(x, y, regions.torso) || inRect(x, y, regions.head)) {
                    srcY = y + bodyBob;
                }
                if (srcX >= 0 &&
                    srcX < width &&
                    srcY >= 0 &&
                    srcY < height) {
                    nearestNeighborSample(srcData, width, height, srcX, srcY, dstData, di);
                }
            }
        }
        const output = new ImageData(dstData, width, height);
        frames.push({ imageData: output, width, height });
    }
    return frames;
}
