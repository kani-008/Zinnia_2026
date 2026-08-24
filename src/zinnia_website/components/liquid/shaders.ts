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

  // 1. Smooth Gradient & Slope Calculation
  float hL = texture2D(uLiquidTexture, vUv - vec2(texel.x * 2.5, 0.0)).r;
  float hR = texture2D(uLiquidTexture, vUv + vec2(texel.x * 2.5, 0.0)).r;
  float hB = texture2D(uLiquidTexture, vUv - vec2(0.0, texel.y * 2.5)).r;
  float hT = texture2D(uLiquidTexture, vUv + vec2(0.0, texel.y * 2.5)).r;

  float dHdx = (hR - hL);
  float dHdy = (hT - hB);
  float slope = length(vec2(dHdx, dHdy));

  float normalStrength = 2.5;
  vec3 normal = normalize(vec3(-dHdx * normalStrength, -dHdy * normalStrength, 1.0));

  if (uDebugMode == 3) {
    gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
    return;
  }

  // 2. Optical Refraction (Pure Crystal Clear Snell's Law Distortion)
  vec3 incident = vec3(0.0, 0.0, -1.0);
  float eta = 1.0 / max(1.001, uIOR);
  vec3 refracted = refract(incident, normal, eta);

  // Smooth Gaussian blend factor for seamless transition
  float blendFactor = smoothstep(0.001, 0.6, height);
  vec2 deltaUv = refracted.xy * uRefractionStrength * blendFactor;

  // 3. Subtle Magnification (No dark or opaque centers)
  vec2 uvDistorted = vUv + deltaUv;
  float magAmount = (1.0 - 1.0 / uMagnification) * blendFactor;
  vec2 uvMagnified = mix(uvDistorted, uMouse, magAmount * 0.15);
  uvMagnified = clamp(uvMagnified, 0.001, 0.999);

  // 4. Chromatic Aberration (Natural RGB light dispersion along refraction)
  float chromOffset = uChromaticAberration * 0.012 * (length(deltaUv) * 8.0 + height * 0.3);
  vec2 uvR = uvMagnified + deltaUv * (1.0 + chromOffset * 2.5);
  vec2 uvG = uvMagnified;
  vec2 uvB = uvMagnified - deltaUv * (1.0 + chromOffset * 2.5);

  float colR = texture2D(uSceneTexture, clamp(uvR, 0.001, 0.999)).r;
  float colG = texture2D(uSceneTexture, clamp(uvG, 0.001, 0.999)).g;
  float colB = texture2D(uSceneTexture, clamp(uvB, 0.001, 0.999)).b;

  vec3 sceneColor = vec3(colR, colG, colB);

  // 5. Subtle Edge Glint (Active ONLY on steep wave slope, NEVER on flat center)
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  float ndotv = clamp(dot(normal, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - ndotv, uFresnelPower) * uFresnelStrength * smoothstep(0.01, 0.15, slope * 4.0);

  vec3 rimColor = mix(
    vec3(0.25, 0.85, 1.0),
    vec3(0.75, 0.35, 1.0),
    clamp(speed * 3.0, 0.0, 1.0)
  );

  // 6. Subtle Edge Specular (Only on wave slope curvature, zero in flat center)
  vec3 lightDir = normalize(vec3(-0.35, 0.65, 0.85));
  vec3 halfVec = normalize(lightDir + viewDir);
  float specAngle = max(dot(normal, halfVec), 0.0);
  float specular = pow(specAngle, 28.0) * uSpecularStrength * smoothstep(0.02, 0.2, slope * 5.0);
  specular *= clamp(1.0 + speed * 2.0, 1.0, 2.5);

  // 7. Pure 100% transparent composite - Seamless glass refraction
  vec3 finalColor = sceneColor + rimColor * (fresnel * 0.35) + vec3(specular * 0.25);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;
