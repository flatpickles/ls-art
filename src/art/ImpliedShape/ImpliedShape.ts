import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';

import { renderPaths } from 'canvas-sketch-util/penplot';
import GroundGenerator from './GroundGenerator';
import PolylineUtil from '../util/Legacy/PolylineUtil';

export default class ImpliedShape extends CanvasSketchProject {
    rectCount = 6; // "Rect Count", 1 to 20, step 1
    innerMask = true; // "Inner Mask"
    outerMask = false; // "Outer Mask"
    innerSize = 0.35; // "Inner Size", 0.1 to 0.5
    outerSize = 0.45; // "Outer Size", 0.1 to 0.5
    gapSize = 0.01; // "Gap Size", 0.01 to 0.1
    lineWidth = 1; // "Nib Size (mm)", 0.1 to 2

    sketch() {
        const groundGenerator = new GroundGenerator();

        return (props: CanvasSketchProps) => {
            const minDimension = Math.min(props.width, props.height);
            const scaledNibSize = this.lineWidth * 0.0393701; // mm to inches
            const scaledGapSize = this.gapSize * minDimension;

            // Generate the background
            let paths = groundGenerator.generate(
                this.rectCount,
                [scaledGapSize, scaledGapSize],
                [props.width - scaledGapSize, props.height - scaledGapSize],
                scaledGapSize
            );

            // Subdivide the background paths for more accurate intersection detection
            paths = paths.map((path) => PolylineUtil.subdividePolyline(path, minDimension / 100));

            // Mask out a circle in the center
            const center = [props.width / 2, props.height / 2];
            const maskedPaths = paths.flatMap((path) =>
                PolylineUtil.maskPolyline(path, (point) => {
                    const innerCircle =
                        Math.sqrt(
                            Math.pow(point[0] - center[0], 2) + Math.pow(point[1] - center[1], 2)
                        ) >
                        this.innerSize * Math.min(props.width, props.height);
                    const outerCircle =
                        Math.sqrt(
                            Math.pow(point[0] - center[0], 2) + Math.pow(point[1] - center[1], 2)
                        ) <
                        this.outerSize * Math.min(props.width, props.height);
                    return (innerCircle || !this.innerMask) && (outerCircle || !this.outerMask);
                })
            );

            // Render the paths
            return renderPaths(maskedPaths, {
                lineWidth: scaledNibSize,
                strokeStyle: 'black',
                lineCap: 'square',
                inkscape: true,
                ...props
            });
        };
    }
}
