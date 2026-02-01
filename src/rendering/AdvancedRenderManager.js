import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/**
 * Advanced Rendering Manager with FPS control and quality settings
 * Implements best practices for WebGL rendering and performance optimization
 */
export class AdvancedRenderManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        // FPS Control
        this.targetFPS = 60;
        this.minFPS = 30;
        this.maxFPS = 144;
        this.currentFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        this.lastFrameTime = performance.now();
        this.fpsHistory = [];
        this.fpsHistorySize = 60;
        
        // Performance metrics
        this.stats = {
            drawCalls: 0,
            triangles: 0,
            geometries: 0,
            textures: 0,
            programs: 0,
            memory: 0
        };
        
        // Quality settings
        this.qualityPresets = {
            ultra: {
                shadows: true,
                shadowMapSize: 2048,
                antialias: 'SMAA',
                bloom: true,
                ssao: true,
                anisotropy: 16,
                pixelRatio: Math.min(window.devicePixelRatio, 2),
                maxLights: 8,
                lodDistance: [100, 500, 2000]
            },
            high: {
                shadows: true,
                shadowMapSize: 1024,
                antialias: 'FXAA',
                bloom: true,
                ssao: false,
                anisotropy: 8,
                pixelRatio: Math.min(window.devicePixelRatio, 1.5),
                maxLights: 6,
                lodDistance: [75, 400, 1500]
            },
            medium: {
                shadows: true,
                shadowMapSize: 512,
                antialias: 'FXAA',
                bloom: false,
                ssao: false,
                anisotropy: 4,
                pixelRatio: 1,
                maxLights: 4,
                lodDistance: [50, 300, 1000]
            },
            low: {
                shadows: false,
                shadowMapSize: 256,
                antialias: 'none',
                bloom: false,
                ssao: false,
                anisotropy: 1,
                pixelRatio: 0.75,
                maxLights: 2,
                lodDistance: [30, 200, 750]
            },
            auto: null // Will be determined dynamically
        };
        
        this.currentQuality = 'high';
        this.autoAdjustQuality = true;
        
        // Post-processing
        this.composer = null;
        this.passes = {};
        
        // LOD Management
        this.lodObjects = new Map();
        
        // Culling
        this.frustumCulling = true;
        this.occlusionCulling = false;
        
        this.init();
    }
    
    init() {
        console.log('🎨 Initializing Advanced Render Manager...');
        
        // Set initial quality
        this.setQuality(this.currentQuality);
        
        // Setup post-processing
        this.setupPostProcessing();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        // Setup adaptive quality
        if (this.autoAdjustQuality) {
            this.startAdaptiveQuality();
        }
        
        console.log('✅ Render Manager initialized');
    }
    
    setupPostProcessing() {
        const quality = this.qualityPresets[this.currentQuality];
        
        // Create composer
        this.composer = new EffectComposer(this.renderer);
        
        // Basic render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        this.passes.render = renderPass;
        
        // SSAO (if enabled)
        if (quality.ssao) {
            const ssaoPass = new SSAOPass(this.scene, this.camera);
            ssaoPass.kernelRadius = 16;
            ssaoPass.minDistance = 0.001;
            ssaoPass.maxDistance = 0.1;
            this.composer.addPass(ssaoPass);
            this.passes.ssao = ssaoPass;
        }
        
        // Bloom (if enabled)
        if (quality.bloom) {
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.5,  // strength
                0.4,  // radius
                0.85  // threshold
            );
            this.composer.addPass(bloomPass);
            this.passes.bloom = bloomPass;
        }
        
        // Anti-aliasing
        if (quality.antialias === 'SMAA') {
            const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
            this.composer.addPass(smaaPass);
            this.passes.antialias = smaaPass;
        } else if (quality.antialias === 'FXAA') {
            const fxaaPass = new ShaderPass(FXAAShader);
            fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * quality.pixelRatio);
            fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * quality.pixelRatio);
            this.composer.addPass(fxaaPass);
            this.passes.antialias = fxaaPass;
        }
    }
    
    setQuality(qualityLevel) {
        if (!this.qualityPresets[qualityLevel]) {
            console.warn(`Unknown quality level: ${qualityLevel}`);
            return;
        }
        
        this.currentQuality = qualityLevel;
        const quality = this.qualityPresets[qualityLevel];
        
        console.log(`🎨 Setting quality to: ${qualityLevel}`);
        
        // Apply renderer settings
        this.renderer.setPixelRatio(quality.pixelRatio);
        this.renderer.shadowMap.enabled = quality.shadows;
        if (quality.shadows) {
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // Apply shadow map size to all lights
        this.scene.traverse((object) => {
            if (object.isLight && object.shadow) {
                object.shadow.mapSize.width = quality.shadowMapSize;
                object.shadow.mapSize.height = quality.shadowMapSize;
                object.shadow.map?.dispose();
                object.shadow.map = null;
            }
        });
        
        // Apply anisotropy to textures
        this.scene.traverse((object) => {
            if (object.isMesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(mat => {
                    if (mat.map) mat.map.anisotropy = quality.anisotropy;
                    if (mat.normalMap) mat.normalMap.anisotropy = quality.anisotropy;
                    if (mat.roughnessMap) mat.roughnessMap.anisotropy = quality.anisotropy;
                });
            }
        });
        
        // Rebuild post-processing
        if (this.composer) {
            this.composer.dispose();
            this.setupPostProcessing();
        }
    }
    
    setupPerformanceMonitoring() {
        // Monitor FPS
        setInterval(() => {
            this.updateStats();
            this.checkPerformance();
        }, 1000);
    }
    
    updateStats() {
        const info = this.renderer.info;
        
        this.stats.drawCalls = info.render.calls;
        this.stats.triangles = info.render.triangles;
        this.stats.geometries = info.memory.geometries;
        this.stats.textures = info.memory.textures;
        this.stats.programs = info.programs?.length || 0;
        
        // Calculate memory usage (approximate)
        this.stats.memory = (
            this.stats.geometries * 0.1 + 
            this.stats.textures * 2
        ).toFixed(2);
    }
    
    checkPerformance() {
        // Calculate average FPS
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        
        if (this.autoAdjustQuality) {
            // Auto-adjust quality based on FPS
            if (avgFPS < this.minFPS + 5) {
                this.degradeQuality();
            } else if (avgFPS > this.targetFPS - 5 && this.currentQuality !== 'ultra') {
                this.improveQuality();
            }
        }
    }
    
    degradeQuality() {
        const qualityOrder = ['ultra', 'high', 'medium', 'low'];
        const currentIndex = qualityOrder.indexOf(this.currentQuality);
        
        if (currentIndex < qualityOrder.length - 1) {
            const newQuality = qualityOrder[currentIndex + 1];
            console.log(`⚠️ Performance degraded, switching to ${newQuality} quality`);
            this.setQuality(newQuality);
        }
    }
    
    improveQuality() {
        const qualityOrder = ['ultra', 'high', 'medium', 'low'];
        const currentIndex = qualityOrder.indexOf(this.currentQuality);
        
        if (currentIndex > 0) {
            const newQuality = qualityOrder[currentIndex - 1];
            console.log(`✨ Performance improved, switching to ${newQuality} quality`);
            this.setQuality(newQuality);
        }
    }
    
    startAdaptiveQuality() {
        // Wait a few seconds before starting adaptive quality
        setTimeout(() => {
            this.autoAdjustQuality = true;
            console.log('🔄 Adaptive quality system active');
        }, 5000);
    }
    
    render(delta) {
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        
        // FPS limiting
        if (elapsed < this.frameTime) {
            return false; // Skip this frame
        }
        
        // Update FPS tracking
        this.currentFPS = 1000 / elapsed;
        this.fpsHistory.push(this.currentFPS);
        if (this.fpsHistory.length > this.fpsHistorySize) {
            this.fpsHistory.shift();
        }
        
        // Frustum culling (automatic with Three.js)
        // Custom culling can be added here
        
        // LOD updates
        this.updateLOD();
        
        // Render
        if (this.composer) {
            this.composer.render(delta);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        
        this.lastFrameTime = now - (elapsed % this.frameTime);
        
        return true;
    }
    
    updateLOD() {
        const quality = this.qualityPresets[this.currentQuality];
        const cameraPos = this.camera.position;
        
        this.lodObjects.forEach((lod, object) => {
            const distance = cameraPos.distanceTo(object.position);
            
            // Determine LOD level based on distance
            let level = 0;
            if (distance > quality.lodDistance[2]) {
                level = 3; // Lowest detail or hidden
            } else if (distance > quality.lodDistance[1]) {
                level = 2;
            } else if (distance > quality.lodDistance[0]) {
                level = 1;
            }
            
            if (lod.currentLevel !== level) {
                lod.currentLevel = level;
                this.applyLOD(object, level);
            }
        });
    }
    
    applyLOD(object, level) {
        // Apply LOD - simplified version
        if (level === 3) {
            object.visible = false;
        } else {
            object.visible = true;
            // Could switch materials/geometries here based on level
        }
    }
    
    registerLODObject(object, lodLevels = null) {
        this.lodObjects.set(object, {
            currentLevel: 0,
            levels: lodLevels || [0, 1, 2, 3]
        });
    }
    
    setTargetFPS(fps) {
        this.targetFPS = Math.max(this.minFPS, Math.min(fps, this.maxFPS));
        this.frameTime = 1000 / this.targetFPS;
        console.log(`🎯 Target FPS set to: ${this.targetFPS}`);
    }
    
    enablePostProcessing(enable = true) {
        if (!enable && this.composer) {
            this.composer = null;
        } else if (enable && !this.composer) {
            this.setupPostProcessing();
        }
    }
    
    getStats() {
        return {
            ...this.stats,
            fps: Math.round(this.currentFPS),
            avgFPS: Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length),
            quality: this.currentQuality,
            targetFPS: this.targetFPS
        };
    }
    
    dispose() {
        if (this.composer) {
            this.composer.dispose();
        }
        this.lodObjects.clear();
    }
}

export default AdvancedRenderManager;
