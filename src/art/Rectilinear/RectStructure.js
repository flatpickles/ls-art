// Legacy class from original Rectilinear. Not typed/TS, porting or rewrite is a later task.
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { Point, Rect } from '../util/Legacy/Geometry.js';
import Quadtree from '../util/Legacy/Quadtree.js';

function rangeFloor(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export default class RectStructure {
    constructor(
        fullWidth, fullHeight, // dimensions
        unitSize, maxWidthUnits, maxHeightUnits, // configuration (units)
        fillWidth, fillHeight // configuration (ratios)
    ) {
        this.fullWidth = fullWidth;
        this.fullHeight = fullHeight;
        [ // Assign all configuration instance variables:
            this.unitSize,
            this.maxWidthUnits,
            this.maxHeightUnits,
            this.fillWidth,
            this.fillHeight
        ] = this.parseConfig(unitSize, maxWidthUnits, maxHeightUnits, fillWidth, fillHeight);
        this.edgeToEdge = true; // No param for now; fill full space when fillWidth or fillHeight are full
        this.generateRects(this.internalTopLeft);
    }

    get internalWidth() {
        const scaledWidth = this.fullWidth * this.fillWidth;
        const adjustWidth = this.fillWidth != 1 || !this.edgeToEdge;
        const unitOverflow = adjustWidth ? scaledWidth % this.unitSize : 0;
        return scaledWidth - unitOverflow;
    }

    get internalHeight() {
        const scaledHeight = this.fullHeight * this.fillHeight;
        const adjustHeight = this.fillHeight != 1 || !this.edgeToEdge;
        const unitOverflow = adjustHeight ? scaledHeight % this.unitSize : 0;
        return scaledHeight - unitOverflow;
    }

    get internalTopLeft() {
        return new Point(
            Math.floor((this.fullWidth - this.internalWidth) / 2),
            Math.floor((this.fullHeight - this.internalHeight) / 2)
        );
    }

    get internalBottomRight() {
        const topLeft = this.internalTopLeft;
        return new Point(
            this.fullWidth - topLeft.x,
            this.fullHeight - topLeft.y
        );
    }

    configIsDifferent(unitSize, maxWidthUnits, maxHeightUnits, fillWidth, fillHeight) {
        const parsedConfig = this.parseConfig(unitSize, maxWidthUnits, maxHeightUnits, fillWidth, fillHeight);
        return this.unitSize != parsedConfig[0] ||
            this.maxWidthUnits != parsedConfig[1] ||
            this.maxHeightUnits != parsedConfig[2] ||
            this.fillWidth != parsedConfig[3] ||
            this.fillHeight != parsedConfig[4];
    }

    parseConfig(unitSize, maxWidthUnits, maxHeightUnits, fillWidth, fillHeight) {
        return [
            Math.floor(unitSize),
            Math.floor(maxWidthUnits),
            Math.floor(maxHeightUnits),
            fillWidth,
            fillHeight
        ];
    }

    reset() {
        this.quadtree = new Quadtree(this.fullWidth, this.fullHeight); // rects in 2D space
        this.rects = []; // holds same data as quadtree, but keeps addition order
        this.rightOpen = []; // rectangles that do not yet have another on their right
        this.bottomOpen = []; // rectangles that do not yet have another beneath them
    }

    generateRects(fromPoint) {
        // Clear and add first rect
        this.reset();
        this.addRect(fromPoint);
    
        // Iterate through queues of rects with open sides to add more
        while (this.rightOpen.length > 0 || this.bottomOpen.length > 0) {
            if (this.bottomOpen.length > 0) {
                const topRect = this.bottomOpen.shift();
                const newOrigin = new Point(topRect.x, topRect.y + topRect.height);
                this.addRect(newOrigin);
            }
            if (this.rightOpen.length > 0) {
                const leftRect = this.rightOpen.shift();
                const newOrigin = new Point(leftRect.x + leftRect.width, leftRect.y);
                this.addRect(newOrigin);
            }
        }
    }

    addRect(fromPoint) {
        // Calculate maximum possible rect size from this point, or return null if invalid
        const maxRectSize = this.maxRectSize(fromPoint, Math.random() > 0.5);
        if (!maxRectSize) return null;

        // Calculate width for next rect
        const minWidthUnits = 1;
        const maxWidthUnits = this.maxWidthUnits;
        const widthRemaining = this.internalBottomRight.x - fromPoint.x;
        let width = Math.min(
            widthRemaining,
            maxRectSize.x,
            this.unitSize * rangeFloor(minWidthUnits, maxWidthUnits)
        );
        const widthLeftover = this.internalBottomRight.x - (fromPoint.x + width);
        if (widthLeftover < this.unitSize * minWidthUnits) {
            width += widthLeftover;
        }

        // Calculate height for next rect
        const minHeightUnits = 1;
        const maxHeightUnits = this.maxHeightUnits;
        const heightRemaining = this.internalBottomRight.y - fromPoint.y;
        let height = Math.min(
            heightRemaining,
            maxRectSize.y,
            this.unitSize * rangeFloor(minHeightUnits, maxHeightUnits)
        );
        const heightLeftover = this.internalBottomRight.y - (fromPoint.y + height);
        if (heightLeftover < this.unitSize * minHeightUnits) {
            height += heightLeftover;
        }

        // Add the new rectangle, and add it to queues for neighboring rects as appropriate
        const freshRect = new Rect(fromPoint, width, height);
        this.rects.push(freshRect);
        this.quadtree.insert(fromPoint, freshRect);
        if (width != widthRemaining) {
            this.rightOpen.push(freshRect);
        }
        if (height != heightRemaining) {
            this.bottomOpen.push(freshRect);
        }

        // Return the new rect
        return freshRect;
    }

    maxRectSize(fromPoint, preferWidth = true) {
        // Find all possible rect intersections from quadtree
        const maxRectWidth = this.unitSize * this.maxWidthUnits;
        const maxRectHeight = this.unitSize * this.maxHeightUnits;
        const searchNW = new Point(
            fromPoint.x - maxRectWidth,
            fromPoint.y - maxRectHeight
        );
        const searchSE = new Point(
            fromPoint.x + maxRectWidth,
            fromPoint.y + maxRectHeight
        );
        const candidateRects = this.quadtree.search(searchNW, searchSE);

        // Calculate max width & height straight across & down
        let maxWidth = Infinity;
        let maxHeight = Infinity;
        let originInvalid = false;
        candidateRects.forEach((rect) => {
            const horizontalDistance = rect.x - fromPoint.x;
            const verticalDistance = rect.y - fromPoint.y;
            if ((horizontalDistance > 0) && (verticalDistance <= 0) && (rect.height >= -verticalDistance)) {
                maxWidth = Math.min(maxWidth, horizontalDistance);
            } else if ((verticalDistance > 0) && (horizontalDistance <= 0) && (rect.width >= -horizontalDistance)) {
                maxHeight = Math.min(maxHeight, verticalDistance);
            } else if ((verticalDistance <= 0) && (horizontalDistance <= 0) && 
                       (rect.height > -verticalDistance) && (rect.width > -horizontalDistance)) {
                originInvalid = true;
            }
        });

        // If any existing rectangles fully overlap with fromPoint, the origin is invalid
        if (originInvalid) return null;

        // Unless we're strictly building out our rectangles from the top left, the full
        // rect of size [maxWidth, maxHeight] may still overlap with others, so we prefer
        // width or height and find the maximum height/width from that point.
        candidateRects.forEach((rect) => {
            if (preferWidth) {
                const horizontalDistance = rect.x - maxWidth;
                const verticalDistance = rect.y - fromPoint.y;
                if ((verticalDistance > 0) && (horizontalDistance <= 0) && (rect.width >= -horizontalDistance)) {
                    maxHeight = Math.min(maxHeight, verticalDistance);
                }
            } else {
                const horizontalDistance = rect.x - fromPoint.x;
                const verticalDistance = rect.y - maxHeight;
                if ((horizontalDistance > 0) && (verticalDistance <= 0) && (rect.height >= -verticalDistance)) {
                    maxWidth = Math.min(maxWidth, horizontalDistance);
                }
            }
        });

        return new Point(maxWidth, maxHeight);
    }
}
