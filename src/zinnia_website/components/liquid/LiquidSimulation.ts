import * as THREE from 'three';
import { simVertexShader, simFragmentShader } from './shaders';

export interface LiquidSimParams {
  radius: number;
  force: number;
  viscosity: number;
  decay: number;
  velocityStretch: number;
}

export class LiquidSimulation {
  private renderer: THREE.WebGLRenderer;
  public width: number;
  public height: number;

  public targetA: THREE.WebGLRenderTarget;
  public targetB: THREE.WebGLRenderTarget;
  public readTarget: THREE.WebGLRenderTarget;
  public writeTarget: THREE.WebGLRenderTarget;

  private simScene: THREE.Scene;
  private simCamera: THREE.OrthographicCamera;
  private simMaterial: THREE.ShaderMaterial;
  private quadGeometry: THREE.PlaneGeometry;
  private quadMesh: THREE.Mesh;

  public mouse: THREE.Vector2;
  public prevMouse: THREE.Vector2;
  public mouseVelocity: THREE.Vector2;
  public smoothVelocity: THREE.Vector2;

  public params: LiquidSimParams = {
    radius: 0.016,
    force: 0.9,
    viscosity: 0.32,
    decay: 0.93,
    velocityStretch: 0.25,
  };

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.renderer = renderer;
    this.width = width;
    this.height = height;

    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.prevMouse = new THREE.Vector2(0.5, 0.5);
    this.mouseVelocity = new THREE.Vector2(0, 0);
    this.smoothVelocity = new THREE.Vector2(0, 0);

    // Setup Render Targets (HalfFloat for precision fluid simulation)
    const options: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      stencilBuffer: false,
      depthBuffer: false,
    };

    // Half size target for ultra-smooth fluid dynamics & high performance
    const simWidth = Math.max(256, Math.floor(width / 2));
    const simHeight = Math.max(256, Math.floor(height / 2));

    this.targetA = new THREE.WebGLRenderTarget(simWidth, simHeight, options);
    this.targetB = new THREE.WebGLRenderTarget(simWidth, simHeight, options);
    this.readTarget = this.targetA;
    this.writeTarget = this.targetB;

    // Simulation Quad Scene & Material setup
    this.simScene = new THREE.Scene();
    this.simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.simMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertexShader,
      fragmentShader: simFragmentShader,
      uniforms: {
        uBufferTexture: { value: null },
        uResolution: { value: new THREE.Vector2(simWidth, simHeight) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseVelocity: { value: new THREE.Vector2(0, 0) },
        uRadius: { value: this.params.radius },
        uForce: { value: this.params.force },
        uViscosity: { value: this.params.viscosity },
        uDecay: { value: this.params.decay },
        uAspect: { value: width / height },
        uVelocityStretch: { value: this.params.velocityStretch },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadGeometry = new THREE.PlaneGeometry(2, 2);
    this.quadMesh = new THREE.Mesh(this.quadGeometry, this.simMaterial);
    this.simScene.add(this.quadMesh);
  }

  public updatePointer(uvX: number, uvY: number): void {
    this.mouse.set(uvX, uvY);
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    const simWidth = Math.max(256, Math.floor(width / 2));
    const simHeight = Math.max(256, Math.floor(height / 2));

    this.targetA.setSize(simWidth, simHeight);
    this.targetB.setSize(simWidth, simHeight);

    this.simMaterial.uniforms.uResolution.value.set(simWidth, simHeight);
    this.simMaterial.uniforms.uAspect.value = width / height;
  }

  public swapTargets(): void {
    const temp = this.readTarget;
    this.readTarget = this.writeTarget;
    this.writeTarget = temp;
  }

  public step(): THREE.Texture {
    // Calculate instantaneous velocity
    const rawVelX = this.mouse.x - this.prevMouse.x;
    const rawVelY = this.mouse.y - this.prevMouse.y;
    this.mouseVelocity.set(rawVelX, rawVelY);

    // Smooth velocity with lerp to maintain natural physical momentum
    this.smoothVelocity.lerp(this.mouseVelocity, 0.35);

    // Update uniforms
    this.simMaterial.uniforms.uBufferTexture.value = this.readTarget.texture;
    this.simMaterial.uniforms.uMouse.value.copy(this.mouse);
    this.simMaterial.uniforms.uPrevMouse.value.copy(this.prevMouse);
    this.simMaterial.uniforms.uMouseVelocity.value.copy(this.smoothVelocity);

    this.simMaterial.uniforms.uRadius.value = this.params.radius;
    this.simMaterial.uniforms.uForce.value = this.params.force;
    this.simMaterial.uniforms.uViscosity.value = this.params.viscosity;
    this.simMaterial.uniforms.uDecay.value = this.params.decay;
    this.simMaterial.uniforms.uVelocityStretch.value = this.params.velocityStretch;

    // Render to writeTarget
    this.renderer.setRenderTarget(this.writeTarget);
    this.renderer.render(this.simScene, this.simCamera);
    this.renderer.setRenderTarget(null);

    // Swap read/write targets for next frame ping-pong
    this.swapTargets();

    // Store previous mouse position
    this.prevMouse.copy(this.mouse);

    return this.readTarget.texture;
  }

  public dispose(): void {
    this.targetA.dispose();
    this.targetB.dispose();
    this.simMaterial.dispose();
    this.quadGeometry.dispose();
  }
}
