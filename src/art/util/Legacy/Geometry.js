// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

export class Point {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    eq(point) {
        return this.x == point.x && this.y == point.y;
    }

    gt(point) {
        return this.x > point.x && this.y > point.y;
    }

    gte(point) {
        return this.x >= point.x && this.y >= point.y;
    }

    lt(point) {
        return this.x < point.x && this.y < point.y;
    }

    lte(point) {
        return this.x <= point.x && this.y <= point.y;
    }

    add(p1, p2) {
        if (p1 instanceof Point) {
            return new Point(
                this.x + p1.x,
                this.y + p1.y
            );
        } else {
            return new Point(
                this.x + p1,
                this.y + (p2  ?? p1)
            );
        }
    }

    sub(p1, p2) {
        if (p1 instanceof Point) {
            return new Point(
                this.x - p1.x,
                this.y - p1.y
            );
        } else {
            return new Point(
                this.x - p1,
                this.y - (p2 ?? p1)
            );
        }
    }

    mult(p1, p2) {
        if (p1 instanceof Point) {
            return new Point(
                this.x * p1.x,
                this.y * p1.y
            );
        } else {
            return new Point(
                this.x * p1,
                this.y * (p2 ?? p1)
            );
        }
    }

    div(p1, p2) {
        if (p1 instanceof Point) {
            return new Point(
                this.x / p1.x,
                this.y / p1.y
            );
        } else {
            return new Point(
                this.x / p1,
                this.y / (p2 ?? p1)
            );
        }
    }

    toString() {
        return '(' + this.x.toString() + ', ' + this.y.toString() + ')';
    }
}

export class Rect {
    constructor(origin = new Point(), width = 0, height = 0) {
        this.origin = origin;
        this.width = width;
        this.height = height;
    }

    get x() { return this.origin.x; }
    set x(newX) { this.origin.x = newX; }
    get y() { return this.origin.y; }
    set y(newY) { this.origin.y = newY; }

    get topLeft() { return this.origin; }
    get topRight() { return this.origin.add(this.width, 0); }
    get bottomLeft() { return this.origin.add(0, this.height); }
    get bottomRight() { return this.origin.add(this.width, this.height); }

    scale(scaleFactorX, scaleFactorY) {
        scaleFactorY = scaleFactorY ?? scaleFactorX; // allow single input
        return new Rect(
            this.origin.mult(new Point(scaleFactorX, scaleFactorY)),
            this.width * scaleFactorX,
            this.height * scaleFactorY
        );
    }
}
