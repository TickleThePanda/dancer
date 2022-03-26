let raf = -1;

/** 
 * 
 * Hook up visualistion element
 * 
 * @argument {AudioContext} context  
 * @returns {AnalyserNode} node
 * */
export const createViewer = (context) => {
    const node = new AnalyserNode(context)

    const frequencies = new Uint8Array(node.frequencyBinCount)

    const canvas = document.querySelector('canvas.js-viewer')
    const ctx = canvas.getContext('2d')
    const { width, height } = canvas

    const xstep = width / frequencies.length
    const ystep = height / 255

    function update() {
        if (context.state !== 'running') return;

        node.getByteFrequencyData(frequencies)

        ctx.fillStyle = '#ccc'
        ctx.strokeStyle = '#444'

        ctx.fillRect(0, 0, width, height)

        ctx.beginPath()
        frequencies.forEach((value, i) => {
            ctx.lineTo(i * xstep, height - (value * ystep))
        })
        ctx.stroke()

        raf = requestAnimationFrame(update)
    }

    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(update)

    return node;
}

/*

import * as twgl from 'https://cdn.skypack.dev/twgl.js';

const vs = `
attribute vec4 position;

void main() {
  gl_Position = position;
}`

const fs = `
precision mediump float;

uniform vec2 resolution;
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float color = 0.0;
  // lifted from glslsandbox.com
  color += sin( uv.x * cos( time / 3.0 ) * 60.0 ) + cos( uv.y * cos( time / 2.80 ) * 10.0 );
  color += sin( uv.y * sin( time / 2.0 ) * 40.0 ) + cos( uv.x * sin( time / 1.70 ) * 40.0 );
  color += sin( uv.x * sin( time / 1.0 ) * 10.0 ) + sin( uv.y * sin( time / 3.50 ) * 80.0 );
  color *= sin( time / 10.0 ) * 0.5;

  gl_FragColor = vec4( vec3( color * 0.5, sin( color + time / 2.5 ) * 0.75, color ), 1.0 );
}
`


  const gl = canvas.getContext('webgl')

    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const textures = twgl.createTextures(gl, {
        frequencies: {
            mag: gl.NEAREST,
            min: gl.LINEAR,
            src: frequencies,
        },
    })
    console.log(textures)

    const arrays = {
        position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        const uniforms = {
            time: time * 0.001,
            resolution: [gl.canvas.width, gl.canvas.height],
        };

        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo);

        // twgl.setAttribInfoBufferFromArray(gl, bufferInfo.attribs.a_height, heightArray);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);




*/