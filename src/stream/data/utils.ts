import { DataSample, StreamParameters } from "./index";

export function estimateParameters(samples: DataSample[]): StreamParameters {
  const mean = samples.reduce((a, b) => a + b.mean, 0) / samples.length;
  const std = samples.reduce((a, b) => a + b.range, 0) / samples.length;

  return { mean, std };
}

export interface ControlLimits {
  /**Upper Control Limit */
  UCL: number;
  /**Lower Control Limit */
  LCL: number;
  /**Upper one-sigma Control Limit */
  U1sCL: number;
  /**Lower one-sigma Control Limit */
  L1sCL: number;
  /**Upper Warning Limit */
  UWL: number;
  /**Lower Warning Limit */
  LWL: number;
  /**Mean */
  MEAN: number;
  /**Standard Deviation */
  STD: number;
}

export function computeControlLimits({
  mean,
  std,
  sampleSize,
  controlDistance = 3,
  warningDistance = 2,
}: {
  mean: number;
  std: number;
  sampleSize: number;
  controlDistance?: number;
  warningDistance?: number;
}): ControlLimits {
  const controlDeviation = (controlDistance * std) / Math.sqrt(sampleSize);
  const UCL = mean + controlDeviation;
  const LCL = mean - controlDeviation;

  const warningDeviation = (warningDistance * std) / Math.sqrt(sampleSize);
  const UWL = mean + warningDeviation;
  const LWL = mean - warningDeviation;

  const oneSigmaDeviation = std / Math.sqrt(sampleSize);
  const U1sCL = mean + oneSigmaDeviation;
  const L1sCL = mean - oneSigmaDeviation;

  return { UCL, LCL, U1sCL, L1sCL, UWL, LWL, MEAN: mean, STD: std };
}
