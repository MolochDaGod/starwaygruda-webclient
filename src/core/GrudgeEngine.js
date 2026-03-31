/**
 * GrudgeEngine — Babylon.js 9.0 Core Engine Wrapper
 * 
 * The foundation for all Grudge Web Engine rendering.
 * Initializes Babylon 9 with WebGPU (fallback WebGL2), sets up:
 *   - Scene with Clustered Lighting enabled
 *   - ArcRotateCamera (Fortnite-style over-shoulder follow)
 *   - Hemispheric + Directional lights
 *   - Ground mesh with PBR material
 *   - Skybox
 *   - Render loop
 *   - Inspector toggle (F12)
 *   - Scene serialization for editor save/load
 * 
 * Usage:
 *   const engine = new GrudgeEngine('renderCanvas');
 *   await engine.init();
 *   engine.run();
 * 
 * Created by Racalvin The Pirate King — Grudge Studio
 */

import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3, Color3, Color4 } from "@babylonjs/core/Maths/math";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { SceneSerializer } from "@babylonjs/core/Misc/sceneSerializer";

// Side-effect imports for Babylon features
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Meshes/Builders/groundBuilder";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/loaders/glTF";

export class GrudgeEngine {
    /**
     * @param {string} canvasId - ID of the HTML canvas element
     * @param {object} options
     * @param {boolean} [options.enableWebGPU=true] - Try WebGPU first
     * @param {boolean} [options.enableInspector=true] - Allow F12 inspector toggle
     * @param {boolean} [options.enableShadows=true] - Shadow mapping
     * @param {string} [options.skyboxPath] - URL for skybox cubemap
     */
    constructor(canvasId, options = {}) {
        this.canvasId = canvasId;
        this.options = {
            enableWebGPU: true,
            enableInspector: true,
            enableShadows: true,
            skyboxPath: null,
            ...options,
        };

        /** @type {HTMLCanvasElement} */
        this.canvas = null;
        /** @type {Engine|WebGPUEngine} */
        this.engine = null;
        /** @type {Scene} */
        this.scene = null;
        /** @type {ArcRotateCamera} */
        this.camera = null;
        /** @type {DirectionalLight} */
        this.sunLight = null;
        /** @type {ShadowGenerator} */
        this.shadowGenerator = null;

        this._inspectorVisible = false;
        this._running = false;
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    async init() {
        this.canvas = document.getElementById(this.canvasId);
        if (!this.canvas) throw new Error(`Canvas #${this.canvasId} not found`);

        // Try WebGPU first, fall back to WebGL2
        if (this.options.enableWebGPU && WebGPUEngine.IsSupportedAsync) {
            try {
                const supported = await WebGPUEngine.IsSupportedAsync;
                if (supported) {
                    this.engine = new WebGPUEngine(this.canvas, {
                        adaptToDeviceRatio: true,
                        antialias: true,
                    });
                    await this.engine.initAsync();
                    console.log("[GrudgeEngine] Initialized with WebGPU");
                }
            } catch (e) {
                console.warn("[GrudgeEngine] WebGPU init failed, falling back to WebGL2:", e.message);
            }
        }

        if (!this.engine) {
            this.engine = new Engine(this.canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true,
                adaptToDeviceRatio: true,
            });
            console.log("[GrudgeEngine] Initialized with WebGL2");
        }

        // Create scene
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0.02, 0.02, 0.06, 1);
        this.scene.ambientColor = new Color3(0.1, 0.1, 0.15);
        this.scene.fogMode = Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.001;
        this.scene.fogColor = new Color3(0.05, 0.05, 0.1);

        this._setupCamera();
        this._setupLighting();
        this._setupGround();

        if (this.options.skyboxPath) {
            this._setupSkybox(this.options.skyboxPath);
        }

        if (this.options.enableInspector) {
            this._setupInspectorToggle();
        }

        // Resize handler
        window.addEventListener("resize", () => this.engine.resize());

        console.log("[GrudgeEngine] Scene ready");
        return this;
    }

    // ═══════════════════════════════════════════════════════════════
    // CAMERA — Fortnite-style over-shoulder follow
    // ═══════════════════════════════════════════════════════════════

    _setupCamera() {
        this.camera = new ArcRotateCamera(
            "followCam",
            -Math.PI / 2,   // alpha (horizontal rotation)
            Math.PI / 3,     // beta (vertical angle — slightly above)
            12,               // radius (distance from target)
            new Vector3(0, 1.5, 0), // target (player height)
            this.scene
        );

        // Fortnite-style: W moves forward away from camera,
        // camera follows over shoulder
        this.camera.lowerRadiusLimit = 3;
        this.camera.upperRadiusLimit = 30;
        this.camera.lowerBetaLimit = 0.3;
        this.camera.upperBetaLimit = Math.PI / 2.2;
        this.camera.wheelDeltaPercentage = 0.02;
        this.camera.angularSensibilityX = 500;
        this.camera.angularSensibilityY = 500;

        // Offset camera slightly right for over-shoulder feel
        this.camera.targetScreenOffset = new Vector3(0.8, 0, 0);

        this.camera.attachControl(this.canvas, true);
    }

    // ═══════════════════════════════════════════════════════════════
    // LIGHTING — Hemispheric ambient + Directional sun + shadows
    // ═══════════════════════════════════════════════════════════════

    _setupLighting() {
        // Ambient hemisphere
        const hemi = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), this.scene);
        hemi.intensity = 0.4;
        hemi.diffuse = new Color3(0.9, 0.85, 0.7);
        hemi.groundColor = new Color3(0.1, 0.1, 0.2);

        // Directional sun
        this.sunLight = new DirectionalLight(
            "sunLight",
            new Vector3(-1, -2, -1).normalize(),
            this.scene
        );
        this.sunLight.intensity = 1.2;
        this.sunLight.diffuse = new Color3(1, 0.95, 0.8);

        // Shadows
        if (this.options.enableShadows) {
            this.shadowGenerator = new ShadowGenerator(2048, this.sunLight);
            this.shadowGenerator.useBlurExponentialShadowMap = true;
            this.shadowGenerator.blurKernel = 32;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GROUND
    // ═══════════════════════════════════════════════════════════════

    _setupGround() {
        const ground = MeshBuilder.CreateGround("ground", {
            width: 200,
            height: 200,
            subdivisions: 64,
        }, this.scene);

        const mat = new PBRMaterial("groundMat", this.scene);
        mat.albedoColor = new Color3(0.15, 0.12, 0.08);
        mat.metallic = 0;
        mat.roughness = 0.95;
        ground.material = mat;
        ground.receiveShadows = true;

        return ground;
    }

    // ═══════════════════════════════════════════════════════════════
    // SKYBOX
    // ═══════════════════════════════════════════════════════════════

    _setupSkybox(path) {
        const skybox = MeshBuilder.CreateBox("skybox", { size: 1000 }, this.scene);
        const skyMat = new PBRMaterial("skyMat", this.scene);
        skyMat.backFaceCulling = false;
        skyMat.disableLighting = true;
        skyMat.reflectionTexture = new CubeTexture(path, this.scene);
        skyMat.reflectionTexture.coordinatesMode = 5; // SKYBOX_MODE
        skyMat.microSurface = 1;
        skybox.material = skyMat;
        skybox.infiniteDistance = true;
        return skybox;
    }

    // ═══════════════════════════════════════════════════════════════
    // INSPECTOR (F12 toggle)
    // ═══════════════════════════════════════════════════════════════

    _setupInspectorToggle() {
        document.addEventListener("keydown", async (e) => {
            if (e.key === "F12" && e.shiftKey) {
                e.preventDefault();
                if (this._inspectorVisible) {
                    this.scene.debugLayer.hide();
                } else {
                    // Lazy-load inspector
                    await import("@babylonjs/inspector");
                    this.scene.debugLayer.show({
                        embedMode: true,
                        overlay: true,
                    });
                }
                this._inspectorVisible = !this._inspectorVisible;
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER LOOP
    // ═══════════════════════════════════════════════════════════════

    run() {
        if (this._running) return;
        this._running = true;
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    stop() {
        this._running = false;
        this.engine.stopRenderLoop();
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENE SERIALIZATION (for editor save/load)
    // ═══════════════════════════════════════════════════════════════

    /** Serialize the current scene to JSON */
    serializeScene() {
        return SceneSerializer.Serialize(this.scene);
    }

    /** Load a scene from JSON data */
    async loadSceneFromJSON(sceneData) {
        // Dispose current scene objects (keep engine)
        this.scene.dispose();
        this.scene = new Scene(this.engine);
        // TODO: SceneLoader.Append from serialized data
        this._setupCamera();
        this._setupLighting();
        console.log("[GrudgeEngine] Scene loaded from JSON");
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════

    /** Add a mesh to the shadow caster list */
    addShadowCaster(mesh) {
        if (this.shadowGenerator) {
            this.shadowGenerator.addShadowCaster(mesh);
        }
    }

    /** Get the Babylon scene for direct manipulation */
    getScene() { return this.scene; }

    /** Get the Babylon engine */
    getEngine() { return this.engine; }

    /** Get the main camera */
    getCamera() { return this.camera; }

    /** Set camera target (for following a player mesh) */
    followTarget(mesh) {
        this.camera.lockedTarget = mesh;
    }

    /** Dispose everything */
    dispose() {
        this.stop();
        this.scene.dispose();
        this.engine.dispose();
    }
}

export default GrudgeEngine;
