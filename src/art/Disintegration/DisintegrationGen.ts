import alea from 'alea';
import { createNoise3D, type NoiseFunction3D } from 'simplex-noise';

type Point = [number, number];
type Line = [Point, Point];

import PathUtil from '../util/Legacy/PathUtil';
import type { Path } from 'd3-path';

const sigmoidEasing = (t: number, k: number) => {
    const sigmoidBase = (t: number, k: number) => {
        return 1.0 / (1.0 + Math.exp(-k * t)) - 0.5;
    };
    const correction = 0.5 / sigmoidBase(1.0, k);
    return correction * sigmoidBase(2.0 * t - 1.0, k) + 0.5;
};

export default class DisintegrationGen {
    private noise: NoiseFunction3D;

    constructor() {
        const prng = alea(0);
        this.noise = createNoise3D(prng);
    }

    // todo: maybe reintegrate this as a parameter option
    public generateFlippy(width: number): Line[] {
        const columns = 10;
        const rows = 10;
        const columnSize = width / (columns + 1.5);
        const rowSize = width / (rows + 1.5);
        const paths: Line[] = [];

        for (let col = 0; col <= columns; col++) {
            for (let row = 0; row <= rows; row++) {
                const x = (col + 0.5) * columnSize;
                const y = (row + 0.5) * rowSize;

                // Horizontal lines
                const hAngle = ((col / columns) * Math.PI) / 2;
                const hCenter = [x + columnSize / 2, y];
                const hPoint1: Point = [
                    hCenter[0] + (Math.cos(hAngle) * columnSize) / 2,
                    hCenter[1] + (Math.sin(hAngle) * columnSize) / 2
                ];
                const hPoint2: Point = [
                    hCenter[0] - (Math.cos(hAngle) * columnSize) / 2,
                    hCenter[1] - (Math.sin(hAngle) * columnSize) / 2
                ];
                paths.push([hPoint1, hPoint2]);

                // Vertical lines
                const vAngle = Math.PI / 2 + ((col / columns) * Math.PI) / 2;
                const vCenter = [x, y + rowSize / 2];
                const vPoint1: Point = [
                    vCenter[0] + (Math.cos(vAngle) * rowSize) / 2,
                    vCenter[1] + (Math.sin(vAngle) * rowSize) / 2
                ];
                const vPoint2: Point = [
                    vCenter[0] - (Math.cos(vAngle) * rowSize) / 2,
                    vCenter[1] - (Math.sin(vAngle) * rowSize) / 2
                ];
                paths.push([vPoint1, vPoint2]);
            }
        }

        return paths;
    }

    public generate(
        size: Point,
        divisions = 30,
        square = true,
        inset = 1,
        rotationMin = 0,
        rotationMax = Math.PI / 2,
        rotationEasing = 0.01,
        xOnset = false,
        yOnset = true,
        thereAndBack = false,
        noiseScaleX = 0.2,
        noiseScaleY = 0.2,
        noiseVariant = 0,
        noiseXYOffset = 0,
        circleMode = false
    ): Path[] {
        const paths: Path[] = [];

        // When false, squares are ACTUALLY square; when true, top/bottom inset are equal
        const equalizeSquareInset = false;

        // Funky math for inset and division sizing
        const colTotal = divisions + inset * 2;
        let rowTotal = colTotal * (square ? size[1] / size[0] : 1);
        if (equalizeSquareInset) rowTotal = Math.floor(rowTotal);
        const columnSize = size[0] / colTotal;
        const rowSize = size[1] / rowTotal;
        const cols = Math.floor(colTotal - inset * 2);
        const rows = Math.floor(rowTotal - inset * 2 + (circleMode ? 1 : 0));

        for (let row = 0; row <= rows; row++) {
            for (let col = 0; col <= cols; col++) {
                const x = (inset + col) * columnSize;
                const y = (inset + row - (circleMode ? 0.5 : 0)) * rowSize;
                let xProgress = col / cols;
                let yProgress = row / rows;
                if (thereAndBack) {
                    yProgress = Math.min(row / (rows - 1), 1); // last vertical lines should be at progress 1 for there & back
                    xProgress = xProgress < 0.5 ? xProgress * 2 : (1 - xProgress) * 2;
                    yProgress = yProgress < 0.5 ? yProgress * 2 : (1 - yProgress) * 2;
                }
                const combinedProgress = xOnset
                    ? yOnset
                        ? rotationMax > rotationMin
                            ? Math.min(xProgress, yProgress)
                            : Math.max(xProgress, yProgress)
                        : xProgress
                    : yOnset
                    ? yProgress
                    : 1;
                const onset = sigmoidEasing(combinedProgress, rotationEasing);
                const angleOnset = rotationMin + onset * (rotationMax - rotationMin);

                // Vertical lines
                const vNoise = this.noise(
                    (row * noiseScaleY) / rows,
                    (col * noiseScaleX) / cols,
                    noiseVariant + noiseXYOffset
                );
                if (row < rows) {
                    const vAngle = Math.PI / 2 - angleOnset * vNoise;
                    const vCenter: [number, number] = [x, y + rowSize / 2];
                    if (circleMode) {
                        const maxRadius = Math.min(columnSize, rowSize) / 2 - 0.005;
                        const scaledNoise = (vNoise + 1) / 2;
                        const radius = onset * maxRadius * scaledNoise;
                        if (radius > maxRadius) {
                            throw new Error('Radius is too large');
                        }
                        paths.push(PathUtil.approximateCircle(vCenter, radius));
                    } else {
                        const vPoint1: Point = [
                            vCenter[0] + (Math.cos(vAngle) * rowSize) / 2,
                            vCenter[1] + (Math.sin(vAngle) * rowSize) / 2
                        ];
                        const vPoint2: Point = [
                            vCenter[0] - (Math.cos(vAngle) * rowSize) / 2,
                            vCenter[1] - (Math.sin(vAngle) * rowSize) / 2
                        ];
                        paths.push(PathUtil.pathFromPolyline([vPoint1, vPoint2]));
                    }
                }

                // Horizontal lines
                if (col < cols && !circleMode) {
                    const hAngle =
                        0 +
                        angleOnset *
                            this.noise(
                                (row * noiseScaleY) / rows,
                                (col * noiseScaleX) / cols,
                                noiseVariant
                            );
                    const hCenter = [x + columnSize / 2, y];
                    const hPoint1: Point = [
                        hCenter[0] + (Math.cos(hAngle) * columnSize) / 2,
                        hCenter[1] + (Math.sin(hAngle) * columnSize) / 2
                    ];
                    const hPoint2: Point = [
                        hCenter[0] - (Math.cos(hAngle) * columnSize) / 2,
                        hCenter[1] - (Math.sin(hAngle) * columnSize) / 2
                    ];
                    paths.push(PathUtil.pathFromPolyline([hPoint1, hPoint2]));
                }
            }
        }

        console.log(paths.length);
        return paths;
    }
}
