import type { UpdateDetail2D } from '$lib/base/Project/Project';
import Project from '$lib/base/Project/Project';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Util from '../util/Legacy/Util';

export default class NoSignal extends Project {
    colorCount = 19; // "Color Count", 1 to 32, step 1
    bwCount = 32; // "B&W Count", 1 to 64, step 1
    displayText = 'NO SIGNAL'; // "Display Text"

    update(detail: UpdateDetail2D): void {
        const width = detail.canvas.width;
        const height = detail.canvas.height;
        const time = detail.time;

        // Tuned constants
        const barHeight = 150;
        const colorPercentage = 0.85;
        const colorSpeed = 0.1;

        // Clear the previous frame
        detail.context.clearRect(0, 0, detail.canvas.width, detail.canvas.width);

        // Draw color bars
        const colorNumBars = Math.floor(this.colorCount);
        const colorBarWidth = Math.floor(width / colorNumBars);
        const colorExtraWidth = width - colorBarWidth * colorNumBars;
        const colorBarHeight = Math.floor(height * colorPercentage);
        for (let barIndex = 0; barIndex < colorNumBars; barIndex++) {
            let currentBarWidth = colorBarWidth;
            if (barIndex == colorNumBars - 1) {
                currentBarWidth += colorExtraWidth;
            }
            const hue = (barIndex / colorNumBars + time * colorSpeed) % 1;
            detail.context.fillStyle = Util.hsl(hue, 1, 0.5);
            detail.context.fillRect(colorBarWidth * barIndex, 0, currentBarWidth, colorBarHeight);
        }

        // Draw B&W bars
        const bwNumBars = Math.floor(this.bwCount);
        const bwBarWidth = Math.floor(width / bwNumBars);
        const bwExtraWidth = width - bwBarWidth * bwNumBars;
        const bwBarHeight = height - colorBarHeight;
        for (let barIndex = 0; barIndex < bwNumBars; barIndex++) {
            let currentBarWidth = bwBarWidth;
            if (barIndex == bwNumBars - 1) {
                currentBarWidth += bwExtraWidth;
            }
            const value = Util.triangle(time * colorSpeed - barIndex / bwNumBars + 2);
            detail.context.fillStyle = Util.hsl(0, 0, value);
            detail.context.fillRect(
                bwBarWidth * barIndex,
                colorBarHeight,
                currentBarWidth,
                bwBarHeight
            );
        }

        // Horizontal stripe across the screen
        detail.context.fillStyle = '#000';
        detail.context.fillRect(0, height / 2 - barHeight / 2, width, barHeight);

        // "No Signal" text
        const textSize = 80; // eyeballing it
        if (this.displayText.length > 0) {
            detail.context.fillStyle = '#FFF';
            detail.context.font = `${textSize}px monospace`;
            detail.context.textAlign = 'center';
            detail.context.textBaseline = 'bottom';
            detail.context.fillText(this.displayText, width / 2, height / 2 + (textSize / 5) * 3);
        }
    }
}
