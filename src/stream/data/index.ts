import { max, min } from "lodash";

export interface StreamParameters {
  mean: number;
  std: number;
}

export interface ControlParameters {
  controlDistance: number;
  warningDistance: number;
}

export const streamParameters: StreamParameters = {
  mean: 1.5,
  std: 0.15,
};

export const sampleParameters = {
  sampleSize: 5,
  preliminarySampleSize: 20,
};

export const controlParameters: ControlParameters = {
  controlDistance: 3,
  warningDistance: 2,
};

// export const MEAN = 1.5;
// export const STD = 0.15;
// export const sampleSize = 5;
//
// export const controlDistance = 3;
// export const controlDeviation = round((controlDistance * STD) / Math.sqrt(sampleSize), 4);
// export const UCL = MEAN + controlDeviation;
// export const LCL = MEAN - controlDeviation;
//
// export const warningDistance = 2;
// export const warningDeviation = round((warningDistance * STD) / Math.sqrt(sampleSize), 4);
// export const UWL = MEAN + warningDeviation;
// export const LWL = MEAN - warningDeviation;
//
// export const oneSigmaDeviation = round(STD / Math.sqrt(sampleSize), 4);
// export const U1sCL = MEAN + oneSigmaDeviation;
// export const L1sCL = MEAN - oneSigmaDeviation;
//
// export const controlLimits = {
//   UCL,
//   LCL,
//   U1sCL,
//   L1sCL,
//   UWL,
//   LWL,
//   MEAN,
//   STD,
// };

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
