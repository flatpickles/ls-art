export default class Util {
    /**
     * Return a CSS color string for any HSL value input
     * @param {Number} h Hue (0-1)
     * @param {Number} s Saturation (0-1)
     * @param {Number} l Lightness (0-1)
     * @returns {String} CSS formatted color string
     */
    static hsl(h, s, l) {
        h *= 360;
        s *= 100;
        l *= 100;
        return 'hsl(' + h.toString() + ', ' + s.toString() + '%, ' + l.toString() + '%)';
    }

    /**
     * Return a continuous triangle wave value for a time input
     * @param {Number} t Continuous time input
     * @returns {Number} Triangle value ranging 0-1
     */
    static triangle(t) {
        if (t % 2 < 1) {
            return t % 1;
        } else  {
            return 1 - (t % 1);
        }
    }
}
