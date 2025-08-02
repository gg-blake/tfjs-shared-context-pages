//@ts-nocheck
import { initBuffers } from "./init-buffers";
import { drawScene } from "./draw-scene";
import { createTextureFrameBuffer } from "./debug";

export type ProgramInfo = {
    program: WebGLProgram;
    attribLocations: {
        vertexPosition: number;
        vertexColor: number;
    };
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation;
        modelViewMatrix: WebGLUniformLocation;
        tensorTexture: WebGLUniformLocation;
    };
}

let cubeRotation = 0.0;
let deltaTime = 0;

main();

//
// start here
//
//

function main() {
    const canvas: HTMLCanvasElement = document.querySelector("#glcanvas")!;
    // Initialize the GL context
    const gl = canvas.getContext("webgl2")!;

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert(
            "Unable to initialize WebGL. Your browser or machine may not support it.",
        );
        return;
    }

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Vertex shader program

    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

    // Fragment shader program

    const fsSource = `
    varying lowp vec4 vColor;
    precision highp float;
    //uniform sampler2D uTensorTexture;

    void main(void) {
        //vec4 sampledColor = texture2D(uTensorTexture, vec2(0.5, 0.5));
        gl_FragColor = vColor;
    }
  `;

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource)!;

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVertexColor and also
    // look up uniform locations.
    const programInfo: ProgramInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(
                shaderProgram,
                "aVertexPosition",
            ),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(
                shaderProgram,
                "uProjectionMatrix",
            )!,
            modelViewMatrix: gl.getUniformLocation(
                shaderProgram,
                "uModelViewMatrix",
            )!,
            tensorTexture: gl.getUniformLocation(
                shaderProgram,
                "uTensorTexture",
            )!,
        },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl);

    let then = 0;
    // Draw the scene repeatedly
    function render(now: number) {
        now *= 0.001; // convert to seconds
        deltaTime = now - then;
        then = now;

        //if (!texture) return;

        /*backend.uploadToGPU(tensor.dataId);
        tensor.dataToGPU({customTexShape: [1, 1]}); // Ensure new tensor is on GPU

        const textureData = backend.readToGPU(tensor.dataId);
        texture = textureData.texture;

        // Bind the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set texture parameters that might be needed
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        //gl.bindTexture(gl.TEXTURE_2D, null);

        gl.uniform1i(programInfo.uniformLocations.texture, 0);
        /*console.log("test");

        drawScene(gl, programInfo, buffers, cubeRotation, texture);
        tensor.dispose();
        */
        

        drawScene(gl, programInfo, buffers, cubeRotation);
        
        cubeRotation += deltaTime;
        //tensor.dispose();

        requestAnimationFrame(render);
    }

    async function initTF(canvas) {
        const customBackendName = "custom-webgl";

        const kernels = tf.getKernelsForBackend("webgl");
        kernels.forEach((kernelConfig) => {
            const newKernelConfig = {
                ...kernelConfig,
                backendName: customBackendName,
            };
            tf.registerKernel(newKernelConfig);
        });
        
        const customBackend = new tf.MathBackendWebGL(canvas);
        tf.registerBackend(customBackendName, () => customBackend);
        await tf.setBackend(customBackendName);
        
        //const applyMask = new MaskStep(gl);
        //let texture = createTextureFrameBuffer(gl, gl.LINEAR, 1, 1);
        
        
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        

        /*const backend = tf.backend();

        // Initialize tensor
        const tensor = tf.tensor([0.1, 0.8, 0.5, 1.0], [1, 4], "float32");

        backend.uploadToGPU(tensor.dataId); // Ensure new tensor is on GPU
        gl.bindTexture(gl.TEXTURE_2D, null);
        const textureData = backend.readToGPU(tensor.dataId);
        texture = textureData.texture;

        console.log("Before draw:");
        tensor.print();

        // Bind the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set texture parameters that might be needed
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        //gl.bindTexture(gl.TEXTURE_2D, null);

        gl.uniform1i(programInfo.uniformLocations.texture, 0);*/

        console.log(
            `The current shared backend has been set to: ${tf.getBackend()}`,
        );

        requestAnimationFrame(render);
    }

    initTF(canvas);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader!);
    gl.attachShader(shaderProgram, fragmentShader!);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(
            `Unable to initialize the shader program: ${gl.getProgramInfoLog(
                shaderProgram,
            )}`,
        );
        return null;
    }

    return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl: WebGL2RenderingContext, type: GLenum, source: string) {
    const shader = gl.createShader(type)!;

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(
            `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
        );
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}