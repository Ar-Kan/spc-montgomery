/**
 * Standard Normal variate using div-Muller transform.
 * @param mean - The mean.
 * @param std - The standard deviation.
 * @returns The random number.
 */
export function gaussianRandom(mean = 0, std = 1) {
  // Converting [0,1) to (0,1]
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * std + mean;
}

/**
 * Generate n random numbers from a Gaussian distribution.
 * @param n - The number of random numbers to generate.
 * @param mean - The mean.
 * @param std - The standard deviation.
 * @returns The random sample.
 */
export function nSample(n: number, mean = 0, std = 1) {
  return Array.from({ length: n }, () => gaussianRandom(mean, std));
}

/**
 * Scales a value from one range to another.
 * @param value - Value to scale
 * @param originalMin - Minimum value of the original range
 * @param originalMax - Maximum value of the original range
 * @param desiredMin - Minimum value of the new range
 * @param desiredMax - Maximum value of the new range
 * @returns The scaled value
 */
export function scaleValue(
  value: number,
  originalMin: number,
  originalMax: number,
  desiredMin: number,
  desiredMax: number,
): number {
  return (
    ((value - originalMin) / (originalMax - originalMin)) * (desiredMax - desiredMin) + desiredMin
  );
}

/**
 * Compute an Ordinary Least Squares (OLS) regression.
 *
 * The OLS regression is calculated as:
 * ```
 * m = (n * Σ(x_i * y_i) - Σ(x_i) * Σ(y_i)) / (n * Σ(x_i^2) - (Σ(x_i))^2)
 * b = (Σ(y_i) - m * Σ(x_i)) / n
 * ```
 * where `m` is the slope and `b` is the intercept of the function `y = m * x + b`.
 *
 * The overall quality of the fit is then parameterized in terms of a quantity
 * known as the coefficient of determination, `r^2`, which is calculated as:
 * ```
 * r^2 = (n * Σ(x_i * y_i) - Σ(x_i) * Σ(y_i))^2 / ((n * Σ(x_i^2) - (Σ(x_i))^2) * (n * Σ(y_i^2) - (Σ(y_i))^2))
 * ```
 *
 * @param x - The x values.
 * @param y - The y values.
 * @returns The slope, intercept, and coefficient of determination.
 */
export function OLS(x: number[], y: number[]) {
  const n = x.length;
  let Sx = 0;
  let Sy = 0;
  let Sxy = 0;
  let Sxx = 0;
  let Syy = 0;

  for (let i = 0; i < n; i++) {
    Sx += x[i];
    Sy += y[i];
    Sxy += x[i] * y[i];
    Sxx += x[i] ** 2;
    Syy += y[i] ** 2;
  }

  const m = (n * Sxy - Sx * Sy) / (n * Sxx - Sx ** 2);
  const b = (Sy - Sxx - Sx * Sxy) / (n * Sxx - Sx ** 2);

  const r2 = Math.pow(n * Sxy - Sx * Sy, 2) / ((n * Sxx - Sx ** 2) * (n * Syy - Sy ** 2));

  return { m, b, r2 };
}

/**
 * Check if a set of points is alternating up and down.
 * @param points - The set of points.
 * @returns `true` if the points are alternating, `false` otherwise.
 */
export function isAlternating(points: number[]) {
  // Consider a single element or empty array as alternating
  if (points.length < 2) return true;

  // 0: undefined, 1: up, -1: down
  let direction = 0;

  for (let i = 1; i < points.length; i++) {
    if (points[i] > points[i - 1]) {
      // two ups in a row
      if (direction === 1) return false;
      // set direction to up
      direction = 1;
    } else if (points[i] < points[i - 1]) {
      // two downs in a row
      if (direction === -1) return false;
      // set direction to down
      direction = -1;
    } else {
      // two equal points
      return false;
    }
  }

  // the array is alternating
  return true;
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
export function computeEntropy(points: number[]): number {
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
