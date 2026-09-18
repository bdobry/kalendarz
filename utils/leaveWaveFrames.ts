export interface WaveSize { width: number; height: number; waveWidth: number; waveHeight: number }
type Point = { x: number; y: number };
const number = (value: number) => Number(value.toFixed(3));

// The same curves draw the fill and stroke, so they cannot drift apart.
function trace(points: Point[]) {
  let path = `M${number(points[0].x)} ${number(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 2)];
    const dx = (b.x - a.x) / 3;
    path += ` C${number(a.x + dx)} ${number(a.y + (b.y - before.y) / 6)} ${number(b.x - dx)} ${number(b.y - (after.y - a.y) / 6)} ${number(b.x)} ${number(b.y)}`;
  }
  return path;
}

export function leaveWaveFrames({ width, height, waveWidth, waveHeight }: WaveSize) {
  const periods = Math.max(1, Math.round(width / waveWidth));
  const steps = periods * 8;
  const wavelength = width / periods;
  return Array.from({ length: 9 }, (_, frame) => {
    const phase = (frame % 8) * Math.PI / 4;
    const points = (baseline: number, direction: number) => Array.from({ length: steps + 1 }, (_, i) => {
      const x = width * i / steps;
      // Ease the amplitude to zero at both joins; their height never changes.
      const envelope = Math.sin(Math.min(1, x / wavelength, (width - x) / wavelength) * Math.PI / 2);
      return { x, y: baseline + waveHeight / 4 * envelope * Math.sin(2 * Math.PI * periods * i / steps - direction * phase) };
    });
    const top = trace(points(waveHeight / 2, 1));
    const bottom = trace(points(height - waveHeight / 2, -1).reverse());
    return { fill: `${top} ${bottom.replace(/^M/, 'L')} Z`, edge: `${top} ${bottom}` };
  });
}
