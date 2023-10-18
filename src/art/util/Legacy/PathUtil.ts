import BezierSpline from 'bezier-spline';
import type { Path } from 'd3-path';
import { createPath } from 'canvas-sketch-util/penplot';

import type { Polyline } from './PolylineUtil';

// Float comparison tolerance
const floatTolerance = 0.0001;

export default class PathUtil {
    static pathFromPolyline(polyline: Polyline): Path {
        const path = createPath();
        path.moveTo(polyline[0][0], polyline[0][1]);
        for (let i = 1; i < polyline.length; i++) {
            path.lineTo(polyline[i][0], polyline[i][1]);
        }
        return path;
    }

    static approximateCircle(center: [number, number], radius: number): Path {
        // todo: generalize with >4 points, as in this approach:
        // https://stackoverflow.com/a/27863181/280404

        // Implementation as described: https://stackoverflow.com/a/13338311/280404
        const controlDistance = (radius * 4 * (Math.sqrt(2) - 1)) / 3;

        const circlePoints = [
            [center[0] + radius, center[1]], // right
            [center[0], center[1] + radius], // bottom
            [center[0] - radius, center[1]], // left
            [center[0], center[1] - radius] // top
        ];
        const controlPoints = [
            [
                [center[0] + radius, center[1] - controlDistance], // right incoming
                [center[0] + radius, center[1] + controlDistance] // right outgoing
            ],
            [
                [center[0] + controlDistance, center[1] + radius], // bottom incoming
                [center[0] - controlDistance, center[1] + radius] // bottom outgoing
            ],
            [
                [center[0] - radius, center[1] + controlDistance], // left incoming
                [center[0] - radius, center[1] - controlDistance] // left outgoing
            ],
            [
                [center[0] - controlDistance, center[1] - radius], // top incoming
                [center[0] + controlDistance, center[1] - radius] // top outgoing
            ]
        ];

        const circlePath = createPath();
        circlePath.moveTo(circlePoints[0][0], circlePoints[0][1]);
        for (let i = 0; i < circlePoints.length; i++) {
            const thisIndex = i;
            const nextIndex = (i + 1) % circlePoints.length;
            circlePath.bezierCurveTo(
                controlPoints[thisIndex][1][0], // outgoing x
                controlPoints[thisIndex][1][1], // outgoing y
                controlPoints[nextIndex][0][0], // incoming x
                controlPoints[nextIndex][0][1], // incoming y
                circlePoints[nextIndex][0], // next x
                circlePoints[nextIndex][1] // next y
            );
        }
        circlePath.closePath();
        return circlePath;
    }

    static createCardinalSpline(points: [number, number][], tension = 0.5): Path {
        if (points.length < 2) {
            throw 'Spline can only be drawn with two or more points.';
        }

        const closed =
            Math.abs(points[0][0] - points[points.length - 1][0]) < floatTolerance &&
            Math.abs(points[0][1] - points[points.length - 1][1]) < floatTolerance;

        // Add first and last points to the spline
        if (closed) {
            // Use second and second-to-last points as terminal control points on opposite side
            const secondPoint = points[1];
            points.unshift(points[points.length - 2]);
            points.push(secondPoint);
        } else {
            // Reflect second and second-to-last points across first and last points
            const reflect = (p1: [number, number], p2: [number, number]): [number, number] => {
                return [p1[0] - (p2[0] - p1[0]), p1[1] - (p2[1] - p1[1])];
            };
            points.unshift(reflect(points[0], points[1]));
            points.push(reflect(points[points.length - 1], points[points.length - 2]));
        }

        // Calculate spline points
        const splinePath = createPath();
        splinePath.moveTo(points[1][0], points[1][1]);
        for (let ptIdx = 1; ptIdx < points.length - 2; ptIdx++) {
            const p0 = points[ptIdx - 1];
            const p1 = points[ptIdx];
            const p2 = points[ptIdx + 1];
            const p3 = points[ptIdx + 2];

            const x1 = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
            const y1 = p1[1] + ((p2[1] - p0[1]) / 6) * tension;

            const x2 = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
            const y2 = p2[1] - ((p3[1] - p1[1]) / 6) * tension;

            splinePath.bezierCurveTo(x1, y1, x2, y2, p2[0], p2[1]);
        }

        if (closed) splinePath.closePath();
        return splinePath;
    }

    static createBezierSpline(points: [number, number][]): Path {
        if (points.length < 3) {
            throw 'Spline can only be drawn with three or more points.';
        }

        // If the spline is closed, expand with points from the opposite end
        const leadingSize = 3; // number of adjacent points for path close smoothing
        const closed =
            leadingSize > 0 &&
            Math.abs(points[0][0] - points[points.length - 1][0]) < floatTolerance &&
            Math.abs(points[0][1] - points[points.length - 1][1]) < floatTolerance;
        if (closed && points.length <= 3) {
            throw 'Spline can only be closed with four or more points (including duplicated endpoints).';
        }
        if (closed) {
            // Collect leading and trailing knots, accommodating wrap-around for small paths
            let trailingIndex = 1;
            let leadingIndex = points.length - 2;
            const leadingKnots: [number, number][] = [];
            const trailingKnots: [number, number][] = [];
            for (let lead = 0; lead < leadingSize; lead++) {
                trailingKnots.push(points[trailingIndex]);
                leadingKnots.unshift(points[leadingIndex]);
                trailingIndex = (trailingIndex + 1) % points.length;
                leadingIndex = leadingIndex > 0 ? leadingIndex - 1 : points.length - 1;
            }
            points = [...leadingKnots, ...points, ...trailingKnots];
        }

        // Create the spline, remove first and last curves if closed
        const spline = new BezierSpline(points);
        if (closed) {
            spline.knots = spline.knots.slice(leadingSize, -leadingSize);
            spline.curves = spline.curves.slice(leadingSize, -leadingSize);
        }

        // Create path with canvas-sketch-util
        const splinePath = createPath();
        splinePath.moveTo(spline.knots[0][0], spline.knots[0][1]);
        for (let curveIdx = 0; curveIdx < spline.curves.length; curveIdx++) {
            const curve = spline.curves[curveIdx];
            splinePath.bezierCurveTo(
                curve[1][0],
                curve[1][1],
                curve[2][0],
                curve[2][1],
                curve[3][0],
                curve[3][1]
            );
        }

        // Close it if need be, and return
        if (closed) splinePath.closePath();
        return splinePath;
    }
}
