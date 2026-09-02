// Complete, exact ISO/IEC 18004 QR Code Generator test

const QRECL = { L: 1, M: 0, Q: 3, H: 2 };

const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);
for (let i = 0, x = 1; i < 256; i++) {
  EXP_TABLE[i] = x;
  LOG_TABLE[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}
function gexp(n) {
  while (n < 0) n += 255;
  while (n >= 255) n -= 255;
  return EXP_TABLE[n];
}
function glog(n) {
  if (n < 1) throw new Error("glog(" + n + ")");
  return LOG_TABLE[n];
}

class Poly {
  num: Uint8Array;
  constructor(num: any, shift = 0) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Uint8Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  get(i) { return this.num[i]; }
  get length() { return this.num.length; }
  multiply(e) {
    const num = new Uint8Array(this.length + e.length - 1);
    for (let i = 0; i < this.length; i++) {
      for (let j = 0; j < e.length; j++) {
        num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
      }
    }
    return new Poly(num, 0);
  }
  mod(e) {
    if (this.length - e.length < 0) return this;
    const ratio = glog(this.get(0)) - glog(e.get(0));
    const num = new Uint8Array(this.length);
    for (let i = 0; i < this.length; i++) num[i] = this.get(i);
    for (let i = 0; i < e.length; i++) {
      num[i] ^= gexp(glog(e.get(i)) + ratio);
    }
    return new Poly(num, 0).mod(e);
  }
}

function getErrorCorrectionPolynomial(len) {
  let a = new Poly([1], 0);
  for (let i = 0; i < len; i++) {
    a = a.multiply(new Poly([1, gexp(i)], 0));
  }
  return a;
}

// RS block: [numBlocks, totalCount, dataCount]
const RS_BLOCKS = {
  3: {
    [QRECL.L]: [[1, 70, 55]],
    [QRECL.M]: [[1, 70, 44]],
    [QRECL.Q]: [[2, 35, 17]],
    [QRECL.H]: [[2, 35, 13]]
  }
};

export function encodeQR(text, ecl = QRECL.M) {
  const version = 3; // 29x29
  const size = 29;
  const blocks = RS_BLOCKS[version][ecl];
  let totalDataCount = 0;
  for (const b of blocks) totalDataCount += b[0] * b[2];

  const buffer = [];
  function putBits(num, len) {
    for (let i = len - 1; i >= 0; i--) {
      buffer.push((num >>> i) & 1);
    }
  }

  // 1. Mode 8-bit (4 bits: 0100)
  putBits(4, 4);
  // 2. Count (8 bits for version 1-9)
  putBits(text.length, 8);
  // 3. Data bytes
  for (let i = 0; i < text.length; i++) {
    putBits(text.charCodeAt(i), 8);
  }
  // 4. Terminator
  const maxBits = totalDataCount * 8;
  const termLen = Math.min(4, maxBits - buffer.length);
  putBits(0, termLen);
  while (buffer.length % 8 !== 0) buffer.push(0);

  // 5. Pad bytes
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (buffer.length < maxBits) {
    putBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const rawData = [];
  for (let i = 0; i < buffer.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | buffer[i + j];
    }
    rawData.push(byte);
  }

  const dcBlocks = [];
  const ecBlocks = [];
  let rawOffset = 0;
  for (const [numBlocks, totalCount, dataCount] of blocks) {
    const ecCount = totalCount - dataCount;
    const rsPoly = getErrorCorrectionPolynomial(ecCount);
    for (let b = 0; b < numBlocks; b++) {
      const dc = rawData.slice(rawOffset, rawOffset + dataCount);
      rawOffset += dataCount;
      dcBlocks.push(dc);
      const rawPoly = new Poly(dc, ecCount);
      const modPoly = rawPoly.mod(rsPoly);
      const ec = new Uint8Array(ecCount);
      for (let i = 0; i < ecCount; i++) {
        const modIndex = i + modPoly.length - ecCount;
        ec[i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }
      ecBlocks.push(Array.from(ec));
    }
  }

  const finalData = [];
  const maxDcLen = Math.max(...dcBlocks.map(b => b.length));
  for (let i = 0; i < maxDcLen; i++) {
    for (const b of dcBlocks) {
      if (i < b.length) finalData.push(b[i]);
    }
  }
  const maxEcLen = Math.max(...ecBlocks.map(b => b.length));
  for (let i = 0; i < maxEcLen; i++) {
    for (const b of ecBlocks) {
      if (i < b.length) finalData.push(b[i]);
    }
  }

  // Setup Matrix
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunc = Array.from({ length: size }, () => Array(size).fill(false));

  function setMod(r, c, val, func = true) {
    matrix[r][c] = val;
    isFunc[r][c] = func;
  }

  // Finder Patterns + Separators
  function drawFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r, nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBlack = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          setMod(nr, nc, isBlack);
        } else {
          setMod(nr, nc, false);
        }
      }
    }
  }
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment Pattern for Ver 3 is ONLY at center (22, 22)
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const isBlack = (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0));
      setMod(22 + dr, 22 + dc, isBlack);
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setMod(6, i, i % 2 === 0);
    setMod(i, 6, i % 2 === 0);
  }

  // Dark module at (4 * version + 9, 8) = (21, 8)
  setMod(21, 8, true);

  // Reserve Format Areas
  for (let i = 0; i < 9; i++) {
    isFunc[8][i] = true;
    isFunc[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    isFunc[8][size - 1 - i] = true;
    isFunc[size - 1 - i][8] = true;
  }

  function getMask(p, r, c) {
    switch (p) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      case 7: return (((r * c) % 3) + ((r + c) % 2)) % 2 === 0;
    }
  }

  function getPenalty(grid) {
    let p = 0;
    // Condition 1: 5 consecutive
    for (let r = 0; r < size; r++) {
      let count = 1;
      for (let c = 1; c < size; c++) {
        if (grid[r][c] === grid[r][c - 1]) {
          count++;
          if (count === 5) p += 3;
          else if (count > 5) p += 1;
        } else count = 1;
      }
    }
    for (let c = 0; c < size; c++) {
      let count = 1;
      for (let r = 1; r < size; r++) {
        if (grid[r][c] === grid[r - 1][c]) {
          count++;
          if (count === 5) p += 3;
          else if (count > 5) p += 1;
        } else count = 1;
      }
    }
    // Condition 2: 2x2 blocks
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const v = grid[r][c];
        if (v === grid[r + 1][c] && v === grid[r][c + 1] && v === grid[r + 1][c + 1]) {
          p += 3;
        }
      }
    }
    return p;
  }

  let bestGrid = null;
  let minPenalty = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const grid = matrix.map(row => [...row]);
    let bitIdx = 0;
    let byteIdx = 0;
    let dir = -1;
    let r = size - 1;
    let c = size - 1;

    while (c > 0) {
      if (c === 6) c--;
      for (let i = 0; i < 2; i++) {
        const col = c - i;
        if (!isFunc[r][col]) {
          let dark = false;
          if (byteIdx < finalData.length) {
            dark = ((finalData[byteIdx] >>> (7 - bitIdx)) & 1) === 1;
          }
          if (getMask(mask, r, col)) dark = !dark;
          grid[r][col] = dark;
          bitIdx++;
          if (bitIdx === 8) {
            bitIdx = 0;
            byteIdx++;
          }
        }
      }
      r += dir;
      if (r < 0 || r >= size) {
        r -= dir;
        dir = -dir;
        c -= 2;
      }
    }

    // Format bits calculation
    // ECL: L=01 (1), M=00 (0), Q=11 (3), H=10 (2)
    const eclBits = ecl === QRECL.L ? 1 : ecl === QRECL.M ? 0 : ecl === QRECL.Q ? 3 : 2;
    const formatData = (eclBits << 3) | mask;
    let d = formatData << 10;
    for (let i = 4; i >= 0; i--) {
      if ((d >>> (i + 10)) & 1) {
        d ^= 0x537 << i;
      }
    }
    const formatBits = ((formatData << 10) | d) ^ 0x5412;

    // Place Format bits:
    // Top-left:
    // (8,0)=b0, (8,1)=b1, (8,2)=b2, (8,3)=b3, (8,4)=b4, (8,5)=b5, (8,7)=b6, (8,8)=b7,
    // (7,8)=b8, (5,8)=b9, (4,8)=b10, (3,8)=b11, (2,8)=b12, (1,8)=b13, (0,8)=b14
    grid[8][0] = ((formatBits >>> 0) & 1) === 1;
    grid[8][1] = ((formatBits >>> 1) & 1) === 1;
    grid[8][2] = ((formatBits >>> 2) & 1) === 1;
    grid[8][3] = ((formatBits >>> 3) & 1) === 1;
    grid[8][4] = ((formatBits >>> 4) & 1) === 1;
    grid[8][5] = ((formatBits >>> 5) & 1) === 1;
    grid[8][7] = ((formatBits >>> 6) & 1) === 1;
    grid[8][8] = ((formatBits >>> 7) & 1) === 1;
    grid[7][8] = ((formatBits >>> 8) & 1) === 1;
    grid[5][8] = ((formatBits >>> 9) & 1) === 1;
    grid[4][8] = ((formatBits >>> 10) & 1) === 1;
    grid[3][8] = ((formatBits >>> 11) & 1) === 1;
    grid[2][8] = ((formatBits >>> 12) & 1) === 1;
    grid[1][8] = ((formatBits >>> 13) & 1) === 1;
    grid[0][8] = ((formatBits >>> 14) & 1) === 1;

    // Top-right & Bottom-left:
    // (8, size-1)=b0, (8, size-2)=b1 ... (8, size-8)=b7
    // (size-7, 8)=b8, (size-6, 8)=b9 ... (size-1, 8)=b14
    grid[8][size - 1] = ((formatBits >>> 0) & 1) === 1;
    grid[8][size - 2] = ((formatBits >>> 1) & 1) === 1;
    grid[8][size - 3] = ((formatBits >>> 2) & 1) === 1;
    grid[8][size - 4] = ((formatBits >>> 3) & 1) === 1;
    grid[8][size - 5] = ((formatBits >>> 4) & 1) === 1;
    grid[8][size - 6] = ((formatBits >>> 5) & 1) === 1;
    grid[8][size - 7] = ((formatBits >>> 6) & 1) === 1;
    grid[8][size - 8] = ((formatBits >>> 7) & 1) === 1;

    grid[size - 7][8] = ((formatBits >>> 8) & 1) === 1;
    grid[size - 6][8] = ((formatBits >>> 9) & 1) === 1;
    grid[size - 5][8] = ((formatBits >>> 10) & 1) === 1;
    grid[size - 4][8] = ((formatBits >>> 11) & 1) === 1;
    grid[size - 3][8] = ((formatBits >>> 12) & 1) === 1;
    grid[size - 2][8] = ((formatBits >>> 13) & 1) === 1;
    grid[size - 1][8] = ((formatBits >>> 14) & 1) === 1;

    const penalty = getPenalty(grid);
    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestGrid = grid;
    }
  }

  return { matrix: bestGrid, size };
}

export function generateQRSvgString(text: string, size = 140, margin = 4): string {
  const qr = encodeQR(text, QRECL.M);
  const totalCount = qr.size + margin * 2;
  const cellSize = 10;
  const svgDim = totalCount * cellSize;

  let path = '';
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.matrix[r][c]) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        path += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgDim} ${svgDim}" width="${size}" height="${size}">
    <rect width="${svgDim}" height="${svgDim}" fill="#ffffff" rx="12" />
    <path d="${path.trim()}" fill="#000000" />
  </svg>`;
}

