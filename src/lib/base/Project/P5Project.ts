/**
 * A simple base class for p5-based projects. Subclass this to create projects in Sketchbook that
 * leverage p5's built-in functionality. See the docs for more info.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import Project, { CanvasType, type Detail } from '$lib/base/Project/Project';
import P5 from 'p5';

export default class P5Project extends Project {
    /**
     * A p5 instance that this project can use to access the p5 API. This will be set automatically
     * when the project is loaded. It is only undefined if accessed in a project's constructor.
     */
    p5?: P5;

    /**
     * p5.js lifecycle functions. Override these with your p5.js code. P5 runs in "instance mode",
     * so all library functionality must be accessed through a p5 object; you may choose to use
     * either `this.p5` or the `p5` argument passed to each function, which are equivalent.
     */
    preload(p5: P5) {}
    setup(p5: P5) {}
    draw(p5: P5) {}
    mousePressed(p5: P5) {}

    /**
     * Project superclass overrides; you shouldn't need to change these.
     */
    canvasType = CanvasType.None;
    init({ container }: { container: HTMLDivElement }) {
        // Create a P5 instance that calls the lifecycle functions defined above
        const processingFn = (p5: P5) => {
            p5.preload = this.preload.bind(this, p5);
            p5.setup = this.setup.bind(this, p5);
            p5.draw = this.draw.bind(this, p5);
            p5.mousePressed = this.mousePressed.bind(this, p5);
        };
        this.p5 = new P5(processingFn);

        // Create a P5 canvas, filling the container div by default
        const p5Canvas = this.p5.createCanvas(container.clientWidth, container.clientHeight);
        p5Canvas.parent(container);
        requestAnimationFrame(this.p5.draw); // avoid a flicker before the first animation frame
    }
    resized({ containerSize }: { containerSize: [number, number] }): void {
        this.p5?.resizeCanvas(containerSize[0], containerSize[1]);
    }
    destroy(detail: Detail<CanvasType>) {
        super.destroy(detail);
        this.p5?.remove();
    }
}
