import { max, min } from "lodash";

export interface StreamParameters {
  mean: number;
  std: number;
}

export const streamParameters: StreamParameters = {
  mean: 1.5,
  std: 0.15,
};

export const sampleParameters = {
  sampleSize: 5,
  preliminarySampleSize: 20,
};

/**
 * Factors for control limits of a control chart.
 */
export interface FactorsForCL {
  /**Factor for the average*/
  A2: number;
  /**Factor for the lower control limit of the range */
  D3: number;
  /**Factor for the upper control limit of the range */
  D4: number;
  d2: number;
}

/**
 * Factors for control limits for sample size 5.
 */
export const factors_n5: FactorsForCL = {
  A2: 0.577,
  D3: 0,
  D4: 2.114,
  d2: 2.326,
};

export class DataSample {
  constructor(
    public readonly timestamp: number,
    public readonly sample: number[],
  ) {}

  get size() {
    return this.sample.length;
  }

  get mean() {
    return this.sample.reduce((a, b) => a + b, 0) / this.size;
  }

  get std() {
    const mean = this.mean;
    return Math.sqrt(this.sample.reduce((a, b) => a + (b - mean) ** 2, 0) / (this.size - 1));
  }

  get max() {
    return max(this.sample)!;
  }

  get min() {
    return min(this.sample)!;
  }

  get range() {
    return this.max - this.min;
  }
}
