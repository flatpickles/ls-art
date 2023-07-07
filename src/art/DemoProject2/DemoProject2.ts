import Project from '$lib/base/Project';

export default class DemoProject extends Project {
    testNumber = 42;
    testBoolean = true;

    update() {
        if (!this.canvas) throw new Error('Canvas not set');
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(0, 0, 150, 100);
    }
}
