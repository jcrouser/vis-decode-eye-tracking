import { describe, expect, it } from 'vitest';
import { generateDistributionData } from '../public/vis-decode-slider/assets/dataGeneration/DistributionCalculations';
import { landmarks, pixelX, pixelY, sampleY } from './eyeTrackingPilot';

describe('pilot stimulus geometry', () => {
  it('maps data to the existing plot axes', () => {
    expect(pixelX(-5)).toBe(50);
    expect(pixelX(5)).toBe(585);
    expect(pixelY(0)).toBe(410);
    expect(pixelY(1)).toBe(15);
  });
  it.each([-0.65, 0, 0.65])('preserves deterministic stimuli and skew direction %s', (lambda) => {
    const params = { mu: 0, sigma: 0.8, lambda, p: 2, q: 10 };
    const data = generateDistributionData(params);
    expect(data).toEqual(generateDistributionData(params));
    expect(data.pdfVals.every(Number.isFinite)).toBe(true);
    expect(Math.max(...data.pdfVals)).toBeLessThan(1);
    const { median, mode } = landmarks(data);
    expect(mode).toBeCloseTo(0, 2);
    if (lambda === 0) expect(median).toBeCloseTo(0, 6);
    else expect(Math.sign(median)).toBe(Math.sign(lambda));
    expect(sampleY(data, -20, true)).toBe(data.pdfVals[0]);
  });
});
