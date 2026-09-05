// Realistic ECG Lead II and RR Tachogram physiological generator for ICMR STS 2026

export interface EcgWavePoint {
  x: number;
  y: number;
}

/**
 * Generates accurate physiological ECG Lead II rhythm coordinates
 * based on the participant's resting heart rate (e.g. 70-85 bpm).
 */
export function generateLeadIiEcgPoints(
  bpm: number = 78,
  width: number = 700,
  height: number = 140
): string {
  const points: EcgWavePoint[] = [];
  const baseline = height * 0.58;
  const rrPixels = (60 / bpm) * (width / 5); // ~5 cycles across width
  
  let currentX = 0;
  points.push({ x: 0, y: baseline });

  while (currentX < width) {
    // 1. Isoelectric baseline before P wave
    currentX += rrPixels * 0.12;
    points.push({ x: currentX, y: baseline });

    // 2. P wave (smooth atrial depolarization)
    currentX += rrPixels * 0.04;
    points.push({ x: currentX, y: baseline - 8 });
    currentX += rrPixels * 0.04;
    points.push({ x: currentX, y: baseline });

    // 3. PR segment (isoelectric delay in AV node)
    currentX += rrPixels * 0.06;
    points.push({ x: currentX, y: baseline });

    // 4. QRS Complex (Ventricular Depolarization)
    // Q wave (small downward deflection)
    currentX += rrPixels * 0.015;
    points.push({ x: currentX, y: baseline + 6 });

    // R wave (sharp tall upward spike)
    currentX += rrPixels * 0.025;
    points.push({ x: currentX, y: baseline - 54 });

    // S wave (deep downward deflection)
    currentX += rrPixels * 0.025;
    points.push({ x: currentX, y: baseline + 16 });

    // 5. ST Segment (isoelectric)
    currentX += rrPixels * 0.04;
    points.push({ x: currentX, y: baseline });

    // 6. T wave (ventricular repolarization)
    currentX += rrPixels * 0.05;
    points.push({ x: currentX, y: baseline - 14 });
    currentX += rrPixels * 0.06;
    points.push({ x: currentX, y: baseline });

    // 7. TP interval (diastolic rest before next cycle with subtle respiratory baseline variation)
    const restDuration = rrPixels - (rrPixels * 0.47);
    const wander = Math.sin((currentX / width) * Math.PI * 3) * 2.2;
    currentX += restDuration;
    points.push({ x: currentX, y: baseline + wander });
  }

  // Convert points to SVG path 'd' string
  return points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, '');
}

/**
 * Generates a physiological RR Tachogram (Interbeat Interval time series in ms)
 */
export function generateRrTachogramPoints(
  meanRr: number = 772,
  sdnn: number = 24.1,
  width: number = 600,
  height: number = 100
): { pathString: string; points: { timeSec: number; rrMs: number }[] } {
  const dataPoints: { timeSec: number; rrMs: number }[] = [];
  const numBeats = 120; // sample of recording
  const baselineY = height * 0.5;

  let currentSec = 0;
  const svgCoords: { x: number; y: number }[] = [];

  for (let i = 0; i < numBeats; i++) {
    // Superimpose respiratory oscillation (HF: ~0.25 Hz) and Mayer waves (LF: ~0.1 Hz)
    const hfOsc = Math.sin((i / 4) * Math.PI) * (sdnn * 0.85);
    const lfOsc = Math.sin((i / 10) * Math.PI) * (sdnn * 0.65);
    const randomJitter = (Math.sin(i * 13) + Math.cos(i * 7)) * (sdnn * 0.2);

    const rrMs = Number((meanRr + hfOsc + lfOsc + randomJitter).toFixed(1));
    currentSec += rrMs / 1000;
    dataPoints.push({ timeSec: Number(currentSec.toFixed(1)), rrMs });

    const x = (i / (numBeats - 1)) * width;
    // Map ms to y coordinates
    const deltaFromMean = rrMs - meanRr;
    const y = baselineY - (deltaFromMean / (sdnn * 2.5)) * (height * 0.4);
    svgCoords.push({ x, y: Math.max(10, Math.min(height - 10, y)) });
  }

  const pathString = svgCoords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, '');

  return { pathString, points: dataPoints };
}
