import PathUtil from '../util/Legacy/PathUtil';
import type { Path } from 'd3-path';

import alea from 'alea';
import { createNoise3D, type NoiseFunction3D } from 'simplex-noise';

export default class Generator {
    private noise: NoiseFunction3D;
    constructor() {
        const prng = alea(0);
        this.noise = createNoise3D(prng);
    }

    /**
     * Generate a series of concentric designs, adjusting the noise varient for each
     * @param iterationCounts - number of iterations in each dimension [x, y]
     * @param fullDimensions - size of the full area [x, y]
     * Other parameters the same as for generateCirclePaths
     */
    public generateIterations(
        iterationCounts: [number, number],
        origin: [number, number],
        fullDimensions: [number, number],
        iterationGap: [number, number],
        size1 = 1,
        size2 = 0.2,
        thereAndBack = false,
        pathCount = 10,
        noiseDensity = 1,
        noiseVariant = 0,
        noiseDepth = 0.5,
        resolution = 20,
        lineWidth = 0.01
    ): Path[][] {
        const iterations: Path[][] = [];
        const dimensions: [number, number] = [
            fullDimensions[0] / iterationCounts[0] - iterationGap[0],
            fullDimensions[1] / iterationCounts[1] - iterationGap[1]
        ];
        for (let x = 0; x < iterationCounts[0]; x++) {
            for (let y = 0; y < iterationCounts[1]; y++) {
                const iterationNumber = 1 + x * iterationCounts[1] + y;
                const center: [number, number] = [
                    (x + 0.5) * (dimensions[0] + iterationGap[0]) + origin[0],
                    (y + 0.5) * (dimensions[1] + iterationGap[1]) + origin[1]
                ];
                iterations.push(
                    this.generateCirclePaths(
                        origin,
                        dimensions,
                        center,
                        size1,
                        size2,
                        thereAndBack,
                        pathCount,
                        noiseDensity,
                        noiseVariant * iterationNumber,
                        noiseDepth,
                        resolution,
                        lineWidth
                    )
                );
            }
        }
        return iterations;
    }

    /**
     * Generate a concentric design as a series of paths
     * @param dimensions - size of the area [x, y]
     * @param center - center of the design location within dimensions [x, y]
     * @param size1 - size of the first circle bound
     * @param size2 - size of the second circle bound
     * @param thereAndBack - thereAndBack mode (true/false)
     * @param pathCount - number of paths to generate
     * @param noiseDensity - smoothness/roughness of generated noise
     * @param noiseVariant - noise variant
     * @param noiseDepth - how far noise pushes the paths
     * @param resolution - how many points to generate per path
     * @param lineWidth - width of the path (for bounds adjustments)
     * @returns - an array of Path objects
     */
    public generateCirclePaths(
        origin: [number, number],
        dimensions: [number, number],
        center: [number, number],
        size1 = 1,
        size2 = 0.2,
        thereAndBack = false,
        pathCount = 10,
        noiseDensity = 1,
        noiseVariant = 0,
        noiseDepth = 0.5,
        resolution = 20,
        lineWidth = 0.01
    ): Path[] {
        // Always circular, along the smaller of the two dimensions
        const minDimension = Math.min(dimensions[0], dimensions[1]) / 2;

        // Calculate maximum warble (noise offset)
        // Noisy paths shouldn't be able to overflow bounds in thereAndBack mode
        let maxWarble = (noiseDepth * minDimension) / 2;
        if (thereAndBack) {
            maxWarble = Math.min(
                maxWarble,
                Math.abs(minDimension * (size1 - size2)) / (size1 < size2 ? 2 : 1)
            );
        }

        // Calculate bounds
        let bound1, bound2: number;
        if (thereAndBack) {
            if (size1 < size2) {
                // rough to rough
                bound1 =
                    lineWidth / 2 + maxWarble / 2 + size1 * (minDimension - maxWarble - lineWidth); // inside radius
                bound2 =
                    lineWidth / 2 + maxWarble / 2 + size2 * (minDimension - maxWarble - lineWidth); // outside radius
            } else {
                // smooth to smooth
                bound1 = lineWidth / 2 + size1 * (minDimension - lineWidth); // outside radius
                bound2 = lineWidth / 2 + size2 * (minDimension - lineWidth); // inside radius
            }
        } else {
            // smooth to rough or rough to smooth
            bound1 = lineWidth / 2 + size1 * (minDimension - lineWidth); // smooth radius
            bound2 = lineWidth / 2 + maxWarble / 2 + size2 * (minDimension - maxWarble - lineWidth); // rough radius
        }

        // Generate paths
        const paths: Path[] = [];
        for (let pathIdx = 0; pathIdx < pathCount; pathIdx++) {
            // Calculate inputs for this circle
            const progress = pathCount > 1 ? pathIdx / (pathCount - 1) : 1;
            const warble = thereAndBack
                ? size1 < size2
                    ? maxWarble * Math.abs(progress - 0.5)
                    : maxWarble / 2 - Math.abs(progress - 0.5) * maxWarble
                : (maxWarble * progress) / 2;
            const incrementalRadius = bound1 + (bound2 - bound1) * progress;

            // Generate and add a new path
            paths.push(
                this.generateCirclePath(
                    center,
                    incrementalRadius,
                    warble,
                    noiseDensity,
                    noiseVariant,
                    resolution
                )
            );
        }
        return paths;
    }

    /**
     * Calculate a single circle path from provided parameters
     */
    private generateCirclePath(
        center: [number, number],
        radius: number,
        warble: number,
        noiseDensity = 1,
        noiseVariant = 0,
        resolution = 20
    ): Path {
        const circlePoints: [number, number][] = [];
        for (let i = 0; i <= resolution; i++) {
            const modI = i % resolution;
            const angle = (modI / resolution) * Math.PI * 2;
            const normalizedNoise = this.noise(
                noiseDensity * (Math.cos(angle) + 1),
                noiseDensity * (Math.sin(angle) + 1),
                noiseVariant
            );
            const modifiedR = radius + normalizedNoise * warble;
            const x = center[0] + Math.cos(angle) * modifiedR;
            const y = center[1] + Math.sin(angle) * modifiedR;
            circlePoints.push([x, y]);
        }
        return PathUtil.createBezierSpline(circlePoints);
    }
}
