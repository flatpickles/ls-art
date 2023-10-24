import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import SolarGenerator from './SolarGen';
import { renderPaths } from 'canvas-sketch-util/penplot';

export default class SolarPraxis extends CanvasSketchProject {
    divisionCount = 4; // "Division Count", 2 to 10, step 1
    taperRatio = 0.7; // "Taper Ratio", 0.5 to 1
    taperCount = 20; // "Taper Count", 0 to 20, step 1
    expandedForm = false; // "Expanded Form"
    innerCircleCount = 2; // "Inner Circles", 0 to 30, step 1
    linearInner = false; // "Linear Inner"
    rotation = 0; // "Rotation"
    inset = 0.1; // "Added Inset", 0.01 to 0.25
    innerLineWidth = 0.4; // "Inner Nib (mm)", 0.01 to 2
    outerLineWidth = 1; // "Outer Nib (mm)", 0.01 to 2

    sketch() {
        const generator = new SolarGenerator();

        return (props: CanvasSketchProps) => {
            const scaledInnerNibSize = this.innerLineWidth * 0.0393701; // mm to inches
            const scaledOuterNibSize = this.outerLineWidth * 0.0393701; // mm to inches
            const minDimension = Math.min(props.width, props.height);
            const inset = this.inset * minDimension;
            const paths = generator.generate(
                [inset, inset],
                [props.width - inset, props.height - inset],
                this.taperRatio,
                this.taperCount,
                this.expandedForm,
                (this.rotation * Math.PI * 2) / this.divisionCount,
                this.divisionCount,
                this.innerCircleCount,
                this.linearInner
            );

            return renderPaths(paths, {
                lineWidth: [scaledInnerNibSize, scaledOuterNibSize],
                strokeStyle: 'black',
                lineCap: 'round',
                inkscape: true,
                ...props
            });
        };
    }
}
