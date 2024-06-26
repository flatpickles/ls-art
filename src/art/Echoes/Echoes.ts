import { renderPaths } from 'canvas-sketch-util/penplot';
import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';

import type { Path } from 'd3-path';
import PathUtil from '../util/Legacy/PathUtil';

export default class Echoes extends CanvasSketchProject {
    dRadius = 0.2; // "Radius Step", 0.05 to 1
    dTheta = Math.PI / 10; // "Angle Step", 0 to 3.14159, step 0.001
    alignment = 0; // "Alignment", -1 to 1, step 0.01
    scale = 1; // "Full Scale", 0.1 to 1, step 0.01

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
                center[0] = center[0] + Math.cos(theta) * (dRadius * this.alignment);
                center[1] = center[1] + Math.sin(theta) * (dRadius * this.alignment);
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
