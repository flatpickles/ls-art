export type Point = [number, number];
export type Polyline = Point[];
type MaskFunction = (point: Point) => boolean;

export default class PolylineUtil {
    // Divide a polyline into segments of a maximum length
    public static subdividePolyline(polyline: Polyline, maxSegmentLength: number): Polyline {
        const subdividedPolyline: Polyline = [];
        for (let pointIndex = 0; pointIndex < polyline.length - 1; pointIndex++) {
            const thisPoint = polyline[pointIndex];
            const nextPoint = polyline[pointIndex + 1];
            const segmentLength = Math.sqrt(
                Math.pow(nextPoint[0] - thisPoint[0], 2) + Math.pow(nextPoint[1] - thisPoint[1], 2)
            );
            const segmentCount = Math.ceil(segmentLength / maxSegmentLength);
            for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
                const segmentRatio = segmentIndex / segmentCount;
                const segmentPoint: Point = [
                    thisPoint[0] + (nextPoint[0] - thisPoint[0]) * segmentRatio,
                    thisPoint[1] + (nextPoint[1] - thisPoint[1]) * segmentRatio,
                ];
                subdividedPolyline.push(segmentPoint);
            }
        }
        subdividedPolyline.push(polyline[polyline.length - 1]);
        return subdividedPolyline;
    }

    // Apply a mask function to a polyline, returning a set of polylines that
    // pass through the space where the mask function returns true.
    public static maskPolyline(polyline: Polyline, maskFn: MaskFunction): Polyline[] {
        // Start a new set of polylines (multiple iff the original is broken up by the mask)
        const maskedPolylines: Polyline[] = [[]];
        let previousPoint = polyline[0];
        let previousInMask = maskFn(previousPoint);
        if (previousInMask) {
            maskedPolylines[0].push(previousPoint);
        }

        // Iterate through points in the polyline, constructing the masked polyline(s)
        for (let pointIndex = 1; pointIndex < polyline.length; pointIndex++) {
            const currentPoint = polyline[pointIndex];
            const currentInMask = maskFn(currentPoint);

            // Determine polyline updates depending on the previous and current points
            if (previousInMask && currentInMask) {
                // Add the current point to the current output polyline
                maskedPolylines[maskedPolylines.length - 1].push(currentPoint);
            } else if (!previousInMask && currentInMask) {
                // Start a new output polyline from the intersection point
                const intersectionPoint = PolylineUtil.findMaskEdgeBetween(
                    previousPoint,
                    currentPoint,
                    maskFn
                );
                maskedPolylines.push([intersectionPoint, currentPoint]);
            } else if (previousInMask && !currentInMask) {
                // Draw to the intersection point
                const intersectionPoint = PolylineUtil.findMaskEdgeBetween(
                    previousPoint,
                    currentPoint,
                    maskFn
                );
                maskedPolylines[maskedPolylines.length - 1].push(intersectionPoint);
            }

            // If neither are in the mask, simply continue to the next point
            previousInMask = currentInMask;
            previousPoint = currentPoint;
        }

        // Merge last & first for closed paths (when applicable)
        if (maskedPolylines.length > 1) {
            const firstPolyline = maskedPolylines[0];
            const lastPolyline = maskedPolylines[maskedPolylines.length - 1];
            if (firstPolyline[0] === lastPolyline[lastPolyline.length - 1]) {
                lastPolyline.pop();
                maskedPolylines[0] = [...lastPolyline, ...firstPolyline];
                maskedPolylines.pop();
            }
        }

        return maskedPolylines;
    }

    // Binary search for the intersection point between the line segment and the mask edge.
    // This will find the intersection with an error of d/2^n, where n is the number of iterations,
    // and d is the distance between the start and end points.
    private static findMaskEdgeBetween(
        startPoint: Point,
        endPoint: Point,
        maskFn: MaskFunction,
        iterations = 10
    ): Point {
        let valueA = maskFn(startPoint);
        let valueB = maskFn(endPoint);
        let pointA = startPoint;
        let pointB = endPoint;
        let iteration = 0;

        while (valueA != valueB && iteration < iterations) {
            const midPoint: Point = [(pointA[0] + pointB[0]) / 2, (pointA[1] + pointB[1]) / 2];
            const midValue = maskFn(midPoint);
            if (midValue === valueA) {
                pointA = midPoint;
                valueA = midValue;
            } else {
                pointB = midPoint;
                valueB = midValue;
            }
            iteration += 1;
        }
        return pointA;
    }

    // Average out points along the line which are closer than the given distance.
    public static combineNearbyPoints(polyline: Polyline, minDistance: number): Polyline {
        // todo: doesn't work well for closed polylines
        const processedPoints: Polyline = [];
        let numRecentPointsToCombine = 1; // running; 1 is status quo (no combination)

        for (const point of polyline) {
            const lastPoint: Point | undefined = processedPoints[processedPoints.length - 1];
            if (lastPoint) {
                const distance = Math.sqrt(
                    (point[0] - lastPoint[0]) ** 2 + (point[1] - lastPoint[1]) ** 2
                );
                if (distance > minDistance) {
                    if (numRecentPointsToCombine > 1) {
                        // combine the last few points
                        const pointsToCombine = processedPoints.slice(
                            processedPoints.length - numRecentPointsToCombine
                        );
                        const average = PolylineUtil.averagePosition(pointsToCombine);
                        processedPoints.splice(
                            processedPoints.length - numRecentPointsToCombine,
                            numRecentPointsToCombine,
                            average
                        );
                        numRecentPointsToCombine = 1;
                    }
                } else {
                    numRecentPointsToCombine += 1;
                }
            }

            // Add the point to the processed array
            processedPoints.push(point);
        }
        return processedPoints;
    }

    // Create a new polyline following the input polyline, but with the points evenly spaced
    // Here "evenness" is defined as the linear distance along the original polyline; returned points
    // will not necessarily be evenly spaced in terms of x/y distance on the resulting polyline.
    public static evenlySpacePoints(
        polyline: Polyline,
        numPointsToReturn = polyline.length
    ): Polyline {
        // Input checks
        if (polyline.length < 2 || numPointsToReturn < 2) {
            throw 'Cannot create a polyline with fewer than 2 points';
        }

        // Get full distances of each segment
        const distanceToNextOriginalPoint: number[] = [];
        let totalPolylineDistance = 0;
        for (let i = 0; i < polyline.length - 1; i++) {
            const distance = Math.sqrt(
                (polyline[i + 1][0] - polyline[i][0]) ** 2 +
                    (polyline[i + 1][1] - polyline[i][1]) ** 2
            );
            distanceToNextOriginalPoint.push(distance);
            totalPolylineDistance += distance;
        }

        // Initial state before polyline walk
        const stepDistance = totalPolylineDistance / (numPointsToReturn - 1);
        const evenlySpacedPoints: Polyline = [polyline[0]];
        let distanceTraveled = 0;
        let lastOriginalPointIndex = 0;
        let distanceFromLastOriginalPoint = 0;

        // Walk along the polyline, adding evenly spaced points
        for (let evenPointIndex = 1; evenPointIndex < numPointsToReturn - 1; evenPointIndex++) {
            const targetDistance = evenPointIndex * stepDistance;
            let stepDistanceRemaining = stepDistance;

            // Proceed through however many original points are in range of this target distance
            while (
                distanceTraveled +
                    (distanceToNextOriginalPoint[lastOriginalPointIndex] -
                        distanceFromLastOriginalPoint) <
                targetDistance
            ) {
                const distanceIncrement =
                    distanceToNextOriginalPoint[lastOriginalPointIndex] -
                    distanceFromLastOriginalPoint;
                distanceTraveled += distanceIncrement;
                stepDistanceRemaining -= distanceIncrement;
                lastOriginalPointIndex += 1;
                distanceFromLastOriginalPoint = 0;
            }

            // Calculate progress values relative to original points
            const targetDistanceBetweenOriginalPoints =
                distanceFromLastOriginalPoint + stepDistanceRemaining;
            const progressBetweenOriginalPoints =
                targetDistanceBetweenOriginalPoints /
                distanceToNextOriginalPoint[lastOriginalPointIndex];

            // Find next even point position and add it to the array
            const lastOriginalPoint = polyline[lastOriginalPointIndex];
            const nextOriginalPoint = polyline[lastOriginalPointIndex + 1];
            const x =
                lastOriginalPoint[0] +
                (nextOriginalPoint[0] - lastOriginalPoint[0]) * progressBetweenOriginalPoints;
            const y =
                lastOriginalPoint[1] +
                (nextOriginalPoint[1] - lastOriginalPoint[1]) * progressBetweenOriginalPoints;
            const newPoint: Point = [x, y];
            evenlySpacedPoints.push(newPoint);

            // Update distance & progress
            distanceTraveled += stepDistanceRemaining;
            distanceFromLastOriginalPoint = targetDistanceBetweenOriginalPoints;
        }

        // Add the last point and return
        evenlySpacedPoints.push(polyline[polyline.length - 1]);
        return evenlySpacedPoints;
    }

    // Average out the position of a set of points into one
    private static averagePosition(points: Polyline): Point {
        const average = points.reduce(
            (sum, point) => [sum[0] + point[0], sum[1] + point[1]],
            [0, 0]
        );
        return [average[0] / points.length, average[1] / points.length];
    }
}
