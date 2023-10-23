precision highp float;
uniform mat4 model,projection,view;
uniform float time;
attribute vec3 position,normal;
varying vec3 color;
void main(){
    color=.5*(1.+normal);
    gl_Position=projection*view*model*vec4(position,1.);
    // gl_Position = projection * view * vec4(position * (1.0 + sin(time) / 5.0), 1.0);
}