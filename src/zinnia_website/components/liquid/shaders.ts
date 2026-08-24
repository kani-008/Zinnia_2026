export const simVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const simFragmentShader = `
uniform sampler2D uBufferTexture;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec2 uPrevMouse;
uniform vec2 uMouseVelocity;
uniform float uRadius;
uniform float uForce;
uniform float uViscosity;
uniform float uDecay;
uniform float uAspect;
uniform float uVelocityStretch;

varying vec2 vUv;

void main() {
  vec2 texel = 1.0 / uResolution;
  
  // 1. Advection: Sample previous state offset by velocity field
  vec4 current = texture2D(uBufferTexture, vUv);
  vec2 vel = current.gb;
  vec2 advectedUv = vUv - vel * texel * 2.0;
  vec4 advected = texture2D(uBufferTexture, advectedUv);

  // 2. Laplacian Diffusion (Smooth wave propagation & viscosity)
  vec4 left  = texture2D(uBufferTexture, vUv - vec2(texel.x, 0.0));
  vec4 right = texture2D(uBufferTexture, vUv + vec2(texel.x, 0.0));
  vec4 top   = texture2D(uBufferTexture, vUv + vec2(0.0, texel.y));
  vec4 bottom= texture2D(uBufferTexture, vUv - vec2(0.0, texel.y));
  
  vec4 avg = (left + right + top + bottom) * 0.25;
  vec4 diffused = mix(advected, avg, clamp(uViscosity, 0.0, 0.95));

  // 3. Pointer Force Injection with Smooth Gaussian Falloff
  vec2 aspectVec = vec2(uAspect, 1.0);
  vec2 mouseUv = uMouse * aspectVec;
  vec2 pixelUv = vUv * aspectVec;
  vec2 mouseVel = uMouseVelocity * aspectVec;
  
  float speed = length(mouseVel);
  
  // Directional motion stretching
  vec2 dirToPixel = pixelUv - mouseUv;
  vec2 normVel = speed > 0.0001 ? normalize(mouseVel) : vec2(0.0);
  
  float parallelDist = dot(dirToPixel, normVel);
  vec2 perpComponent = dirToPixel - normVel * parallelDist;
  
  float stretchFactor = 1.0 + clamp(speed * uVelocityStretch * 10.0, 0.0, 3.0);
  float scaledDistSq = (parallelDist * parallelDist) / (stretchFactor * stretchFactor) + dot(perpComponent, perpComponent);
  
  float radiusVal = max(0.001, uRadius);
  float normDist = sqrt(scaledDistSq) / radiusVal;
  
  // Pure Gaussian bell curve with no hard cutoff
  float forceShape = exp(-2.8 * normDist * normDist);
  
  // Inject fluid motion
  vec2 injectedVel = mouseVel * uForce * forceShape * 8.0;
  float injectedHeight = forceShape * (speed * uForce * 6.0 + 0.08 * uForce);

  // 4. Combine Advected/Diffused State with Injected Force
  vec2 newVel = (diffused.gb + injectedVel) * uDecay;
  float newHeight = (diffused.r + injectedHeight) * uDecay;

  // Elastic damping & clamping
  newVel = clamp(newVel, -3.0, 3.0);
  newHeight = clamp(newHeight, 0.0, 2.0);

  gl_FragColor = vec4(newHeight, newVel.x, newVel.y, 1.0);
}
`;

export const liquidVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const liquidFragmentShader = `
uniform sampler2D uSceneTexture;
uniform sampler2D uLiquidTexture;
uniform vec2 uResolution;
uniform vec2 uMouse;

// Optical Uniforms
uniform float uRefractionStrength;
uniform float uIOR;
uniform float uMagnification;
uniform float uChromaticAberration;
uniform float uFresnelPower;
uniform float uFresnelStrength;
uniform float uSpecularStrength;
uniform float uDarkGlossy;

// Debug Uniforms
uniform int uDebugMode;

varying vec2 vUv;

void main() {
  vec2 texel = 1.0 / uResolution;

  if (uDebugMode == 1) {
    gl_FragColor = texture2D(uSceneTexture, vUv);
    return;
  }

  // Sample Liquid Simulation Target (R = Height, GB = Velocity)
  vec4 liquidState = texture2D(uLiquidTexture, vUv);
  float height = liquidState.r;
  vec2 velocity = liquidState.gb;
  float speed = length(velocity);

  if (uDebugMode == 2) {
    vec3 fieldCol = vec3(height, abs(velocity.x) * 0.5, abs(velocity.y) * 0.5);
    gl_FragColor = vec4(fieldCol, 1.0);
    return;
  }

  // 1. Ultra-smooth 8-tap Sobel Gradient Filter for continuous C^inf liquid wave curvature
  float h00 = texture2D(uLiquidTexture, vUv + vec2(-texel.x, -texel.y) * 2.5).r;
  float h10 = texture2D(uLiquidTexture, vUv + vec2(0.0,      -texel.y) * 2.5).r;
  float h20 = texture2D(uLiquidTexture, vUv + vec2( texel.x, -texel.y) * 2.5).r;
  float h01 = texture2D(uLiquidTexture, vUv + vec2(-texel.x,  0.0)      * 2.5).r;
  float h21 = texture2D(uLiquidTexture, vUv + vec2( texel.x,  0.0)      * 2.5).r;
  float h02 = texture2D(uLiquidTexture, vUv + vec2(-texel.x,  texel.y) * 2.5).r;
  float h12 = texture2D(uLiquidTexture, vUv + vec2(0.0,       texel.y) * 2.5).r;
  float h22 = texture2D(uLiquidTexture, vUv + vec2( texel.x,  texel.y) * 2.5).r;

  float dHdx = ((h20 + 2.0 * h21 + h22) - (h00 + 2.0 * h01 + h02)) * 0.25;
  float dHdy = ((h02 + 2.0 * h12 + h22) - (h00 + 2.0 * h10 + h20)) * 0.25;

  if (uDebugMode == 3) {
    vec3 norm = normalize(vec3(-dHdx * 3.0, -dHdy * 3.0, 1.0));
    gl_FragColor = vec4(norm * 0.5 + 0.5, 1.0);
    return;
  }

  // 2. Pure Continuous Optical Refraction (No sharp rings, no cutoff discs)
  vec2 distortion = vec2(-dHdx, -dHdy) * (uRefractionStrength * 1.8);

  // 3. Smooth Chromatic Dispersion along fluid flow
  float chromScale = uChromaticAberration * 0.35;
  vec2 uvR = vUv + distortion * (1.0 + chromScale);
  vec2 uvG = vUv + distortion;
  vec2 uvB = vUv + distortion * (1.0 - chromScale);

  float colR = texture2D(uSceneTexture, clamp(uvR, 0.001, 0.999)).r;
  float colG = texture2D(uSceneTexture, clamp(uvG, 0.001, 0.999)).g;
  float colB = texture2D(uSceneTexture, clamp(uvB, 0.001, 0.999)).b;

  vec3 sceneColor = vec3(colR, colG, colB);

  // Final 100% seamlessly blended crystal clear liquid
  gl_FragColor = vec4(sceneColor, 1.0);
}
`;
