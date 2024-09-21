import { inRange, max, min, unzip } from "lodash";
import { DataSample } from "../data";
import { computeEntropy, isAlternating, OLS } from "../stats";

import { SignalStateType } from "./models";

/**
 * Returns the state of a signal based on the most recent point.
 * @param lastSample - The most recent point.
 * @param samples - The samples that triggered the signal.
 * @returns The state of the signal.
 */
export function stateFromPointSignal({
  lastSample,
  samples,
}: {
  lastSample: DataSample;
  samples: DataSample[][];
}) {
  samples = samples.filter((sample) => sample.length > 0);

  if (samples.length > 0) {
    // When the flags begin
    const start = min(samples.map((sample) => sample[0].timestamp))!;
    // When the flags end
    const end = max(samples.map((sample) => sample[sample.length - 1].timestamp))!;
    return {
      state: lastSample.timestamp === end ? SignalStateType.ALERT : SignalStateType.WARNING,
      timestamp: start,
    };
  }

  return { state: SignalStateType.OK, timestamp: 0 };
}

/**
 * Returns the most recent points outside the control limits.
 *
 * @param stream - The data stream.
 * @param window - The consecutive number of points to check.
 * @param threshold - The max number of points outside the control limits.
 * @param limit - The control limit.
 * @param position - The position of the control limit.
 * @returns The points outside the control limits.
 */
export function getPointsInLimit({
  stream,
  window,
  threshold,
  limit,
  position,
}:
  | {
      stream: DataSample[];
      window: number;
      threshold?: number;
      limit: number;
      position: "above" | "below";
    }
  | {
      stream: DataSample[];
      window: number;
      threshold?: number;
      limit: [number, number];
      position: "in" | "out";
    }): DataSample[] {
  if (stream.length < window) {
    return [];
  }

  if (threshold === undefined) {
    threshold = window;
  }

  const streamReverse = [...stream].reverse();
  let limitRange = [0, 0];
  if (Array.isArray(limit)) {
    limitRange = [min(limit)!, max(limit)!];
  }

  let posStart = window;
  do {
    const samples = streamReverse.slice(posStart - window, posStart);
    const points = samples.filter((sample) => {
      const sMean = sample.mean;
      if (!Array.isArray(limit)) {
        return position === "above" ? sMean > limit : sMean < limit;
      }
      if (position === "in") {
        return inRange(sMean, limitRange[0], limitRange[1]);
      }
      return !inRange(sMean, limitRange[0], limitRange[1]);
    });

    if (points.length >= threshold) {
      return samples.reverse();
    }

    posStart++;
  } while (posStart < stream.length);

  return [];
}

/**
 * Returns the most recent points with a trend.
 * @param stream - The data stream.
 * @param window - The consecutive number of points to check.
 * @returns The points with a trend.
 */
export function getPointsWithTrend({
  stream,
  window,
}: {
  stream: DataSample[];
  window: number;
}): DataSample[] {
  if (stream.length < window) {
    return [];
  }

  const streamReverse = [...stream].reverse();

  let posStart = window;
  do {
    const samples = streamReverse.slice(posStart - window, posStart).reverse();

    const [x, y] = unzip(samples.map((sample, index) => [index, sample.mean]));
    const { m, r2 } = OLS(x, y);

    // Check if the correlation and slope are significant
    // |m| = 1 => |x| = |y|
    // FIXME: m values don't seem to be correct
    if (r2 > 0.6 && Math.abs(m) > 0.03) {
      return samples;
    }

    posStart++;
  } while (posStart < stream.length);

  return [];
}

/**
 * Returns the most recent points that are alternating up and down.
 * @param stream - The data stream.
 * @param window - The consecutive number of points to check.
 * @returns The alternating points.
 */
export function getAlternatingPoints({
  stream,
  window,
}: {
  stream: DataSample[];
  window: number;
}): DataSample[] {
  if (stream.length < window) {
    return [];
  }

  const streamReverse = [...stream].reverse();

  let posStart = window;
  do {
    const samples = streamReverse.slice(posStart - window, posStart);
    const points = samples.map((sample) => sample.mean);

    if (isAlternating(points)) {
      return samples.reverse();
    }

    posStart++;
  } while (posStart < stream.length);

  return [];
}

export function getPointsNonRandom({
  stream,
  window,
}: {
  stream: DataSample[];
  window: number;
}): DataSample[] {
  if (stream.length < window) {
    return [];
  }

  const streamReverse = [...stream].reverse();

  let posStart = window;
  do {
    const samples = streamReverse.slice(posStart - window, posStart);
    const points = samples.map((sample) => sample.mean);

    if (computeEntropy(points) < 0.5) {
      return samples.reverse();
    }

    posStart++;
  } while (posStart < stream.length);

  return [];
}
