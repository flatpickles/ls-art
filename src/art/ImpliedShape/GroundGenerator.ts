export default class GroundGenerator {
    public generate(
        rectangleCount: number,
        topLeft: [number, number],
        bottomRight: [number, number],
        gapSize: number
    ): [number, number][][] {
        const paths: [number, number][][] = [];
        const dimensions = [bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]];
        const rectangleDimensions = [
            (dimensions[0] - gapSize * (rectangleCount - 1)) / rectangleCount,
            (dimensions[1] - gapSize * (rectangleCount - 1)) / rectangleCount
        ];
        for (let xIndex = 0; xIndex < rectangleCount; xIndex++) {
            for (let yIndex = 0; yIndex < rectangleCount; yIndex++) {
                const rectTopLeft: [number, number] = [
                    topLeft[0] + xIndex * (rectangleDimensions[0] + gapSize),
                    topLeft[1] + yIndex * (rectangleDimensions[1] + gapSize)
                ];
                const rectBottomRight: [number, number] = [
                    rectTopLeft[0] + rectangleDimensions[0],
                    rectTopLeft[1] + rectangleDimensions[1]
                ];
                const rectPath: [number, number][] = [
                    rectTopLeft,
                    [rectBottomRight[0], rectTopLeft[1]],
                    rectBottomRight,
                    [rectTopLeft[0], rectBottomRight[1]],
                    rectTopLeft
                ];
                paths.push(rectPath);
            }
        }
        return paths;
    }
}
