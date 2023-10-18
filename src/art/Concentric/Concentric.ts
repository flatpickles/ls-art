import { renderPaths } from 'canvas-sketch-util/penplot';
import CanvasSketchProject, {
    type CanvasSketchProps,
    type CanvasSketchRender
} from '../util/CanvasSketchProject';
import Generator from './ConcentricGen';

export default class CornerRays extends CanvasSketchProject {
    size1 = 0.25; // "Size 1", 0.01 to 1
    size2 = 1.0; // "Size 2", 0.01 to 1
    thereAndBack = false; // "There and Back"
    noiseVariant = 0.5; // "Noise Variant", 0 to 1
    noiseDepth = 0.6; // "Noise Depth", 0 to 1
    noiseDensity = 0.5; // "Noise Density", 0 to 1
    pathCount = 14; // "Path Count", 2 to 50, step 1
    pathResolution = 50; // "Path Resolution", 3 to 300, step 1
    lineWidth = 1; // "Nib Size (mm)", 0.01 to 2
    xIterations = 1; // "X Iterations", 1 to 4, step 1
    yIterations = 1; // "Y Iterations", 1 to 6, step 1
    iterationGap = 0; // "Iter. Gap %", 0 to 10, step 0.5
    hInset = 0; // "H Inset %", 0 to 10, step 0.5
    vInset = 0; // "V Inset %", 0 to 10, step 0.5

    sketch(): CanvasSketchRender {
        const generator = new Generator();
        return (props: CanvasSketchProps) => {
            const scaledNibSize = this.lineWidth * 0.0393701; // mm to inches
            const scaledSize: [number, number] = [
                ((100 - this.hInset * 2) * props.width) / 100,
                ((100 - this.vInset * 2) * props.height) / 100
            ];
            const scaledGap: [number, number] = [
                (props.width * this.iterationGap) / 100,
                (props.height * this.iterationGap) / 100
            ];

            const iterations = generator.generateIterations(
                [this.xIterations, this.yIterations],
                [(props.width - scaledSize[0]) / 2, (props.height - scaledSize[1]) / 2],
                scaledSize,
                scaledGap,
                this.size1,
                this.size2,
                this.thereAndBack,
                this.pathCount,
                this.noiseDensity * 3,
                this.noiseVariant * 100,
                this.noiseDepth,
                this.pathResolution,
                scaledNibSize
            );

            return renderPaths(iterations, {
                lineWidth: scaledNibSize,
                strokeStyle: 'black',
                inkscape: true,
                ...props
            });
        };
    }
}
