import { DataSample, FactorsForCL, StreamParameters } from "./index";


/**
 * Estimate the parameters of a data stream.
 *
 * **Note**: This function estimates the stream parameters using the range of the samples.
 *
 * @param samples - Data samples
 * @returns Estimated stream parameters
 */
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
  /**Center Line */
  CenterLine: number;
  /**Standard Deviation */
  STD: number;
}

export interface ChartControlLimits {
  xBar: ControlLimits;
  R: ControlLimits;
}

export function computeChartControlLimits({
  mean,
  std,
  factors,
}: {
  mean: number;
  std: number;
  factors: FactorsForCL;
}): ChartControlLimits {
  return {
    xBar: {
      ...computeControlLimits({
        center: mean,
        UCD: factors.A2 * std,
        LCD: factors.A2 * std,
      }),
      CenterLine: mean,
      STD: std,
    },
    R: {
      ...computeControlLimits({
        center: 0,
        UCD: factors.D4 * std,
        LCD: factors.D3 * std,
      }),
      CenterLine: mean,
      STD: std,
    },
  };
}

/**
 * Compute control limits for a control chart.
 * @param center - Center line
 * @param UCD - Upper control deviation
 * @param LCD - Lower control deviation
 */
function computeControlLimits({
  center,
  UCD,
  LCD,
}: {
  center: number;
  UCD: number;
  LCD: number;
}): Omit<ControlLimits, "CenterLine" | "STD"> {
  const UCL = center + UCD;
  const LCL = center - LCD;

  const UWL = center + UCD * (2 / 3);
  const LWL = center - LCD * (2 / 3);

  const U1sCL = center + UCD * (1 / 3);
  const L1sCL = center - LCD * (1 / 3);
  return { UCL, LCL, U1sCL, L1sCL, UWL, LWL };
}
