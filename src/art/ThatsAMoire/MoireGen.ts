import type { Path } from 'd3-path';
import PathUtil from '../util/Legacy/PathUtil';

import alea from 'alea';
import { createNoise3D, type NoiseFunction3D } from 'simplex-noise';

type Point = [number, number];

export default class MoireGenerator {
    private noise: NoiseFunction3D;

    constructor() {
        const prng = alea(0);
        this.noise = createNoise3D(prng);
    }

    public generateRays(
        center: Point,
        outerRadius: number,
        innerRadius: number,
        rayCount = 20,
        rotation = 0,
        noiseIntensity = 1,
        noiseDensity = 0.3,
        noiseVariant = 0.0,
        noiseAsymmetry = 0.0,
        rayPointCount = 100
    ): Path[] {
        const rays: Path[] = [];
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2 + rotation;
            const ray = this.generateRay(
                center,
                outerRadius,
                innerRadius,
                angle,
                noiseIntensity,
                noiseDensity,
                noiseVariant,
                noiseAsymmetry,
                rayPointCount
            );
            rays.push(PathUtil.createCardinalSpline(ray, 1));
        }
        return rays;
    }

    private generateRay(
        center: Point,
        outerRadius: number,
        innerRadius: number,
        angle: number,
        noiseIntensity = 1,
        noiseDensity = 0.3,
        noiseVariant = 0.0,
        noiseAsymmetry = 0.0,
        rayPointCount = 100
    ): Point[] {
        const rayPath = [];

        for (let i = 0; i <= rayPointCount; i++) {
            const r = (outerRadius - innerRadius) * (i / rayPointCount) + innerRadius;
            let normalizedNoise = this.noise(
                noiseDensity * Math.cos(angle) * noiseAsymmetry + noiseVariant,
                noiseDensity * Math.sin(angle) * noiseAsymmetry + noiseVariant,
                noiseDensity * r + noiseVariant
            );
            normalizedNoise *= noiseIntensity;

            const rayPoint: Point = [
                center[0] + Math.cos(angle + normalizedNoise) * r,
                center[1] + Math.sin(angle + normalizedNoise) * r
            ];
            rayPath.push(rayPoint);
        }
        return rayPath;
    }
}
