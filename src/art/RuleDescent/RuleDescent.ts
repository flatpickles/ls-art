import Project from '$lib/base/Project/Project';

type PixelValue = [number, number, number, number];

export default class Rules extends Project {
    speed = 1; // "Speed", 0 to 10, step 1
    restart = () => {
        // "Restart"
        this.begin();
        this.#currentRow = 1;
    };

    #currentRow = 1;

    // A rule function that takes a lookup function and returns a new pixel value.
    // The lookup function takes an offset and returns the pixel value at that offset.
    rule(offsetValue: (offset: number) => PixelValue): PixelValue {
        const left = offsetValue(-1);
        const right = offsetValue(Math.random() > 0.54 ? 3 : -3);
        return [
            left[0] < 100 ? left[0] : right[0],
            left[1] < 100 ? left[1] : right[1],
            left[2] < 100 ? left[2] : right[2],
            255
        ];
    }

    // Start the pattern with random pixels
    begin() {
        // Canvas and context from local props
        const canvas = this.canvas;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        // Create a random strip of pixels across the first row of the canvas
        const imageData = context.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < canvas.width * 4; i += 4) {
            // Randomly set red, green, and blue values
            imageData.data[i] = Math.floor(Math.random() * 256); // Red
            imageData.data[i + 1] = Math.floor(Math.random() * 256); // Green
            imageData.data[i + 2] = Math.floor(Math.random() * 256); // Blue
            imageData.data[i + 3] = 255; // Alpha (fully opaque)
        }

        // Set the random pixel data back to the canvas
        context.putImageData(imageData, 0, 0);
    }

    nextRow() {
        // Canvas and context from local props
        const canvas = this.canvas;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        // Generate the next row
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const rowOffset = this.#currentRow * canvas.width * 4;
        for (let rowEntry = 0; rowEntry < canvas.width * 4; rowEntry += 4) {
            const pixelIndex = rowOffset + rowEntry;
            const valueFn = (offset: number) => {
                return [
                    imageData.data[pixelIndex - canvas.width * 4 + offset],
                    imageData.data[pixelIndex - canvas.width * 4 + offset + 1],
                    imageData.data[pixelIndex - canvas.width * 4 + offset + 2],
                    imageData.data[pixelIndex - canvas.width * 4 + offset + 3]
                ] as PixelValue;
            };
            const newPixelValue = this.rule(valueFn);
            imageData.data[pixelIndex] = newPixelValue[0];
            imageData.data[pixelIndex + 1] = newPixelValue[1];
            imageData.data[pixelIndex + 2] = newPixelValue[2];
            imageData.data[pixelIndex + 3] = newPixelValue[3];
        }

        const reachedFullHeight = this.#currentRow >= canvas.height - 1;
        if (!reachedFullHeight) this.#currentRow++;

        // Set the random pixel data back to the canvas
        context.putImageData(imageData, 0, reachedFullHeight ? -1 : 0);
    }

    init() {
        this.begin();
    }

    resized() {
        this.restart();
    }

    update() {
        for (let i = 0; i < this.speed; i++) this.nextRow();
    }
}
