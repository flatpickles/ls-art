import CurveUtil from '../util/Legacy/PathUtil';
import type { Path } from 'd3-path';

export default class RelaxGenerator {
    private generatePolygonPath(
        center: [number, number],
        radius: number,
        polygonSides: number,
        fullResolution: number,
        pointsToGenerate: number,
        pointRotationOffset: number,
        polygonPointRotationOffset: number
    ): [number, number][] {
        // Calculate points around a polygon
        const polygonPoints: [number, number][] = [];
        for (let pointIdx = 0; pointIdx < pointsToGenerate; pointIdx++) {
            // Generate polar coordinates for this point along the polygon
            // reference: https://www.youtube.com/watch?v=AoOv6bWg9lk
            const theta =
                ((pointIdx - polygonPointRotationOffset) / (fullResolution - 1)) * 2 * Math.PI;
            const polyR =
                (radius * Math.cos(Math.PI / polygonSides)) /
                Math.cos(
                    theta -
                        ((2 * Math.PI) / polygonSides) *
                            Math.floor((polygonSides * theta + Math.PI) / (2 * Math.PI))
                );

            // Correct theta for rotation(s) and convert to cartesian coordinates
            const thetaCorrection =
                ((pointRotationOffset + polygonPointRotationOffset) / (fullResolution - 1)) *
                2 *
                Math.PI;
            const point: [number, number] = [
                center[0] + polyR * Math.cos(theta + thetaCorrection),
                center[1] + polyR * Math.sin(theta + thetaCorrection)
            ];
            polygonPoints.push(point);
        }
        return polygonPoints;
    }

    private generateCirclePath(
        center: [number, number],
        radius: number,
        fullResolution: number,
        pointsToGenerate: number,
        pointRotationOffset: number
    ): [number, number][] {
        // Calculate points around a circle
        const circlePoints: [number, number][] = [];
        for (let pointIdx = 0; pointIdx < pointsToGenerate; pointIdx++) {
            const angle = ((pointIdx + pointRotationOffset) / (fullResolution - 1)) * 2 * Math.PI;
            const point: [number, number] = [
                center[0] + radius * Math.cos(angle),
                center[1] + radius * Math.sin(angle)
            ];
            circlePoints.push(point);
        }
        return circlePoints;
    }

    public generate(
        size: [number, number],
        pathCount = 100,
        twoTone = false,
        resolution = 0.5,
        inset = 0.1,
        normalizeInset = true,
        polygonSides: number | undefined = 4,
        bottomSize: number | undefined = 0.5,
        topSize: number | undefined = 0.5,
        bottomPolygonRotation: number | null = 0.5,
        topPolygonRotation: number | null = null
    ): Path[][] {
        // Generate constants from input
        // Adjustments computed in point offsets to maintain sharp corners
        const generationPercentage = 0.25; // 1/4 of the way around the circle
        const rotationPercentage = 0.75; // rotated into fourth quadrant (clockwise from East axis)
        const pointsPerSegment = Math.ceil(resolution * 100);
        const fullResolution = polygonSides * pointsPerSegment * 2 + 1;
        const pointsToGenerate = Math.ceil(fullResolution * generationPercentage);
        const pointRotationOffset = Math.ceil(rotationPercentage * (fullResolution - 1));

        // Apply minimum shape size
        const minShapeSize = 0.01;
        topSize = (1 - minShapeSize) * topSize + minShapeSize;
        bottomSize = (1 - minShapeSize) * bottomSize + minShapeSize;

        // Constants for positioning and sizing
        const insetSize = inset * Math.min(size[0], size[1]);
        const radius1 = (Math.min(size[0], size[1]) - insetSize * 2) * bottomSize;
        const radius2 = (Math.min(size[0], size[1]) - insetSize * 2) * topSize;
        const center1: [number, number] = [insetSize, size[1] - insetSize];
        const center2: [number, number] =
            topPolygonRotation != null && normalizeInset
                ? [size[0] - radius2, radius2] // polygon inset needs to be done after generation (if normalized)
                : [size[0] - radius2 - insetSize, radius2 + insetSize]; // circle inset can be done before generation

        // Inline generators for guide paths
        const polygonGenerator = (center: [number, number], radius: number, rotation: number) =>
            this.generatePolygonPath(
                center,
                radius,
                polygonSides,
                fullResolution,
                pointsToGenerate,
                pointRotationOffset,
                Math.ceil(((rotation - 0.5) * (fullResolution - 1)) / polygonSides)
            );
        const circleGenerator = (center: [number, number], radius: number) =>
            this.generateCirclePath(
                center,
                radius,
                fullResolution,
                pointsToGenerate,
                pointRotationOffset
            );

        // Generate the two paths
        const bottomGuidePoints =
            bottomPolygonRotation != null
                ? polygonGenerator(center1, radius1, bottomPolygonRotation)
                : circleGenerator(center1, radius1);
        let topGuidePoints =
            topPolygonRotation != null
                ? polygonGenerator(center2, radius2, topPolygonRotation)
                : circleGenerator(center2, radius2);
        if (!bottomGuidePoints.length || !topGuidePoints.length)
            throw 'Guide paths should have the same length';

        // Inset the top polygon path, if needed (post-generation)
        if (topPolygonRotation != null && normalizeInset) {
            // Find the natural inset from this configuration (highest Y and rightmost X)
            const naturalInsetPositions = [0, size[1]];
            for (const point of topGuidePoints) {
                if (point[0] > naturalInsetPositions[0]) naturalInsetPositions[0] = point[0];
                if (point[1] < naturalInsetPositions[1]) naturalInsetPositions[1] = point[1];
            }
            const offsetInset = [
                insetSize - (size[0] - naturalInsetPositions[0]),
                insetSize - naturalInsetPositions[1]
            ];

            // Apply the offset inset
            const insetPoints: [number, number][] = [];
            for (const point of topGuidePoints) {
                const insetPoint: [number, number] = [
                    point[0] - offsetInset[0],
                    point[1] + offsetInset[1]
                ];
                insetPoints.push(insetPoint);
            }
            topGuidePoints = insetPoints;
        }

        // Interpolate between the paths
        const paths1: Path[] = [];
        const paths2: Path[] = [];
        const pathFlip = [false, false];
        let diffusedError = 0;
        for (let pathIdx = 0; pathIdx < pathCount; pathIdx++) {
            const t = pathIdx / (pathCount - 1);
            const pathPoints: [number, number][] = [];
            for (let pointIdx = 0; pointIdx < bottomGuidePoints.length; pointIdx++) {
                const point: [number, number] = [
                    bottomGuidePoints[pointIdx][0] * (1 - t) + topGuidePoints[pointIdx][0] * t,
                    bottomGuidePoints[pointIdx][1] * (1 - t) + topGuidePoints[pointIdx][1] * t
                ];
                pathPoints.push(point);
            }

            // Determine which layer to add to & flip the path if needed
            const firstLayer = !twoTone || t + diffusedError < 0.5;
            const flipIndex = firstLayer ? 0 : 1;
            if (pathFlip[flipIndex]) pathPoints.reverse();
            pathFlip[flipIndex] = !pathFlip[flipIndex];

            // Create the path (effectively a polyline)
            const path = CurveUtil.createCardinalSpline(pathPoints, 0);

            // Select which path layer to add to via one-dimensional error diffusion (dithering)
            if (firstLayer) {
                diffusedError = diffusedError + t;
                paths1.push(path);
            } else {
                diffusedError = diffusedError - (1 - t);
                paths2.push(path);
            }
        }

        // Return all the paths
        return twoTone ? [paths1, paths2] : [paths1];
    }
}
