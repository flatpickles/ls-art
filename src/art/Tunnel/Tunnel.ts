import REGL from 'regl';
import reglCamera from 'regl-camera';
import { mat4 } from 'gl-matrix';

import Project, { CanvasType, type DetailWebGL } from '$lib/base/Project/Project';
import TunnelGeo from './TunnelGeo';

export default class Tunnel extends Project {
    speed = 0.2; // "Speed"

    canvasType = CanvasType.WebGL;
    #regl?: REGL.Regl;

    init({ canvas }: DetailWebGL) {
        // Create gl stuff
        this.#regl = REGL(canvas);
        const camera = reglCamera(this.#regl, {
            center: [0, 0, 0],
            theta: -Math.PI / 2,
            distance: 1,
            mouse: false
        });

        // Prepare for drawing
        const geo = new TunnelGeo(this.#regl);
        const translation = mat4.create();
        const identity = mat4.create();
        mat4.identity(identity);

        this.#regl.frame(() => {
            // Update & clear
            this.#regl?.poll();
            this.#regl?.clear({
                color: [0, 0, 0, 1],
                depth: 1
            });

            // Move camera and calculate starting position for tunnel units
            camera.center[2] = camera.center[2] + this.speed * 0.1;
            const firstUnitOffset =
                camera.center[2] - (camera.center[2] % TunnelGeo.unitSize) - TunnelGeo.unitSize;

            // Draw all tunnel units, with repeated draw calls and model uniform updates
            // todo: some sort of fog or lighting to obscure the distant segments
            camera(() => {
                let currentDistance = firstUnitOffset;
                for (let unitNum = 0; unitNum <= TunnelGeo.unitCount; unitNum += 1) {
                    mat4.translate(translation, identity, [0, 0, currentDistance]);
                    geo.draw({
                        model: translation
                    });
                    currentDistance += TunnelGeo.unitSize;
                }
            });
        });
    }

    public destroy(detail: DetailWebGL) {
        super.destroy(detail);
        this.#regl?.destroy();
    }
}
