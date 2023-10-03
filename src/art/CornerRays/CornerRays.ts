import CanvasSketchProject, {
    type CanvasSketchProps,
    type CanvasSketchRender
} from '../util/CanvasSketchProject';

import Generator from './CornerRaysGen';
import { renderPaths } from 'canvas-sketch-util/penplot';

export default class CornerRays extends CanvasSketchProject {
    nodeCount = 10;
    topLeft = true;
    topRight = false;
    bottomRight = true;
    bottomLeft = false;
    inset = 0.1;
    lineWidth = 1;

    sketch(): CanvasSketchRender {
        const generator = new Generator();
        return (props: CanvasSketchProps) => {
            const scaledNibSize = this.lineWidth * 0.0393701; // mm to inches
            const minDimension = Math.min(props.width, props.height);
            const inset = this.inset * minDimension;
            const paths = generator.generate(
                [inset, inset],
                [props.width - inset * 2, props.height - inset * 2],
                this.nodeCount,
                [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
            );

            return renderPaths(paths, {
                lineWidth: scaledNibSize,
                strokeStyle: 'black',
                lineCap: 'round',
                inkscape: true,
                ...props
            });
        };
    }
}
