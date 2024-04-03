// todo: re-enable typescript in this file
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import { renderPaths } from 'canvas-sketch-util/penplot';

import PathUtil from '../util/Legacy/PathUtil';
import type { Path } from 'd3-path';

export default class Echoes extends CanvasSketchProject {
    dRadius = 0.2; // "Radius Incr.", 0.05 to 1
    dTheta = Math.PI / 10; // "Angle Incr.", 0 to 3.14159, step 0.001
    gap = 0; // "Gap", 0 to 0.1, step 0.01
    scale = 1; // "Scale", 0.1 to 1, step 0.01

    sketch() {
        return (props: CanvasSketchProps) => {
            const { width, height } = props;
            const paths: Path[] = [];
            const center: [number, number] = [width / 2, height / 2];
            const dRadius = this.dRadius * this.scale;
            let theta = 0;
            let radius = (width / 2) * this.scale;

            while (radius > this.dRadius) {
                const path = PathUtil.approximateCircle(center, radius);
                center[0] = center[0] + Math.cos(theta) * (dRadius - this.gap);
                center[1] = center[1] + Math.sin(theta) * (dRadius - this.gap);
                paths.push(path);
                theta = theta + this.dTheta;
                radius -= dRadius;
            }

            return renderPaths(paths, {
                lineWidth: [0.05, 0.05],
                lineJoin: 'round',
                lineCap: 'round',
                strokeStyle: ['black', 'black'],
                inkscape: true,
                ...props
            });
        };
    }
}
