import Project, { type UpdateDetail2D } from '$lib/base/Project/Project';

import Color from 'canvas-sketch-util/color';

import CanvasUtil from '../util/Legacy/CanvasUtil';
import { Point } from '../util/Legacy/Geometry.js';

import RectStructure from './RectStructure';

export default class Rectilinear extends Project {
    fillWidth = 1; // "Total Width"
    fillHeight = 0.8; // "Total Height"
    horizontalBorderSize = 3; // "H Border Px", 0 to 30, step 1
    verticalBorderSize = 3; // "V Border Px", 0 to 30, step 1
    borderColor = '#ffe2d6'; // "BG Color"
    primaryColor = '#003b57'; // "Rect Color A"
    primaryColorLikelihood = 0.5; // "A Likelihood"
    secondaryColor = '#ff4000'; // "Rect Color B"
    randomizeBHue = false; // "Random B Hue"
    newColors = () => {
        // "New Colors"
        this.#newColorsNeeded = true;
    };
    unitSize = 20; // "Unit Size Px", 20 to 100, step 1
    maxWidthUnits = 10; // "H Max Units", 5 to 30, step 1
    maxHeightUnits = 15; // "V Max Units", 5 to 30, step 1
    newShapes = () => {
        // "New Shapes"
        this.#initializationNeeded = true;
    };

    #structure: RectStructure | undefined = undefined;
    #initializationNeeded = true;
    #newColorsNeeded = true;
    #initializeIfNeeded(width: number, height: number) {
        // Check params to see if initialization is needed
        if (this.#structure) {
            const paramsUpdated = this.#structure.configIsDifferent(
                this.unitSize,
                this.maxWidthUnits,
                this.maxHeightUnits,
                this.fillWidth,
                this.fillHeight
            );
            this.#initializationNeeded = this.#initializationNeeded || paramsUpdated;
        }

        // Initialize!
        if (this.#initializationNeeded) {
            this.#structure = new RectStructure(
                width,
                height,
                this.unitSize,
                this.maxWidthUnits,
                this.maxHeightUnits,
                this.fillWidth,
                this.fillHeight
            );
            this.#initializationNeeded = false;
            this.#newColorsNeeded = true;
        }

        if (this.#structure && this.#structure.rects && this.#newColorsNeeded) {
            this.#structure.rects.forEach((rect) => {
                // Generate random values for each rect, to be used when coloring
                rect.primaryRandom = Math.random();
                rect.colorRandom = Math.random();
            });
            this.#newColorsNeeded = false;
        }
    }

    update({ context, canvas }: UpdateDetail2D): void {
        const width = canvas.width;
        const height = canvas.height;

        // Retrieve param values
        const hBorder = this.horizontalBorderSize;
        const vBorder = this.verticalBorderSize;
        const borderColor = this.borderColor;
        const primaryColor = this.primaryColor;
        const secondaryColor = this.secondaryColor;
        const primaryColorLikelihood = this.primaryColorLikelihood;
        const randomizeSecondaryColor = this.randomizeBHue;

        // Clear and initialize if needed
        this.#initializeIfNeeded(width, height);
        context.fillStyle = borderColor;
        context.rect(0, 0, width, height);
        context.fill();

        // Type assertion (apologies - this was originally written in JS, then ported to TS)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const structure = this.#structure!;

        // Translate canvas if resized from actual structure dimensions
        // [bug] This causes alignment issues if the canvas has been resized to be smaller than the
        // ..... structure. I'm not sure why this is happening, but it's code from the original
        // ..... project, so I won't fix it for now (as of skbk port in October '23)
        const widthScale = width / structure.fullWidth;
        const heightScale = height / structure.fullHeight;
        if (widthScale < heightScale) {
            const inset = (height - structure.fullHeight * widthScale) / 2;
            context.translate(0, inset);
            context.scale(widthScale, widthScale);
        } else {
            const inset = (width - structure.fullWidth * heightScale) / 2;
            context.translate(inset, 0);
            context.scale(heightScale, heightScale);
        }

        // Fill shapes
        structure.rects?.forEach((rect) => {
            const vertices = [rect.topLeft, rect.topRight, rect.bottomRight, rect.bottomLeft];
            let fillStyle;
            if (rect.primaryRandom < primaryColorLikelihood) {
                fillStyle = primaryColor;
            } else if (!randomizeSecondaryColor) {
                fillStyle = secondaryColor;
            } else {
                const secondaryHSL = Color.parse(secondaryColor).hsl;
                fillStyle =
                    'hsl(' +
                    rect.colorRandom * 360 +
                    ', ' +
                    secondaryHSL[1] +
                    '%, ' +
                    secondaryHSL[2] +
                    '%)';
            }
            CanvasUtil.drawShape(context, vertices, fillStyle);
        });

        // Draw boundaries only when not filling full height/width
        const topLeft = new Point(0, 0);
        const bottomRight = new Point(width, height);
        structure.rects?.forEach((rect) => {
            // Top
            if (rect.topLeft.y != topLeft.y) {
                CanvasUtil.drawLine(context, rect.topLeft, rect.topRight, hBorder, borderColor);
            }
            // Right
            if (rect.topRight.x != bottomRight.x) {
                CanvasUtil.drawLine(context, rect.topRight, rect.bottomRight, vBorder, borderColor);
            }
            // Bottom
            if (rect.bottomRight.y != bottomRight.y) {
                CanvasUtil.drawLine(
                    context,
                    rect.bottomRight,
                    rect.bottomLeft,
                    hBorder,
                    borderColor
                );
            }
            // Left
            if (rect.bottomLeft.x != topLeft.x) {
                CanvasUtil.drawLine(context, rect.bottomLeft, rect.topLeft, vBorder, borderColor);
            }
        });
    }
}
