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
  vec4 current = texture2D(uBufferTexture, vUv);

  // 1. Isotropic 9-point Laplacian for smooth circular wave propagation
  float nLeft   = texture2D(uBufferTexture, vUv - vec2(texel.x, 0.0)).r;
  float nRight  = texture2D(uBufferTexture, vUv + vec2(texel.x, 0.0)).r;
  float nTop    = texture2D(uBufferTexture, vUv + vec2(0.0, texel.y)).r;
  float nBottom = texture2D(uBufferTexture, vUv - vec2(0.0, texel.y)).r;

  float nTL = texture2D(uBufferTexture, vUv + vec2(-texel.x,  texel.y)).r;
  float nTR = texture2D(uBufferTexture, vUv + vec2( texel.x,  texel.y)).r;
  float nBL = texture2D(uBufferTexture, vUv + vec2(-texel.x, -texel.y)).r;
  float nBR = texture2D(uBufferTexture, vUv + vec2( texel.x, -texel.y)).r;

  // Discrete Laplacian operator (Laplace-Beltrami on grid)
  float laplacian = ((nLeft + nRight + nTop + nBottom) * 0.5 + (nTL + nTR + nBL + nBR) * 0.25) - 3.0 * current.r;

  // 2. Physical 2D Wave Propagation Equation: dv/dt = c^2 * Laplacian
  float waveSpeed = 0.48;
  float newVelocity = (current.g + laplacian * waveSpeed) * uDecay;

  // 3. Pointer Force Injection with Smooth Gaussian Falloff
  vec2 aspectVec = vec2(uAspect, 1.0);
  vec2 mouseUv = uMouse * aspectVec;
  vec2 pixelUv = vUv * aspectVec;
  vec2 mouseVel = uMouseVelocity * aspectVec;
  
  float speed = length(mouseVel);
  
  // Motion direction stretching
  vec2 dirToPixel = pixelUv - mouseUv;
  vec2 normVel = speed > 0.0001 ? normalize(mouseVel) : vec2(0.0);
  
  float parallelDist = dot(dirToPixel, normVel);
  vec2 perpComponent = dirToPixel - normVel * parallelDist;
  
  float stretchFactor = 1.0 + clamp(speed * uVelocityStretch * 6.0, 0.0, 2.0);
  float scaledDistSq = (parallelDist * parallelDist) / (stretchFactor * stretchFactor) + dot(perpComponent, perpComponent);
  
  float radiusVal = max(0.001, uRadius);
  float normDist = sqrt(scaledDistSq) / radiusVal;
  
  // Continuous C2 Gaussian bell curve with no hard cutoff
  float forceShape = exp(-2.2 * normDist * normDist) * smoothstep(3.0, 0.0, normDist);
  
  // Inject ripple velocity impulse whenever pointer is moving or gently active
  float impulse = forceShape * (speed * uForce * 16.0 + (speed > 0.0002 ? 0.04 * uForce : 0.0));
  newVelocity += impulse;

  // 4. Update Height: dh/dt = velocity
  float newHeight = (current.r + newVelocity) * uDecay;

  // Damping bounds
  newVelocity = clamp(newVelocity, -1.5, 1.5);
  newHeight = clamp(newHeight, -1.8, 1.8);

  gl_FragColor = vec4(newHeight, newVelocity, 0.0, 1.0);
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

  // Sample Liquid Height
  float height = texture2D(uLiquidTexture, vUv).r;

  if (uDebugMode == 2) {
    gl_FragColor = vec4(vec3(abs(height)), 1.0);
    return;
  }

  // 1. Multi-tier smooth gradient filter for ripples
  float o1 = 1.8;
  float o2 = 3.6;
  
  float hL1 = texture2D(uLiquidTexture, vUv - vec2(texel.x * o1, 0.0)).r;
  float hR1 = texture2D(uLiquidTexture, vUv + vec2(texel.x * o1, 0.0)).r;
  float hT1 = texture2D(uLiquidTexture, vUv + vec2(0.0, texel.y * o1)).r;
  float hB1 = texture2D(uLiquidTexture, vUv - vec2(0.0, texel.y * o1)).r;

  float hL2 = texture2D(uLiquidTexture, vUv - vec2(texel.x * o2, 0.0)).r;
  float hR2 = texture2D(uLiquidTexture, vUv + vec2(texel.x * o2, 0.0)).r;
  float hT2 = texture2D(uLiquidTexture, vUv + vec2(0.0, texel.y * o2)).r;
  float hB2 = texture2D(uLiquidTexture, vUv - vec2(0.0, texel.y * o2)).r;

  float dHdx = ((hR1 - hL1) * 0.6 + (hR2 - hL2) * 0.3) * 0.5;
  float dHdy = ((hT1 - hB1) * 0.6 + (hT2 - hB2) * 0.3) * 0.5;

  if (uDebugMode == 3) {
    vec3 norm = normalize(vec3(-dHdx * 4.0, -dHdy * 4.0, 1.0));
    gl_FragColor = vec4(norm * 0.5 + 0.5, 1.0);
    return;
  }

  // 2. Continuous Optical Refraction for Water Ripples
  vec2 distortion = vec2(-dHdx, -dHdy) * (uRefractionStrength * 1.6);

  // 3. Chromatic Dispersion along ripple crests
  float chromScale = uChromaticAberration * 0.20;
  vec2 uvR = vUv + distortion * (1.0 + chromScale);
  vec2 uvG = vUv + distortion;
  vec2 uvB = vUv + distortion * (1.0 - chromScale);

  float colR = texture2D(uSceneTexture, clamp(uvR, 0.001, 0.999)).r;
  float colG = texture2D(uSceneTexture, clamp(uvG, 0.001, 0.999)).g;
  float colB = texture2D(uSceneTexture, clamp(uvB, 0.001, 0.999)).b;

  vec3 sceneColor = vec3(colR, colG, colB);

  // 4. Subtle Gleaming Specular & Fresnel on Ripple Crests
  vec3 normal = normalize(vec3(-dHdx * 3.5, -dHdy * 3.5, 1.0));
  vec3 lightDir = normalize(vec3(-0.35, 0.55, 0.75));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfVec = normalize(lightDir + viewDir);

  float spec = pow(max(0.0, dot(normal, halfVec)), 28.0) * uSpecularStrength * smoothstep(0.01, 0.15, abs(height));
  float fresnel = pow(1.0 - max(0.0, normal.z), 3.0) * uFresnelStrength * smoothstep(0.01, 0.15, abs(height));

  vec3 finalColor = sceneColor + vec3(spec * 0.8 + fresnel * 0.3);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;
