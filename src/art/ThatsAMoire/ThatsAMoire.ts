import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import { renderPaths } from 'canvas-sketch-util/penplot';
import MoireGenerator from './MoireGen';

export default class ThatsAMoire extends CanvasSketchProject {
    rayCount = 150; // "Ray Count", 10 to 200, step 1
    outerRadius = 1; // "Outer Radius"
    innerRadius = 0.33; // "Inner Radius"
    centerOffset = 0.01; // "Center Offset", 0 to 0.05, step 0.001
    rotationOffset = 0.0; // "Rotation Offset", 0 to 0.1
    noiseIntensity = 0.5; // "Noise Intensity"
    noiseDensity = 0.4; // "Noise Density"
    noiseVariant = 0.5; // "Noise Variant"
    asymmetry = 0.1; // "Asymmetry", 0 to 0.25
    lineResolution = 50; // "Line Resolution", 2 to 100, step 1
    lineWidth = 0.5; // "Line Width", 0.1 to 2

    sketch() {
        const generator = new MoireGenerator();

        return (props: CanvasSketchProps) => {
            const scaledNibSize = this.lineWidth * 0.0393701; // mm to inches
            const centerOffset = props.height * this.centerOffset;
            const outerRadius =
                (Math.min(props.width, props.height) / 2 - centerOffset / 2) * this.outerRadius;
            const innerRadius =
                (Math.min(props.width, props.height) / 2 - centerOffset / 2) * this.innerRadius;
            const topPaths = generator.generateRays(
                [props.width / 2, props.height / 2 - centerOffset / 2],
                outerRadius,
                innerRadius,
                this.rayCount,
                -this.rotationOffset / 2,
                this.noiseIntensity,
                this.noiseDensity,
                this.noiseVariant,
                this.asymmetry,
                this.lineResolution
            );
            const bottomPaths = generator.generateRays(
                [props.width / 2, props.height / 2 + centerOffset / 2],
                outerRadius,
                innerRadius,
                this.rayCount,
                this.rotationOffset / 2,
                this.noiseIntensity,
                this.noiseDensity,
                this.noiseVariant,
                this.asymmetry,
                this.lineResolution
            );

            return renderPaths([topPaths, bottomPaths], {
                lineWidth: scaledNibSize,
                strokeStyle: 'black',
                lineCap: 'round',
                inkscape: true,
                ...props
            });
        };
    }
}
