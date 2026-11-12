import { DistributionData } from '../public/vis-decode-slider/assets/dataGeneration/DistributionCalculations';

export const chart = { width: 600, height: 450, margin: { top: 15, right: 15, bottom: 40, left: 50 } };
export const pixelX = (x: number) => 50 + ((x + 5) / 10) * 535;
export const pixelY = (y: number) => 410 - y * 395;

export function landmarks(data: DistributionData) {
  const peakIndex = data.pdfVals.indexOf(Math.max(...data.pdfVals));
  const upper = data.cdfVals.findIndex((value) => value >= 0.5);
  if (upper < 1 || data.cdfVals[0] >= 0.5) throw new Error('Median outside stimulus domain');
  const fraction = (0.5 - data.cdfVals[upper - 1]) / (data.cdfVals[upper] - data.cdfVals[upper - 1]);
  return {
    mode: data.xVals[peakIndex],
    median: data.xVals[upper - 1] + fraction * (data.xVals[upper] - data.xVals[upper - 1]),
  };
}

export function sampleY(data: DistributionData, x: number, pdf: boolean) {
  const values = pdf ? data.pdfVals : data.cdfVals;
  const index = Math.max(0, Math.min(data.xVals.length - 1, Math.round((x - data.xVals[0]) / 0.01)));
  return values[index];
}
