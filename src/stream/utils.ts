import { inRange, max, min } from "lodash";
import { DataSample } from "./data";
import { SignalStateType } from "./state";

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
  const lastSamples = samples.map((sample) => sample[sample.length - 1]);

  if (samples.length > 0) {
    const maxStart = max(lastSamples.map((sample) => sample.timestamp))!;
    const maxEnd = max(lastSamples.map((sample) => sample.timestamp))!;
    return {
      state: lastSample.timestamp === maxEnd ? SignalStateType.ALERT : SignalStateType.WARNING,
      timestamp: maxStart,
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
 * @param threshold - The max number of points with a trend.
 * @param trend - The trend to check.
 * @returns The points with a trend.
 */
export function getPointsWithTrend({
  stream,
  window,
  threshold,
  trend,
}: {
  stream: DataSample[];
  window: number;
  threshold?: number;
  trend: "increasing" | "decreasing";
}): DataSample[] {
  if (stream.length < window) {
    return [];
  }

  if (threshold === undefined) {
    threshold = window;
  }

  const streamReverse = [...stream].reverse();

  let posStart = window;
  do {
    const samples = streamReverse.slice(posStart - window, posStart);
    const points = samples.filter((sample) =>
      trend === "increasing" ? sample.mean > samples[0].mean : sample.mean < samples[0].mean,
    );

    if (points.length >= threshold) {
      return samples.reverse();
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

function isAlternating(points: number[]) {
  if (points.length < 2) return true; // Consider a single element or empty array as alternating

  let direction = 0; // 0: undefined, 1: up, -1: down

  for (let i = 1; i < points.length; i++) {
    if (points[i] > points[i - 1]) {
      if (direction === 1) return false; // two ups in a row
      direction = 1; // set direction to up
    } else if (points[i] < points[i - 1]) {
      if (direction === -1) return false; // two downs in a row
      direction = -1; // set direction to down
    } else {
      return false; // two equal points
    }
  }

  return true; // the array is alternating
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

/**
 * Returns the entropy of a set of points.
 *
 * The entropy is calculated as:
 *
 * ```
 * Η(X) = -Σ p(x) * log2(p(x))
 * H'(X) = Η(X) / log2(n)
 * ```
 *
 * where `p(x)` is the probability of a point `x`, with `H(X) ∈ [0, log2(n)]`, and `H'(X) ∈ [0, 1]`.
 * In information theory, entropy is a measure of the uncertainty or randomness of a set of points,
 * a higher entropy indicates randomness.
 *
 * @param points - The set of points.
 * @returns The entropy of the points.
 */
function computeEntropy(points: number[]): number {
  const frequencyTable = points.reduce(
    (acc, point) => {
      acc[point] = (acc[point] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const total = points.length;
  const maxEntropy = Object.values(frequencyTable).reduce((entropy, frequency) => {
    const p = frequency / total;
    return entropy - p * Math.log2(p);
  }, 0);

  // Scale the entropy to [0, 1]
  return maxEntropy / Math.log2(Object.keys(frequencyTable).length);
}
