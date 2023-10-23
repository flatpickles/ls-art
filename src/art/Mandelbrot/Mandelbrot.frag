precision highp float;

uniform float time;
uniform vec2 renderSize;

uniform float zoom; // 0.07, "Zoom"
uniform vec2 renderOffset; // [-0.7, 0.0], "Position", -1 to 1, step 0.001
uniform float colorCycles; // 42, "Cycles", 1 to 100, step 1

varying vec2 uv;

const float PI = 3.1415926535897932384626433832795;
const int interationSize = 300;
const vec2 zoomBounds = vec2(-1.0, 12.0);
const float timeMultiplier = -18.0;

vec3 hsv(float h, float s, float v) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
    return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}

// References:
// - https://en.wikibooks.org/wiki/Fractals/shadertoy#Mandelbrot_set
// - https://www.codingame.com/playgrounds/2358/how-to-plot-the-mandelbrot-set/adding-some-colors
float mandelbrot(vec2 c) {
    vec2 z = vec2(0.0);
    int escapeTime = 0;
    float sqrZ = 0.0;
    for (int i = 0; i < interationSize; i++) {
        sqrZ = z.x * z.x + z.y * z.y;
        if (sqrZ >= 4.) break;
        z = vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y) + c;
        escapeTime += 1;
    }

    if (escapeTime == interationSize) {
        return float(interationSize);
    } else {
        return float(escapeTime) + 1.0 - log(log2(sqrt(sqrZ)));
    }
}

void main() {
    vec2 c = uv;

    // Normalize coordinates
    c = c * 2. - 1.0;
    c.x *= renderSize.x / renderSize.y;

    // Zoom in
    float zoomGenerator = zoom;
    float zoomLevel = (zoomBounds.y - zoomBounds.x) * zoomGenerator + zoomBounds.x;
    c = c / pow(2.0, zoomLevel);
    c += renderOffset;

    // Calculate Mandelbrot color
    float escapeTime = mandelbrot(c);
    float escapeModulator = float(interationSize) / colorCycles;
    vec3 color = hsv(mod(escapeTime, escapeModulator) / escapeModulator + time / timeMultiplier, 1.0, 0.95);
    if (escapeTime == float(interationSize)) gl_FragColor = vec4(vec3(0.0), 1.0);
    else gl_FragColor = vec4(color, 1.0);
}
