import CanvasSketchProject, {
    type CanvasSketchProps,
    type CanvasSketchRender
} from '../util/CanvasSketchProject';
import FlowGenerator from './FlowGenerator';
import { renderPaths } from 'canvas-sketch-util/penplot';

export default class FlowField extends CanvasSketchProject {
    lineWidth = 1; // "Nib Size (mm)", 0.1 to 2

    sketch(): CanvasSketchRender {
        const generator = new FlowGenerator();

        return (props: CanvasSketchProps) => {
            const scaledNibSize = this.lineWidth * 0.0393701; // mm to inches
            const paths = generator.generate({
                dimensions: [props.width, props.height],
                noiseVariant: 1
            });

            return renderPaths(paths, {
                lineWidth: scaledNibSize,
                strokeStyle: 'black',
                inkscape: true,
                ...props
            });
        };
    }
}
