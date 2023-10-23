import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import { renderPaths } from 'canvas-sketch-util/penplot';

import RelaxGenerator from './RelaxGen';

export default class Relax extends CanvasSketchProject {
    pathCount = 100; // "Path Count", 2 to 200, step 1
    polygonSides = 4; // "Shape Sides", 3 to 10, step 1
    twoTone = false; // "Two Tone"
    topSize = 0.66; // "Top Size"
    bottomSize = 0.33; // "Bottom Size"
    topCircle = true; // "Top Circle"
    bottomCircle = false; // "Bottom Circle"
    topRotation = 0.75; // "Top Rotation"
    bottomRotation = 0.25; // "Bottom Rotation"
    inset = 0.1; // "Inset", 0 to 0.25
    normalizeInset = true; // "Normalize Inset"
    resolution = 1; // "Path Detail", 0.1 to 1, step 0.1
    lineWidth = 0.7; // "Nib Size (mm)", 0.01 to 1, step 0.01

    sketch() {
        const generator = new RelaxGenerator();

        return (props: CanvasSketchProps) => {
            const scaledNibSize = this.lineWidth * 0.0393701; // mm to inches
            const paths = generator.generate(
                [props.width, props.height],
                this.pathCount,
                this.twoTone,
                this.resolution,
                this.inset,
                this.normalizeInset,
                this.polygonSides,
                this.bottomSize,
                this.topSize,
                this.bottomCircle ? null : this.bottomRotation,
                this.topCircle ? null : this.topRotation
            );

            return renderPaths(paths, {
                lineWidth: scaledNibSize,
                strokeStyle: this.twoTone ? ['#1C8F96', '#1A135A'] : 'black',
                inkscape: true,
                ...props
            });
        };
    }
}
