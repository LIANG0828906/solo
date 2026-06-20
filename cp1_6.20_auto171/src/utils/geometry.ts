export function getTriangleVertices(centerX:number, centerY:number, size:number, rotationDeg:number): [number,number][] {
  const half = size / 2;
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const top: [number,number] = [centerX, centerY - half];
  const bl: [number,number] = [centerX - half, centerY + half];
  const br: [number,number] = [centerX + half, centerY + half];
  const rotate = (p:[number,number]): [number,number] => {
    const dx = p[0] - centerX;
    const dy = p[1] - centerY;
    return [centerX + dx * cos - dy * sin, centerY + dx * sin + dy * cos];
  };
  return [rotate(top), rotate(br), rotate(bl)];
}

export function pointInTriangle(px:number, py:number, vertices:[number,number][]): boolean {
  const [a,b,c] = vertices;
  const v0x = c[0] - a[0], v0y = c[1] - a[1];
  const v1x = b[0] - a[0], v1y = b[1] - a[1];
  const v2x = px - a[0], v2y = py - a[1];
  const dot00 = v0x*v0x + v0y*v0y;
  const dot01 = v0x*v1x + v0y*v1y;
  const dot02 = v0x*v2x + v0y*v2y;
  const dot11 = v1x*v1x + v1y*v1y;
  const dot12 = v1x*v2x + v1y*v2y;
  const inv = 1 / (dot00*dot11 - dot01*dot01);
  const u = (dot11*dot02 - dot01*dot12) * inv;
  const v = (dot00*dot12 - dot01*dot02) * inv;
  return u >= 0 && v >= 0 && u + v <= 1;
}

export function pointInRect(px:number, py:number, rx:number, ry:number, rw:number, rh:number): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

export function segmentIntersectsRect(x1:number,y1:number,x2:number,y2:number,rx:number,ry:number,rw:number,rh:number): boolean {
  if (pointInRect(x1,y1,rx,ry,rw,rh) || pointInRect(x2,y2,rx,ry,rw,rh)) return true;
  const x3 = rx, y3 = ry, x4 = rx + rw, y4 = ry;
  const x5 = x4, y5 = ry + rh, x6 = x3, y6 = y5;
  const segIntersect = (ax:number,ay:number,bx:number,by:number,cx:number,cy:number,dx:number,dy:number): boolean => {
    const d1x = bx - ax, d1y = by - ay;
    const d2x = dx - cx, d2y = dy - cy;
    const denom = d1x * d2y - d1y * d2x;
    if (denom === 0) return false;
    const t = ((cx - ax) * d2y - (cy - ay) * d2x) / denom;
    const s = ((cx - ax) * d1y - (cy - ay) * d1x) / denom;
    return t >= 0 && t <= 1 && s >= 0 && s <= 1;
  };
  return segIntersect(x1,y1,x2,y2,x3,y3,x4,y4) ||
         segIntersect(x1,y1,x2,y2,x4,y4,x5,y5) ||
         segIntersect(x1,y1,x2,y2,x5,y5,x6,y6) ||
         segIntersect(x1,y1,x2,y2,x6,y6,x3,y3);
}

export function segmentIntersectsPolygon(x1:number,y1:number,x2:number,y2:number,vertices:[number,number][]): boolean {
  if (vertices.length >= 3) {
    if (pointInTriangle(x1,y1,vertices) || pointInTriangle(x2,y2,vertices)) return true;
  }
  const segIntersect = (ax:number,ay:number,bx:number,by:number,cx:number,cy:number,dx:number,dy:number): boolean => {
    const d1x = bx - ax, d1y = by - ay;
    const d2x = dx - cx, d2y = dy - cy;
    const denom = d1x * d2y - d1y * d2x;
    if (denom === 0) return false;
    const t = ((cx - ax) * d2y - (cy - ay) * d2x) / denom;
    const s = ((cx - ax) * d1y - (cy - ay) * d1x) / denom;
    return t >= 0 && t <= 1 && s >= 0 && s <= 1;
  };
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    if (segIntersect(x1,y1,x2,y2,a[0],a[1],b[0],b[1])) return true;
  }
  return false;
}

export function getSpikeBoundingBox(spike:{x:number,y:number,size:number,rotation:number}):{x:number,y:number,w:number,h:number} {
  const verts = getTriangleVertices(spike.x, spike.y, spike.size, spike.rotation);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [vx, vy] of verts) {
    if (vx < minX) minX = vx;
    if (vy < minY) minY = vy;
    if (vx > maxX) maxX = vx;
    if (vy > maxY) maxY = vy;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
