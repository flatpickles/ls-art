import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import GlobeGenerator from './GlobeGen';
import { renderPaths } from 'canvas-sketch-util/penplot';

export default class Globe extends CanvasSketchProject {
    radius = 0.5; // "Radius", 0.1 to 1
    latCount = 15; // "Lat. Lines", 1 to 30, step 1
    longCount = 15; // "Long. Lines", 1 to 30, step 1
    lineWidth = 1; // "Nib Size (mm)", 0.1 to 2

    sketch() {
        const generator = new GlobeGenerator();
        return (props: CanvasSketchProps) => {
            const scaledNibSize = this.lineWidth * 0.0393701; // mm to inches
            const paths = generator.generate(
                this.latCount,
                this.longCount,
                20,
                (this.radius * Math.min(props.width, props.height)) / 2 - scaledNibSize / 2,
                [props.width / 2, props.height / 2]
            );

            return renderPaths(paths, {
                lineWidth: scaledNibSize,
                strokeStyle: 'black',
                inkscape: true,
                ...props
            });
        };
    }
}
