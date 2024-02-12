import { renderPaths } from 'canvas-sketch-util/penplot';
import alea from 'alea';
import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import { createNoise3D } from 'simplex-noise';
import IsolineGrid from './IsolineGrid';

export default class Contours extends CanvasSketchProject {
    layerCount = 4; // "Layer Count", 1 to 10, step 1
    edgeLow = 0.25; // "Lower Bound", 0.05 to 1
    edgeHigh = 0.85; // "Upper Bound", 0.05 to 1
    inset = 0.01; // "Inset", 0.01 to 0.25
    fixedAspect = false; // "Fixed Aspect"
    rounding = 0.32; // "Rounding", 0 to 1
    easing = 10; // "Edge Weight", 1 to 15
    noiseScaleX = 0.19; // "Noise Scale X", 0.1 to 1
    noiseScaleY = 0.81; // "Noise Scale Y", 0.1 to 1
    noiseVariant = 0.21; // "Noise Variant", 0 to 1
    gridResolution = 200; // "Grid Resolution", 1 to 200, step 1
    interpolate = true; // "Interpolate"
    evenSpacing = true; // "Even Spacing"
    splineTension = 1; // "Spline Tension", 0 to 1
    lineWidth = 1; // "Nib Size (mm)", 0.1 to 2

    sketch() {
        // Create the noise function
        const prng = alea(0);
        const noise = createNoise3D(prng);

        return (props: CanvasSketchProps) => {
            // Create the value function for the generator
            const valueFn = (x: number, y: number) => {
                const noiseValue =
                    noise(
                        x * props.width * this.noiseScaleX,
                        y * props.height * this.noiseScaleY,
                        this.noiseVariant
                    ) /
                        2 +
                    0.5;

                // Rounded rectangle function
                const roundedRectSDF = (x: number, y: number, radius: number) => {
                    // Normalize to [0, 1]
                    const width = 1,
                        height = 1;
                    x = x * 2 - 1;
                    y = y * 2 - 1;
                    radius = radius - 0.5;

                    // Calculations
                    const dx = Math.abs(x) - width / 2 + radius;
                    const dy = Math.abs(y) - height / 2 + radius;
                    return (
                        Math.min(Math.max(dx, dy), 0.0) +
                        Math.sqrt(
                            Math.max(dx, 0.0) * Math.max(dx, 0.0) +
                                Math.max(dy, 0.0) * Math.max(dy, 0.0)
                        ) -
                        radius
                    );
                };

                const sigmoidEasing = (t: number, k: number) => {
                    const sigmoidBase = (t: number, k: number) => {
                        return 1.0 / (1.0 + Math.exp(-k * t)) - 0.5;
                    };
                    const correction = 0.5 / sigmoidBase(1.0, k);
                    return correction * sigmoidBase(2.0 * t - 1.0, k) + 0.5;
                };

                // Multiply the noise value by eased rounded rectangle SDF
                let multiplier = roundedRectSDF(x, y, this.rounding);
                multiplier = sigmoidEasing(multiplier, this.easing);
                multiplier = Math.max(0, 1 - multiplier * 2);
                return noiseValue * multiplier;
            };

            // Create the generator
            const insetPercent = this.inset;
            const minDimension = Math.min(props.width, props.height);
            const insetValues: [number, number] = [
                this.fixedAspect
                    ? (props.width - minDimension) / 2 + minDimension * insetPercent
                    : minDimension * insetPercent,
                this.fixedAspect
                    ? (props.height - minDimension) / 2 + minDimension * insetPercent
                    : minDimension * insetPercent
            ];
            const generator = new IsolineGrid(
                this.gridResolution,
                insetValues,
                [props.width - insetValues[0] * 2, props.height - insetValues[1] * 2],
                valueFn
            );
            const scaledNibSize = this.lineWidth * 0.0393701; // mm to inches

            // Generate and render the paths
            const paths = generator.generateIsolineLayers(
                this.layerCount,
                [this.edgeLow, this.edgeHigh],
                this.splineTension,
                this.interpolate,
                this.evenSpacing
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
