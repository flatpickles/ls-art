export default class Generator {
    public generate(
        origin: [number, number],
        dimensions: [number, number],
        nodeCount = 10,
        corners = [true, true, true, true]
    ): [number, number][][][] {
        const topLeftCorner: [number, number] = origin;
        const topRightCorner: [number, number] = [origin[0] + dimensions[0], origin[1]];
        const bottomRightCorner: [number, number] = [
            origin[0] + dimensions[0],
            origin[1] + dimensions[1],
        ];
        const bottomLeftCorner: [number, number] = [origin[0], origin[1] + dimensions[1]];

        // Collections of lines from each corner...
        // A is the left hand side, B is the right hand side
        // n case I want to be able to draw these out in fan order
        const topLeftLinesA: [number, number][][] = [];
        const topLeftLinesB: [number, number][][] = [];
        const topRightLinesA: [number, number][][] = [];
        const topRightLinesB: [number, number][][] = [];
        const bottomRightLinesA: [number, number][][] = [];
        const bottomRightLinesB: [number, number][][] = [];
        const bottomLeftLinesA: [number, number][][] = [];
        const bottomLeftLinesB: [number, number][][] = [];

        // Build up the lines from each corner
        const increment = [dimensions[0] / (nodeCount - 1), dimensions[1] / (nodeCount - 1)];
        for (let terminusIdx = 1; terminusIdx < nodeCount - 1; terminusIdx++) {
            const topNode: [number, number] = [
                topLeftCorner[0] + terminusIdx * increment[0],
                topLeftCorner[1],
            ];
            const rightNode: [number, number] = [
                topRightCorner[0],
                topRightCorner[1] + terminusIdx * increment[1],
            ];
            const bottomNode: [number, number] = [
                bottomLeftCorner[0] + terminusIdx * increment[0],
                bottomLeftCorner[1],
            ];
            const leftNode: [number, number] = [
                topLeftCorner[0],
                topLeftCorner[1] + terminusIdx * increment[1],
            ];

            topLeftLinesA.push([topLeftCorner, rightNode]);
            topLeftLinesB.push([topLeftCorner, bottomNode]);
            topRightLinesA.push([topRightCorner, bottomNode]);
            topRightLinesB.push([topRightCorner, leftNode]);
            bottomRightLinesA.push([bottomRightCorner, leftNode]);
            bottomRightLinesB.push([bottomRightCorner, topNode]);
            bottomLeftLinesA.push([bottomLeftCorner, topNode]);
            bottomLeftLinesB.push([bottomLeftCorner, rightNode]);
        }

        // Build the base structure (outline & diagonals)
        const baseStructure: [number, number][][] = [
            [topLeftCorner, topRightCorner],
            [topRightCorner, bottomRightCorner],
            [bottomRightCorner, bottomLeftCorner],
            [bottomLeftCorner, topLeftCorner],
        ];
        if (corners[0] || corners[2]) baseStructure.push([topLeftCorner, bottomRightCorner]);
        if (corners[1] || corners[3]) baseStructure.push([topRightCorner, bottomLeftCorner]);

        // Build the return array
        const returnArray: [number, number][][][] = [baseStructure];
        if (corners[0]) returnArray.push(topLeftLinesA.concat(topLeftLinesB.reverse()));
        if (corners[1]) returnArray.push(topRightLinesA.concat(topRightLinesB.reverse()));
        if (corners[2]) returnArray.push(bottomRightLinesA.concat(bottomRightLinesB.reverse()));
        if (corners[3]) returnArray.push(bottomLeftLinesA.concat(bottomLeftLinesB.reverse()));
        return returnArray;
    }
}
