// todo: re-enable typescript in this file
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import { renderPaths } from 'canvas-sketch-util/penplot';

export default class __title__ extends CanvasSketchProject {
    sketch() {
        return (props: CanvasSketchProps) => {
            const { width, height } = props;

            const path1 = [
                [0, 0],
                [width, height]
            ];
            const path2 = [
                [0, height],
                [width, 0]
            ];
            const paths = [path1, path2];

            return renderPaths(paths, {
                lineWidth: [0.05, 0.05],
                lineJoin: 'round',
                lineCap: 'round',
                strokeStyle: ['black', 'black'],
                inkscape: true,
                ...props
            });
        };
    }
}
