import PathUtil from '../util/Legacy/PathUtil';
import type { Path } from 'd3-path';

export default class Generator {
    public generate(
        latCount = 10,
        longCount = 10,
        lineResolution = 20,
        radius = 1,
        center = [0, 0]
    ): Path[] {
        // Internal calculations include endpoints (outline & poles) in counts...
        latCount += 2;
        longCount += 2;

        // Latitude lines
        const latPaths: Path[] = [];
        for (let lineIndex = 1; lineIndex < latCount - 1; lineIndex++) {
            const latPoints: [number, number][] = [];
            for (let pointIndex = 0; pointIndex < lineResolution; pointIndex++) {
                const pathProgress = pointIndex / (lineResolution - 1);
                const linesProgress = lineIndex / (latCount - 1);

                const latTheta = linesProgress * Math.PI;
                const latPhi = pathProgress * Math.PI - Math.PI / 2.0;
                // const x = radius * Math.sin(latTheta) * Math.cos(latPhi);
                const y = radius * Math.sin(latTheta) * Math.sin(latPhi);
                const z = radius * Math.cos(latTheta);
                latPoints.push([y + center[0], z + center[1]]);
            }
            latPaths.push(PathUtil.createBezierSpline(latPoints));
        }

        // Longitude Lines
        const longPaths: Path[] = [];
        for (let lineIndex = 0; lineIndex < longCount; lineIndex++) {
            // const latPoints: [number, number][] = [];
            const longPoints: [number, number][] = [];
            for (let pointIndex = 0; pointIndex < lineResolution; pointIndex++) {
                const pathProgress = pointIndex / (lineResolution - 1);
                const linesProgress = lineIndex / (longCount - 1);

                const longTheta = pathProgress * Math.PI;
                const longPhi = linesProgress * Math.PI - Math.PI / 2.0;
                // const x = radius * Math.sin(longTheta) * Math.cos(longPhi);
                const y = radius * Math.sin(longTheta) * Math.sin(longPhi);
                const z = radius * Math.cos(longTheta);
                longPoints.push([y + center[0], z + center[1]]);
            }
            longPaths.push(PathUtil.createBezierSpline(longPoints));
        }

        return [...longPaths, ...latPaths];
    }
}
