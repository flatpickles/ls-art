import PathUtil from '../util/Legacy/PathUtil';
import PolylineUtil from '../util/Legacy/PolylineUtil';
import type { Path } from 'd3-path';

interface GridCorner {
    position: [number, number];
    noiseValue: number;
}

interface IsolineNode {
    position: [number, number];
    connections: IsolineNode[];
}

class IsolineGridCell {
    // Grid corners
    topLeft: GridCorner;
    topRight: GridCorner;
    bottomLeft: GridCorner;
    bottomRight: GridCorner;

    // Isoline connection nodes
    topNode: IsolineNode;
    rightNode: IsolineNode;
    bottomNode: IsolineNode;
    leftNode: IsolineNode;

    constructor(
        topLeft: GridCorner,
        topRight: GridCorner,
        bottomLeft: GridCorner,
        bottomRight: GridCorner,
        leftNode: IsolineNode,
        topNode: IsolineNode,
        rightNode: IsolineNode,
        bottomNode: IsolineNode
    ) {
        // Assign corners
        this.topLeft = topLeft;
        this.topRight = topRight;
        this.bottomLeft = bottomLeft;
        this.bottomRight = bottomRight;
        // Assign nodes
        this.leftNode = leftNode;
        this.topNode = topNode;
        this.rightNode = rightNode;
        this.bottomNode = bottomNode;
    }

    updateConnections(noiseEdge: number, interpolateNodePositions = true) {
        // Helper function to get position of node along an edge
        function nodePos(corner1: GridCorner, corner2: GridCorner, noiseEdge: number, axis: 0 | 1) {
            const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
            const edgePercentage = clamp01(
                (noiseEdge - corner1.noiseValue) / (corner2.noiseValue - corner1.noiseValue)
            );
            return (
                corner1.position[axis] +
                edgePercentage * (corner2.position[axis] - corner1.position[axis])
            );
        }

        if (interpolateNodePositions) {
            // Update node positions
            this.leftNode.position = [
                this.topLeft.position[0],
                nodePos(this.topLeft, this.bottomLeft, noiseEdge, 1)
            ];
            this.topNode.position = [
                nodePos(this.topLeft, this.topRight, noiseEdge, 0),
                this.topLeft.position[1]
            ];
            this.rightNode.position = [
                this.topRight.position[0],
                nodePos(this.topRight, this.bottomRight, noiseEdge, 1)
            ];
            this.bottomNode.position = [
                nodePos(this.bottomLeft, this.bottomRight, noiseEdge, 0),
                this.bottomLeft.position[1]
            ];
        }

        // Use distance signs to lookup connections (per Marching Squares wikipedia)
        const lookupState =
            1 * (this.bottomLeft.noiseValue > noiseEdge ? 1 : 0) +
            2 * (this.bottomRight.noiseValue > noiseEdge ? 1 : 0) +
            4 * (this.topRight.noiseValue > noiseEdge ? 1 : 0) +
            8 * (this.topLeft.noiseValue > noiseEdge ? 1 : 0);
        switch (lookupState) {
            case 1:
                this.leftNode.connections.push(this.bottomNode);
                this.bottomNode.connections.push(this.leftNode);
                break;
            case 2:
                this.bottomNode.connections.push(this.rightNode);
                this.rightNode.connections.push(this.bottomNode);
                break;
            case 3:
                this.leftNode.connections.push(this.rightNode);
                this.rightNode.connections.push(this.leftNode);
                break;
            case 4:
                this.topNode.connections.push(this.rightNode);
                this.rightNode.connections.push(this.topNode);
                break;
            case 5:
                this.leftNode.connections.push(this.topNode);
                this.topNode.connections.push(this.leftNode);
                this.bottomNode.connections.push(this.rightNode);
                this.rightNode.connections.push(this.bottomNode);
                break;
            case 6:
                this.topNode.connections.push(this.bottomNode);
                this.bottomNode.connections.push(this.topNode);
                break;
            case 7:
                this.leftNode.connections.push(this.topNode);
                this.topNode.connections.push(this.leftNode);
                break;
            case 8:
                this.leftNode.connections.push(this.topNode);
                this.topNode.connections.push(this.leftNode);
                break;
            case 9:
                this.topNode.connections.push(this.bottomNode);
                this.bottomNode.connections.push(this.topNode);
                break;
            case 10:
                this.leftNode.connections.push(this.bottomNode);
                this.bottomNode.connections.push(this.leftNode);
                this.topNode.connections.push(this.rightNode);
                this.rightNode.connections.push(this.topNode);
                break;
            case 11:
                this.topNode.connections.push(this.rightNode);
                this.rightNode.connections.push(this.topNode);
                break;
            case 12:
                this.leftNode.connections.push(this.rightNode);
                this.rightNode.connections.push(this.leftNode);
                break;
            case 13:
                this.bottomNode.connections.push(this.rightNode);
                this.rightNode.connections.push(this.bottomNode);
                break;
            case 14:
                this.leftNode.connections.push(this.bottomNode);
                this.bottomNode.connections.push(this.leftNode);
                break;
            default:
                break;
        }
    }
}

export default class IsolineGrid {
    private isolineNodes: IsolineNode[];
    private gridCells: IsolineGridCell[][];

    constructor(
        gridResolution: number,
        gridOrigin: [number, number],
        gridDimensions: [number, number],
        valueFn: (x: number, y: number) => number
    ) {
        // Scale the grid resolution & noise lookups with the grid aspect ratio
        const aspectRatio = gridDimensions[1] / gridDimensions[0];
        const scaledGridResolution = [gridResolution, Math.round(gridResolution * aspectRatio)];

        // Create the grid entities
        const gridCorners: GridCorner[][] = [];
        this.isolineNodes = [];
        this.gridCells = [];
        for (let rowIdx = 0; rowIdx <= scaledGridResolution[1]; rowIdx++) {
            const cornerRow: GridCorner[] = [];
            const cellRow: IsolineGridCell[] = [];

            for (let colIdx = 0; colIdx <= scaledGridResolution[0]; colIdx++) {
                // Calculate progress
                const progress = [
                    colIdx / scaledGridResolution[0],
                    rowIdx / scaledGridResolution[1]
                ];

                // Create grid corner and assign value
                const position: [number, number] = [
                    gridOrigin[0] + progress[0] * gridDimensions[0],
                    gridOrigin[1] + progress[1] * gridDimensions[1]
                ];
                const noiseValue = valueFn(progress[0], progress[1]);
                const gridCorner: GridCorner = { position, noiseValue };
                cornerRow.push(gridCorner);

                // Create cell with shared corner & node references
                // (cell indices are 1 less than corner indices)
                if (rowIdx > 0 && colIdx > 0) {
                    // Retrieve corners
                    const topLeft = gridCorners[rowIdx - 1][colIdx - 1];
                    const topRight = gridCorners[rowIdx - 1][colIdx];
                    const bottomLeft = cornerRow[colIdx - 1];
                    const bottomRight = gridCorner;

                    // Create / retrieve nodes
                    const leftNode: IsolineNode = cellRow.length
                        ? cellRow[cellRow.length - 1].rightNode
                        : {
                              position: [
                                  topLeft.position[0],
                                  (topLeft.position[1] + bottomLeft.position[1]) / 2
                              ],
                              connections: []
                          };
                    const topNode: IsolineNode = this.gridCells.length
                        ? this.gridCells[this.gridCells.length - 1][colIdx - 1].bottomNode
                        : {
                              position: [
                                  (topLeft.position[0] + topRight.position[0]) / 2,
                                  topLeft.position[1]
                              ],
                              connections: []
                          };
                    const rightNode: IsolineNode = {
                        position: [
                            topRight.position[0],
                            (topRight.position[1] + bottomRight.position[1]) / 2
                        ],
                        connections: []
                    };
                    const bottomNode: IsolineNode = {
                        position: [
                            (bottomLeft.position[0] + bottomRight.position[0]) / 2,
                            bottomLeft.position[1]
                        ],
                        connections: []
                    };

                    // Collect nodes (for later traversal)
                    if (!cellRow.length) this.isolineNodes.push(leftNode);
                    if (!this.gridCells.length) this.isolineNodes.push(topNode);
                    this.isolineNodes.push(rightNode);
                    this.isolineNodes.push(bottomNode);

                    // Create cell with shared corner & node references
                    const cell = new IsolineGridCell(
                        topLeft,
                        topRight,
                        bottomLeft,
                        bottomRight,
                        leftNode,
                        topNode,
                        rightNode,
                        bottomNode
                    );
                    cellRow.push(cell);
                }
            }
            gridCorners.push(cornerRow);
            if (cellRow.length) this.gridCells.push(cellRow);
        }
    }

    private updateAllConnections(noiseEdge: number, interpolateNodePositions = true) {
        // Clear all current connections
        // (traversal removes connections; clear here in case traversal hasn't been done)
        for (const node of this.isolineNodes) {
            node.connections = [];
        }

        // Ask each cell to update the connections traversing its nodes
        for (let rowIdx = 0; rowIdx < this.gridCells.length; rowIdx++) {
            for (let colIdx = 0; colIdx < this.gridCells[rowIdx].length; colIdx++) {
                const cell = this.gridCells[rowIdx][colIdx];
                cell.updateConnections(noiseEdge, interpolateNodePositions);
            }
        }
    }

    public generateIsolines(
        noiseEdge: number,
        splineTension = 1.0,
        interpolateNodePositions = true,
        evenlySpacePoints = true,
        includeGridLayer = false
    ): Path[][] {
        // Update data model
        this.updateAllConnections(noiseEdge, interpolateNodePositions);

        // Helper function to get path points from a node, recursively
        function getPathPointsFromNode(
            currentNode: IsolineNode,
            previousNode: IsolineNode | null = null
        ): [number, number][] {
            if (currentNode.connections.length > 2) {
                throw 'Nodes should not be connected in more than two directions';
            } else if (currentNode.connections.length) {
                // Collect the one or two valid paths leading from this node
                const pathPoints: [number, number][][] = [];
                while (currentNode.connections.length) {
                    // Remove all connections (eventually)
                    const nextNode = currentNode.connections.pop();
                    // ... and follow those that aren't to the previous node
                    if (nextNode && nextNode !== previousNode) {
                        pathPoints.push(getPathPointsFromNode(nextNode, currentNode));
                    }
                }

                // Return the connected path(s)
                if (!pathPoints.length) {
                    // No paths exist, so this is an endpoint
                    return [currentNode.position];
                } else if (pathPoints.length === 1) {
                    // One path leading away; prefix it with the current node
                    return [currentNode.position, ...pathPoints[0]];
                } else if (pathPoints.length === 2) {
                    // Two paths leading away; connect them through the current node
                    // (and flip the first path, for order continuity)
                    return [...pathPoints[0].reverse(), currentNode.position, ...pathPoints[1]];
                } else if (pathPoints.length > 2) {
                    throw 'Paths should not exist in more than two directions';
                }
            }
            return [];
        }

        // Generate isoline layer from data model, as several collections of points
        const isolinePointSets: [number, number][][] = [];
        for (const isolineNode of this.isolineNodes) {
            let pathPoints = getPathPointsFromNode(isolineNode);
            if (pathPoints.length > 2) {
                if (evenlySpacePoints) pathPoints = PolylineUtil.evenlySpacePoints(pathPoints);
                isolinePointSets.push(pathPoints);
            }
        }

        // Create bezier paths and return them
        const isolinePaths: Path[] = [];
        for (const pointSet of isolinePointSets) {
            const path = PathUtil.createCardinalSpline(pointSet, splineTension);
            isolinePaths.push(path);
        }

        // Create reference grid
        if (includeGridLayer) {
            const splineLayer: Path[] = [];
            for (let x = 0; x < this.gridCells.length; x++) {
                for (let y = 0; y < this.gridCells[x].length; y++) {
                    const cell = this.gridCells[x][y];
                    const topLeft = cell.topLeft.position;
                    const topRight = cell.topRight.position;
                    const bottomLeft = cell.bottomLeft.position;
                    const bottomRight = cell.bottomRight.position;
                    const gridPath = [topLeft, topRight, bottomRight, bottomLeft, topLeft];
                    splineLayer.push(PathUtil.createCardinalSpline(gridPath, 0));
                }
            }
            return [isolinePaths, splineLayer];
        }
        return [isolinePaths];
    }

    public generateIsolineLayers(
        layerCount: number,
        noiseBounds: [number, number] = [0, 1],
        splineTension = 1.0,
        interpolateNodePositions = true,
        evenlySpacePoints = true,
        includeGridLayer = false
    ): Path[][] {
        // Capture params in local generation function
        const generateLayer = (noiseEdge: number, grid = false) =>
            this.generateIsolines(
                noiseEdge,
                splineTension,
                interpolateNodePositions,
                evenlySpacePoints,
                grid
            );

        // Return a single layer if requested)
        if (layerCount == 1)
            return generateLayer((noiseBounds[0] + noiseBounds[1]) / 2, includeGridLayer);

        // Otherwise, return layers spaced evenly throughout the noise range
        const isolineLayers: Path[][] = [];
        for (let lineIndex = 0; lineIndex < layerCount; lineIndex++) {
            const noiseEdge =
                noiseBounds[0] + (lineIndex / (layerCount - 1)) * (noiseBounds[1] - noiseBounds[0]);
            const isolines = generateLayer(
                noiseEdge,
                includeGridLayer && lineIndex == layerCount - 1
            );
            isolineLayers.push(isolines[0]);
            if (includeGridLayer && lineIndex == layerCount - 1) isolineLayers.push(isolines[1]);
        }
        return isolineLayers;
    }
}
