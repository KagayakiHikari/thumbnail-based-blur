const clamp = (value, max) => Math.max(0, Math.min(max, value));

export function coverRect(imageWidth, imageHeight, width, height, position = [0.5, 0.5]) {
  if (![imageWidth, imageHeight, width, height].every(n => Number.isFinite(n) && n > 0)) throw new RangeError('Dimensions must be positive');
  const scale = Math.max(width / imageWidth, height / imageHeight);
  return { x: (width - imageWidth * scale) * position[0] || 0, y: (height - imageHeight * scale) * position[1] || 0, width: imageWidth * scale, height: imageHeight * scale };
}

// Separable sliding windows, with repeated edge pixels. Input is opaque RGBA.
export function boxBlur(input, width, height, radius, passes = 3) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || input.length !== width * height * 4) throw new RangeError('Invalid pixel dimensions');
  if (!Number.isInteger(radius) || radius < 0 || radius > 512 || !Number.isInteger(passes) || passes < 1 || passes > 10) throw new RangeError('Invalid blur parameters');
  let data = new Uint8ClampedArray(input);
  const horizontal = new Uint8ClampedArray(data.length);
  const output = new Uint8ClampedArray(data.length);
  const window = radius * 2 + 1;
  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < height; y++) {
      const sums = [0, 0, 0];
      for (let x = -radius; x <= radius; x++) for (let c = 0; c < 3; c++) sums[c] += data[(y * width + clamp(x, width - 1)) * 4 + c];
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          horizontal[i + c] = sums[c] / window;
          sums[c] += data[(y * width + clamp(x + radius + 1, width - 1)) * 4 + c] - data[(y * width + clamp(x - radius, width - 1)) * 4 + c];
        }
        horizontal[i + 3] = 255;
      }
    }
    for (let x = 0; x < width; x++) {
      const sums = [0, 0, 0];
      for (let y = -radius; y <= radius; y++) for (let c = 0; c < 3; c++) sums[c] += horizontal[(clamp(y, height - 1) * width + x) * 4 + c];
      for (let y = 0; y < height; y++) {
        const i = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          output[i + c] = sums[c] / window;
          sums[c] += horizontal[(clamp(y + radius + 1, height - 1) * width + x) * 4 + c] - horizontal[(clamp(y - radius, height - 1) * width + x) * 4 + c];
        }
        output[i + 3] = 255;
      }
    }
    data.set(output);
  }
  return data;
}

export function tintPixels(data, { saturation = 1.8, brightness = 1.04, tint = [248, 247, 255, 0.2], boost = 1.1 } = {}) {
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    for (let c = 0; c < 3; c++) {
      const filtered = Math.max(0, Math.min(255, (luma + saturation * (data[i + c] - luma)) * brightness));
      data[i + c] = ((1 - tint[3]) * filtered + tint[3] * tint[c]) * boost;
    }
    data[i + 3] = 255;
  }
  return data;
}
