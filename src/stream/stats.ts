/**
 * Standard Normal variate using div-Muller transform.
 * @param mean - The mean.
 * @param std - The standard deviation.
 * @returns The random number.
 */
export function gaussianRandom(mean = 0, std = 1) {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
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
