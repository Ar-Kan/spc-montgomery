import { round } from "lodash";

export const MEAN = 1.5;
export const STD = 0.15;
export const sampleSize = 5;

export const controlDistance = 3;
export const controlDeviation = round((controlDistance * STD) / Math.sqrt(sampleSize), 4);
export const UCL = MEAN + controlDeviation;
export const LCL = MEAN - controlDeviation;

export const warningDistance = 2;
export const warningDeviation = round((warningDistance * STD) / Math.sqrt(sampleSize), 4);
export const UWL = MEAN + warningDeviation;
export const LWL = MEAN - warningDeviation;

export const oneSigmaDeviation = round(STD / Math.sqrt(sampleSize), 4);
export const U1sCL = MEAN + oneSigmaDeviation;
export const L1sCL = MEAN - oneSigmaDeviation;

export const controlLimits = {
  UCL,
  LCL,
  U1sCL,
  L1sCL,
  UWL,
  LWL,
  MEAN,
  STD,
};

export class DataSample {
  constructor(
    public readonly timestamp: number,
    public readonly sample: number[],
  ) {}

  get mean() {
    return this.sample.reduce((a, b) => a + b, 0) / this.sample.length;
  }

  get std() {
    const mean = this.mean;
    return Math.sqrt(
      this.sample.reduce((a, b) => a + (b - mean) ** 2, 0) / (this.sample.length - 1),
    );
  }
}
