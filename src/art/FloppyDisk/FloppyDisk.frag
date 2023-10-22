precision highp float;

uniform float scaledTime;
uniform vec2 renderSize;

uniform float innerSize; // 0.3, "Inner Size"
uniform float outerSize; // 0.8, "Outer Size"
uniform float wobbleShape1; // 5.0, "Shape 1", 3 to 10, step 1
uniform float wobbleFactor1; // 0.02, "Factor 1", 0 to 0.2
uniform float wobbleShape2; // 8.0, "Shape 2", 3 to 10, step 1
uniform float wobbleFactor2; // 0.02, "Factor 2", 0 to 0.2
uniform vec3 centerColor; // #431F0E, "Center Color"
uniform vec3 color1; // #CC8154, "Color 1"
uniform vec3 color2; // #96542E, "Color 2"
uniform vec3 color3; // #622E0F, "Color 3"
uniform vec3 backgroundColor; // #431F0E, "BG Color"

varying vec2 uv;

const float smoothing = 0.005;
const int layerCount = 12;
const int colorCount = 3;
const float wobbleMotion1 = 1.0;
const float wobbleMotion2 = -1.0;

float incrementalMask(float r, float theta, float threshold) {
    float borderOffset1 = sin(theta * floor(wobbleShape1) + wobbleMotion1 * scaledTime) * wobbleFactor1;
    float borderOffset2 = sin(theta * floor(wobbleShape2) + wobbleMotion2 * scaledTime) * wobbleFactor2;
    float border = threshold + borderOffset1 + borderOffset2;
    return smoothstep(border + smoothing / 2., border - smoothing / 2., r);
}

vec4 blend(vec4 top, vec4 bottom) {
    return vec4(mix(bottom.rgb, top.rgb, top.a), bottom.a);
}

void main()	{
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 uv = uv;
	uv = uv * 2.0 - 1.;
	uv.x *= aspectRatio;

    float r = sqrt(uv.x * uv.x + uv.y * uv.y);
    float theta = atan(uv.y, uv.x);

    vec4 color = vec4(backgroundColor, 1.0);
    for (int layer = layerCount; layer >= 0; layer -= 1) {
        float layerSize = (outerSize - innerSize) / float(layerCount);
        float mask = incrementalMask(r, theta, float(layer) * layerSize + innerSize);
        int layerDegree = int(mod(float(layer), float(colorCount)));
        vec3 currentColor = (layerDegree == 0) ? color3.rgb : ((layerDegree == 1) ? color1.rgb : color2.rgb);
        currentColor = (layer == 0) ? centerColor.rgb : currentColor;
        color = blend(vec4(currentColor, mask), color);
    }
	
	gl_FragColor = color;
}
