import REGL from 'regl';
import reglCamera from 'regl-camera';
import angleNormals from 'angle-normals';
import { mat4 } from 'gl-matrix';
import Project, { CanvasType, type Detail, type DetailWebGL } from '$lib/base/Project/Project';

import fragShader from './frag.glsl?raw';
import vertShader from './vert.glsl?raw';

export default class ShaderDemo extends Project {
    canvasType = CanvasType.WebGL;
    #regl?: REGL.Regl;

    init({ canvas }: DetailWebGL) {
        this.#regl = REGL(canvas);
        const camera = reglCamera(this.#regl, {
            phi: 1,
            theta: 0.7,
            distance: 5.0
        });

        /* rare multicolored box...
        const positions1 = [
            [+1, -1, +1],
            [+1, -1, -1],
            [-1, -1, -1],
            [-1, -1, +1],
            [+1, +1, +1],
            [+1, +1, -1],
            [-1, +1, -1],
            [-1, +1, +1]
        ];
        const cells1 = [
            [2, 1, 0],
            [3, 2, 0],
            [0, 1, 4],
            [5, 4, 1],
            [1, 2, 5],
            [6, 5, 2],
            [2, 3, 6],
            [7, 6, 3],
            [7, 3, 0],
            [0, 4, 7],
            [4, 5, 6],
            [4, 6, 7]
        ];
        const normals1 = angleNormals(cells1, positions1);
        const box1 = {
            positions: positions1,
            cells: cells1,
            normals: normals1
        };
        */

        const positions2 = [
            // right face; x = 1
            [+1, +1, +1],
            [+1, +1, -1],
            [+1, -1, -1],
            [+1, -1, +1],
            // left face; x = -1
            [-1, +1, +1],
            [-1, +1, -1],
            [-1, -1, -1],
            [-1, -1, +1],
            // top face; y = 1
            [+1, +1, +1],
            [+1, +1, -1],
            [-1, +1, -1],
            [-1, +1, +1],
            // bottom face; y = -1
            [+1, -1, +1],
            [+1, -1, -1],
            [-1, -1, -1],
            [-1, -1, +1],
            // front face; z = 1
            [+1, +1, +1],
            [+1, -1, +1],
            [-1, -1, +1],
            [-1, +1, +1],
            // back face; z = -1
            [+1, +1, -1],
            [+1, -1, -1],
            [-1, -1, -1],
            [-1, +1, -1]
        ];
        const cells2 = [
            // right face
            [0, 1, 3],
            [3, 1, 2],
            // left face
            [7, 5, 4],
            [7, 6, 5],
            // top face
            [8, 9, 11],
            [11, 9, 10],
            // bottom face
            [15, 13, 12],
            [15, 14, 13],
            // front face
            [16, 17, 18],
            [18, 19, 16],
            // back face
            [20, 23, 21],
            [23, 22, 21]
        ];
        const normals2 = angleNormals(cells2, positions2);
        const box2 = {
            positions: positions2,
            cells: cells2,
            normals: normals2
        };

        const draw = this.#regl({
            frag: fragShader,
            vert: vertShader,
            elements: box2.cells,
            attributes: {
                position: box2.positions,
                normal: box2.normals
            },
            uniforms: {
                // https://github.com/regl-project/regl/issues/602
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                model: (context, props) => (props as any).model
            }
        });

        const model = mat4.create();
        this.#regl.frame(() => {
            this.#regl?.poll();
            this.#regl?.clear({
                color: [0, 0, 0, 1],
                depth: 1
            });
            mat4.rotate(model, model, 0.02, [0, 1, 0]);
            camera(() => {
                draw({
                    model: model
                });
            });
        });
    }

    public destroy(detail: Detail) {
        super.destroy(detail);
        this.#regl?.destroy();
    }
}
