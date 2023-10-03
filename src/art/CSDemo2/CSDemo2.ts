import CanvasSketchProject, {
    type CanvasSketchProps,
    type CanvasSketchRender
} from '../util/CanvasSketchProject';

export default class CSDemo2 extends CanvasSketchProject {
    async sketch(): Promise<CanvasSketchRender> {
        return (renderProps: CanvasSketchProps) => {
            // Fill the canvas with pink
            renderProps.context.fillStyle = 'pink';
            renderProps.context.fillRect(0, 0, renderProps.width, renderProps.height);

            // Write some text in the top left
            renderProps.context.fillStyle = 'white';
            renderProps.context.font = 'bold 1px Helvetica';
            renderProps.context.textAlign = 'left';
            renderProps.context.textBaseline = 'top';
            renderProps.context.fillText('Hello Canvas Sketch', 0, 0);
        };
    }
}
