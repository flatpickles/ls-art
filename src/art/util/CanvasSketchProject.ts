/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import Project, { type Detail2D, type ParamsChangedDetail2D } from '$lib/base/Project/Project';
import canvasSketch from 'canvas-sketch';

// canvas-sketch doesn't have TS definitions; these are just placeholders for now
export type CanvasSketchManager = any;
export type CanvasSketchProps = any;
export type CanvasSketchRender = any;

export default class CanvasSketchProject extends Project {
    dimensions = [9, 12];

    // Non-param state (to be used or overridden by subclasses)
    ignoreKeys = ['settings', 'manager'];
    manager: CanvasSketchManager;
    settings = {
        pixelRatio: window.devicePixelRatio,
        units: 'in',
        resizeCanvas: true,
        animate: true,
        hotkeys: false // todo; can we still enable save hotkey without enabling play toggling with space?
    };

    // Subclasses should override this method
    sketch(initialProps: CanvasSketchProps): CanvasSketchRender {}

    async init() {
        this.manager = await canvasSketch(this.sketch.bind(this), {
            dimensions: this.dimensions,
            canvas: this.canvas,
            ...this.settings
        });
    }

    resized() {
        this.manager?.update();
    }

    paramsChanged(detail: ParamsChangedDetail2D) {
        super.paramsChanged(detail);
        if (detail.keys.includes('dimensions')) {
            this.manager?.update({
                dimensions: this.dimensions
            });
        }
    }

    destroy(detail: Detail2D) {
        super.destroy(detail);
        this.manager?.unload();

        // Even after unload, sketchManager will clear the canvas on resize
        // todo: canvas-sketch PR to fix this. For now, just clear the canvas
        this.manager.props.canvas = null;
    }
}
