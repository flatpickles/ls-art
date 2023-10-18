import { renderPaths } from 'canvas-sketch-util/penplot';
import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import DisintegrationGen from './DisintegrationGen';

export default class Disintegration extends CanvasSketchProject {
    divisions = 20; // "Divisions", 2 to 100, step 1
    inset = 0; // "Inset", 0 to 3, step 0.5
    square = true; // "Square-ish"
    rotationMin = 0; // "Rotation Min", 0 to 1
    rotationMax = 0.25; // "Rotation Max", 0 to 1
    rotationEasing = 0.01; // "Rotation Easing", 0.01 to 1
    xOnset = false; // "X Onset"
    yOnset = true; // "Y Onset"
    thereAndBack = false; // "There and Back"
    noiseScale = 0.2; // "Noise Scale", 0 to 1
    noiseVariant = 0.5; // "Noise Variant", 0 to 1
    noiseOffset = 0; // "Noise Offset", 0 to 1
    lineWidth = 1; // "Nib Size (mm)", 0.1 to 2
    circleMode = false; // "Circle Mode"

    sketch() {
        const generator = new DisintegrationGen();

        return (props: CanvasSketchProps) => {
            // Generate paths
            const scaledNibSize = this.lineWidth * 0.0393701; // mm to inches
            const paths = generator.generate(
                [props.width, props.height],
                this.divisions,
                this.square,
                this.inset,
                this.rotationMin * Math.PI * 2,
                this.rotationMax * Math.PI * 2,
                this.rotationEasing * 10,
                this.xOnset,
                this.yOnset,
                this.thereAndBack,
                this.noiseScale * 10,
                this.noiseScale * 10,
                this.noiseVariant * 10,
                this.noiseOffset * 10,
                this.circleMode
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
