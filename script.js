const canvas = document.getElementById("demo-canvas");
const uboOffsetInput = document.getElementById("demo-ubo-offset");
const uboAlignSpan = document.getElementById("demo-ubo-align");

const gl = canvas.getContext("webgl2");

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
  }
  return shader;
}

function compileProgram(vsSource, fsSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
  }
  return program;
}

const vs = `#version 300 es
precision mediump float;

void main() {
  vec2 uv = vec2(ivec2(gl_VertexID % 2, gl_VertexID / 2));
  gl_Position = vec4(uv.x * 2.0 - 1.0, uv.y * -2.0 + 1.0, 0.5, 1.0);
}
`;

const fs = `#version 300 es
precision mediump float;

out vec4 o_Color;

uniform Block {
  vec4 u_Color;
};

void main() {
  o_Color = u_Color;
}
`;

// Compile our demo program, it should just render a full-screen
// triangle with a single color specified in the fragment shader
// UBO called "Block" at index 0 with binding 0.
const program = compileProgram(vs, fs);
const uboIndex = gl.getUniformBlockIndex(program, "Block");
gl.uniformBlockBinding(program, uboIndex, 0);

// Create an empty buffer to sub-allocate the uniform blocks from.
const uniformBuffer = gl.createBuffer();
gl.bindBuffer(gl.UNIFORM_BUFFER, uniformBuffer);
gl.bufferData(gl.UNIFORM_BUFFER, 0x100000, gl.DYNAMIC_DRAW);

const uboAlign = gl.getParameter(gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT);

// Upload `uniformData` to the shared uniform buffer at offset
// `uniformOffset` and draw a non-indexed triangle with vertices
// `[vertexOffset, vertexOffset+1, vertexOffset+2]`.
function drawTriangle(vertexOffset, uniformOffset, uniformData) {
  gl.useProgram(program);
  gl.bindBuffer(gl.UNIFORM_BUFFER, uniformBuffer);
  gl.bufferSubData(gl.UNIFORM_BUFFER, uniformOffset, uniformData);
  gl.bindBufferRange(gl.UNIFORM_BUFFER, 0, uniformBuffer, uniformOffset, 16);
  gl.drawArrays(gl.TRIANGLES, vertexOffset, 3);
}

function updateAlignText() {
  const uboOffset = parseInt(uboOffsetInput.value);
  let alignText = `, must be aligned to ${uboAlign} (0x${uboAlign.toString(16)}) bytes`
  if (uboOffset % uboAlign != 0) {
    alignText += " !! UNALIGNED !!";
    uboAlignSpan.classList.add("error");
  } else {
    uboAlignSpan.classList.remove("error");
  }
  uboAlignSpan.innerText = alignText;
}

function render() {
  const uboOffset = parseInt(uboOffsetInput.value);

  // Clear the background to red
  gl.clearColor(1.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw a green triangle using uniform offset 0
  drawTriangle(0, 0x0000, new Float32Array([0.0, 1.0, 0.0, 1.0]));

  // Draw a blue triangle at the offset requested by the user
  drawTriangle(1, uboOffset, new Float32Array([0.0, 0.0, 1.0, 1.0]));

  requestAnimationFrame(render);
}

uboOffsetInput.addEventListener("input", updateAlignText);

updateAlignText();
render();
