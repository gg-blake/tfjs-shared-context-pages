function initBuffers(gl) {
    const positionBuffer = initPositionBuffer(gl);
    const colorBuffer = initColorBuffer(gl);
    const indexBuffer = initIndexBuffer(gl);
    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer
    };
}

function initPositionBuffer(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [ -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1 ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return positionBuffer;
}

function initColorBuffer(gl) {
    const faceColors = [ [ 1, 1, 1, 1 ], [ 1, 0, 0, 1 ], [ 0, 1, 0, 1 ], [ 0, 0, 1, 1 ], [ 1, 1, 0, 1 ], [ 1, 0, 1, 1 ] ];
    var colors = [];
    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
    }
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    return colorBuffer;
}

function initIndexBuffer(gl) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = [ 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return indexBuffer;
}

function drawScene(gl, programInfo, buffers, cubeRotation) {
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const fieldOfView = 45 * Math.PI / 180;
    const canvasWidth = gl.canvas.clientWidth;
    const canvasHeight = gl.canvas.clientHeight;
    const aspect = canvasWidth / canvasHeight;
    const zNear = .1;
    const zFar = 100;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [ -0, 0, -6 ]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [ 0, 0, 1 ]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * .7, [ 0, 1, 0 ]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * .3, [ 1, 0, 0 ]);
    setPositionAttribute(gl, buffers, programInfo);
    setColorAttribute(gl, buffers, programInfo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

function setPositionAttribute(gl, buffers, programInfo) {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

function setColorAttribute(gl, buffers, programInfo) {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, numComponents, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

let cubeRotation = 0;

let deltaTime = 0;

main();

function main() {
    const canvas = document.querySelector("#glcanvas");
    const gl = canvas.getContext("webgl2");
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const vsSource = `\n    attribute vec4 aVertexPosition;\n    attribute vec4 aVertexColor;\n\n    uniform mat4 uModelViewMatrix;\n    uniform mat4 uProjectionMatrix;\n\n    varying lowp vec4 vColor;\n\n    void main(void) {\n      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;\n      vColor = aVertexColor;\n    }\n  `;
    const fsSource = `\n    varying lowp vec4 vColor;\n    precision highp float;\n    //uniform sampler2D uTensorTexture;\n\n    void main(void) {\n        //vec4 sampledColor = texture2D(uTensorTexture, vec2(0.5, 0.5));\n        gl_FragColor = vColor;\n    }\n  `;
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
            tensorTexture: gl.getUniformLocation(shaderProgram, "uTensorTexture")
        }
    };
    const buffers = initBuffers(gl);
    let then = 0;
    function render(now) {
        now *= .001;
        deltaTime = now - then;
        then = now;
        drawScene(gl, programInfo, buffers, cubeRotation);
        cubeRotation += deltaTime;
        requestAnimationFrame(render);
    }
    async function initTF(canvas) {
        const customBackendName = "custom-webgl";
        const kernels = tf.getKernelsForBackend("webgl");
        kernels.forEach(kernelConfig => {
            const newKernelConfig = {
                ...kernelConfig,
                backendName: customBackendName
            };
            tf.registerKernel(newKernelConfig);
        });
        const customBackend = new tf.MathBackendWebGL(canvas);
        tf.registerBackend(customBackendName, () => customBackend);
        await tf.setBackend(customBackendName);
        console.log(`The current shared backend has been set to: ${tf.getBackend()}`);
        requestAnimationFrame(render);
    }
    initTF(canvas);
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
