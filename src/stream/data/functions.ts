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

/**
 * Compute the Process Capability Ratio (PCR), which estimate the fraction of
 * items produced that will meet the specifications.
 *
 * The formula for the PCR is:
 * ```
 * PCR = (USL - LSL) / (6 * (std / d2))
 * ```
 * where `USL` is the Upper Specification Limit, `LSL` is the Lower Specification Limit,
 * `std` is the Standard Deviation, and `d2` is the Factor. Note that there is no mathematical
 * or statistical relationship between the control limits and specification limits.
 * @param LSL - Lower Specification Limit
 * @param USL - Upper Specification Limit
 * @param std - Standard Deviation
 * @param d2 - Factor
 * @returns Process Capability Ratio
 */
export function computePcr({
  LSL,
  USL,
  std,
  d2,
}: {
  USL: number;
  LSL: number;
  std: number;
  d2: number;
}): number {
  return (USL - LSL) / (6 * (std / d2));
}

/**
 * Compute the Average Run Length (ARL), which is the average number of samples
 * taken to detect a shift of one-sigma.
 * The formula for the ARL is:
 * ```
 * β = Φ(L - k√n) + Φ(-L - k√n)
 * ARL = 1 / (1 - β)
 * ```
 * where `Φ` is the Cumulative Distribution Function (CDF) of the standard normal distribution,
 * `L` is the control limit, `k` is the Factor, and `n` is the sample size.
 * Note that `β` is the probability of not detecting the shift on the first sample.
 *
 * @param betaRisk - Probability of not detecting the shift on the first sample
 */
export function computeArl(betaRisk: number): number {
  return Math.ceil(1 / (1 - betaRisk));
}
