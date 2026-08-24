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

  // 3. Pointer Force Injection with Smooth Gaussian-Hermite Blending
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
  
  float stretchFactor = 1.0 + clamp(speed * uVelocityStretch * 12.0, 0.0, 3.5);
  float scaledDistSq = (parallelDist * parallelDist) / (stretchFactor * stretchFactor) + dot(perpComponent, perpComponent);
  
  float radiusSq = max(0.0001, uRadius * uRadius);
  float normDist = sqrt(scaledDistSq) / max(0.001, uRadius);
  
  // Smooth bell curve falloff for seamless blending into fluid surface
  float forceShape = exp(-2.5 * normDist * normDist) * smoothstep(1.8, 0.0, normDist);
  
  // Inject responsive force
  vec2 injectedVel = mouseVel * uForce * forceShape * 10.0;
  float injectedHeight = forceShape * (speed * uForce * 8.0 + 0.15 * uForce);

  // 4. Combine Advected/Diffused State with Injected Force
  vec2 newVel = (diffused.gb + injectedVel) * uDecay;
  float newHeight = (diffused.r + injectedHeight) * uDecay;

  // Elastic damping & clamping
  newVel = clamp(newVel, -4.0, 4.0);
  newHeight = clamp(newHeight, 0.0, 2.5);

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

  // 1. Smooth Multi-tap Surface Normal Calculation
  float hL = texture2D(uLiquidTexture, vUv - vec2(texel.x * 2.5, 0.0)).r;
  float hR = texture2D(uLiquidTexture, vUv + vec2(texel.x * 2.5, 0.0)).r;
  float hB = texture2D(uLiquidTexture, vUv - vec2(0.0, texel.y * 2.5)).r;
  float hT = texture2D(uLiquidTexture, vUv + vec2(0.0, texel.y * 2.5)).r;

  float dHdx = (hR - hL);
  float dHdy = (hT - hB);

  float normalStrength = 2.8;
  vec3 normal = normalize(vec3(-dHdx * normalStrength, -dHdy * normalStrength, 1.0));

  if (uDebugMode == 3) {
    gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
    return;
  }

  // 2. Optical Refraction with Smooth Edge Transition
  vec3 incident = vec3(0.0, 0.0, -1.0);
  float eta = 1.0 / max(1.001, uIOR);
  vec3 refracted = refract(incident, normal, eta);

  // Smooth blending transition at boundary so liquid merges naturally with background
  float blendFactor = smoothstep(0.005, 0.6, height);
  vec2 deltaUv = refracted.xy * uRefractionStrength * blendFactor;

  // 3. Smooth localized magnification
  vec2 uvDistorted = vUv + deltaUv;
  float magAmount = (1.0 - 1.0 / uMagnification) * blendFactor;
  vec2 uvMagnified = mix(uvDistorted, uMouse, magAmount * 0.25);
  uvMagnified = clamp(uvMagnified, 0.001, 0.999);

  // 4. Chromatic Aberration (Natural RGB light dispersion)
  float chromOffset = uChromaticAberration * 0.02 * (length(deltaUv) * 12.0 + height);
  vec2 uvR = uvMagnified + deltaUv * (1.0 + chromOffset * 3.5);
  vec2 uvG = uvMagnified;
  vec2 uvB = uvMagnified - deltaUv * (1.0 + chromOffset * 3.5);

  float colR = texture2D(uSceneTexture, clamp(uvR, 0.001, 0.999)).r;
  float colG = texture2D(uSceneTexture, clamp(uvG, 0.001, 0.999)).g;
  float colB = texture2D(uSceneTexture, clamp(uvB, 0.001, 0.999)).b;

  vec3 sceneColor = vec3(colR, colG, colB);

  // 5. Fresnel Iridescent Edge Rim (Softly blended into fluid contour)
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  float ndotv = clamp(dot(normal, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - ndotv, uFresnelPower) * uFresnelStrength * smoothstep(0.02, 0.3, height);

  vec3 rimColor = mix(
    vec3(0.65, 0.92, 1.0),
    vec3(0.35, 0.65, 1.0),
    sin(height * 6.0) * 0.5 + 0.5
  );
  rimColor = mix(rimColor, vec3(0.85, 0.45, 1.0), clamp(speed * 3.5, 0.0, 1.0));

  // 6. Specular Highlight (Natural soft shine)
  vec3 lightDir = normalize(vec3(-0.35, 0.65, 1.0));
  vec3 halfVec = normalize(lightDir + viewDir);
  float specAngle = max(dot(normal, halfVec), 0.0);
  float specular = pow(specAngle, 22.0) * uSpecularStrength * smoothstep(0.04, 0.3, height);
  specular *= (1.0 + speed * 4.0);

  // 7. Pure seamless blending without harsh dark rings
  float darkTint = mix(1.0, 1.0 - uDarkGlossy * 0.08, smoothstep(0.4, 1.0, height));

  // Final Composite
  vec3 finalColor = sceneColor * darkTint + rimColor * fresnel + vec3(specular);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;
