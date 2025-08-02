// Returns a wrapper class with a framebuffer and output texture for it.
export function createTextureFrameBuffer(gl: WebGL2RenderingContext, filterMode: GLint, width: GLsizei, height: GLsizei) {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    const texture = createWebGLTexture(
        gl,
        gl.RGBA32F,
        gl.RGBA,
        gl.FLOAT,
        filterMode,
        null,
        width,
        height,
    );
    checkGlError(gl, "TextureFramebuffer::Create: create texture");

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0,
    );
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    if (status != gl.FRAMEBUFFER_COMPLETE) {
        throw new Error(`Bad framebuffer status:${status}`);
    }

    return new GlTextureFramebuffer(gl, framebuffer, texture, width, height);
}

export function readTextureData(gl: WebGL2RenderingContext, texture: WebGLTexture) {
    // Create framebuffer for texture copy
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0,
    );

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer not complete:", status);
        return;
    }

    // Read pixels from TensorFlow texture
    const pixels = new Float32Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixels);

    // Clean up
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);

    // Print data
    return pixels;
}

// Creates a WebGLTexture from pixel data.
export const createWebGLTexture = (
    gl: WebGL2RenderingContext,
    internalFormat: GLint,
    format: GLenum,
    type: GLenum,
    filterMode: GLint,
    pixelData: ArrayBufferView | null,
    width: GLsizei,
    height: GLsizei
) => {
    checkGlError(gl, "Before Texture::Create");

    const texture = gl.createTexture();
    
    // Set up the texture.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterMode);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterMode);

    // Create (and load if needed) texture.
    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        internalFormat,
        width,
        height,
        0,
        format,
        type,
        pixelData,
    );

    checkGlError(gl, "Texture::Create");
    return texture;
};



// A wrapper class for WebGL texture and its utility functions.
export class GlTextureImpl {
    gl_: WebGL2RenderingContext
    texture_: WebGLTexture
    width: GLsizei
    height: GLsizei
    
    constructor(gl: WebGL2RenderingContext, texture: WebGLTexture, width: number, height: number) {
        this.gl_ = gl;
        this.texture_ = texture;
        this.width = width;
        this.height = height;
    }

    bindTexture() {
        this.gl_.bindTexture(this.gl_.TEXTURE_2D, this.texture_);
    }
}

// A wrapper class for WebGL texture and its associted framebuffer and utility functions.
export class GlTextureFramebuffer extends GlTextureImpl {
    framebuffer_: WebGLFramebuffer
    
    constructor(gl: WebGL2RenderingContext, framebuffer: WebGLFramebuffer, texture: WebGLTexture, width: number, height: number) {
        super(gl, texture, width, height);
        this.framebuffer_ = framebuffer;
    }

    bindFramebuffer() {
        this.gl_.bindFramebuffer(this.gl_.FRAMEBUFFER, this.framebuffer_);
        this.gl_.viewport(0, 0, this.width, this.height);
    }
}

export const checkGlError = (gl: WebGL2RenderingContext, label: string, allowFail = false) => {
    let err = gl.getError();
    let foundError = false;
  
    while (err != gl.NO_ERROR) {
      let error;
  
      switch (err) {
        case gl.INVALID_OPERATION:
          error = 'INVALID_OPERATION';
          break;
        case gl.INVALID_ENUM:
          error = 'INVALID_ENUM';
          break;
        case gl.INVALID_VALUE:
          error = 'INVALID_VALUE';
          break;
        case gl.OUT_OF_MEMORY:
          error = 'OUT_OF_MEMORY';
          break;
        case gl.INVALID_FRAMEBUFFER_OPERATION:
          error = 'INVALID_FRAMEBUFFER_OPERATION';
          break;
      }
      // When debugging or running tests, this is a fatal, non-recoverable
      // error. Otherwise program can resume operation.
      if (!allowFail) {
        throw new Error(`GL error: ${error} ${label}`);
      }
      console.error(`GL error: GL_${error}: ${label}`);
      err = gl.getError();
  
      foundError = true;
    }
    return foundError;
};