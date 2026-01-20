import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * Post Processing System - Adds visual effects like bloom
 */
export class PostProcessingSystem {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.composer = null;
        this.bloomPass = null;
        
        this.init();
    }
    
    init() {
        // Create effect composer
        this.composer = new EffectComposer(this.renderer);
        
        // Add render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Add bloom effect for glowing particles
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,    // strength
            0.4,    // radius
            0.85    // threshold
        );
        this.composer.addPass(this.bloomPass);
        
        console.log('✨ Post-processing system initialized with bloom');
    }
    
    updateEffects(data) {
        if (!this.bloomPass) return;
        
        // Adjust bloom based on speed and boost
        if (data.isBoosting) {
            this.bloomPass.strength = 2.0;
            this.bloomPass.radius = 0.6;
        } else {
            this.bloomPass.strength = 1.2;
            this.bloomPass.radius = 0.4;
        }
    }
    
    render() {
        this.composer.render();
    }
    
    resize(width, height) {
        this.composer.setSize(width, height);
    }
    
    dispose() {
        if (this.composer) {
            this.composer.dispose();
        }
    }
}