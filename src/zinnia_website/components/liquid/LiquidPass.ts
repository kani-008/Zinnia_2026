import * as THREE from 'three';
import { liquidVertexShader, liquidFragmentShader } from './shaders';

export interface LiquidPassParams {
  refractionStrength: number;
  ior: number;
  magnification: number;
  chromaticAberration: number;
  fresnelPower: number;
  fresnelStrength: number;
  specularStrength: number;
  darkGlossy: number;
  debugMode: number;
}

export class LiquidPass {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  public material: THREE.ShaderMaterial;
  private quadGeometry: THREE.PlaneGeometry;
  private quadMesh: THREE.Mesh;

  public params: LiquidPassParams = {
    refractionStrength: 0.08,
    ior: 1.33,
    magnification: 1.02,
    chromaticAberration: 0.18,
    fresnelPower: 4.5,
    fresnelStrength: 0.55,
    specularStrength: 0.45,
    darkGlossy: 0.0,
    debugMode: 0,
  };

  constructor(width: number, height: number) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader: liquidVertexShader,
      fragmentShader: liquidFragmentShader,
      uniforms: {
        uSceneTexture: { value: null },
        uLiquidTexture: { value: null },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uRefractionStrength: { value: this.params.refractionStrength },
        uIOR: { value: this.params.ior },
        uMagnification: { value: this.params.magnification },
        uChromaticAberration: { value: this.params.chromaticAberration },
        uFresnelPower: { value: this.params.fresnelPower },
        uFresnelStrength: { value: this.params.fresnelStrength },
        uSpecularStrength: { value: this.params.specularStrength },
        uDarkGlossy: { value: this.params.darkGlossy },
        uDebugMode: { value: this.params.debugMode },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadGeometry = new THREE.PlaneGeometry(2, 2);
    this.quadMesh = new THREE.Mesh(this.quadGeometry, this.material);
    this.scene.add(this.quadMesh);
  }

  public resize(width: number, height: number): void {
    this.material.uniforms.uResolution.value.set(width, height);
  }

  public render(
    renderer: THREE.WebGLRenderer,
    sceneTexture: THREE.Texture,
    liquidTexture: THREE.Texture,
    mouseUv: THREE.Vector2
  ): void {
    this.material.uniforms.uSceneTexture.value = sceneTexture;
    this.material.uniforms.uLiquidTexture.value = liquidTexture;
    this.material.uniforms.uMouse.value.copy(mouseUv);

    this.material.uniforms.uRefractionStrength.value = this.params.refractionStrength;
    this.material.uniforms.uIOR.value = this.params.ior;
    this.material.uniforms.uMagnification.value = this.params.magnification;
    this.material.uniforms.uChromaticAberration.value = this.params.chromaticAberration;
    this.material.uniforms.uFresnelPower.value = this.params.fresnelPower;
    this.material.uniforms.uFresnelStrength.value = this.params.fresnelStrength;
    this.material.uniforms.uSpecularStrength.value = this.params.specularStrength;
    this.material.uniforms.uDarkGlossy.value = this.params.darkGlossy;
    this.material.uniforms.uDebugMode.value = this.params.debugMode;

    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.material.dispose();
    this.quadGeometry.dispose();
  }
}
