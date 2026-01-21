import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader.js';

/**
 * Enhanced Post Processing System - Creates cinematic visuals for third-person gameplay
 */
export class PostProcessingSystem {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.composer = null;
        this.bloomPass = null;
        this.ssaoPass = null;
        this.filmPass = null;
        this.colorCorrectionPass = null;
        this.fxaaPass = null;
        this.smaaPass = null;
        
        // Visual quality settings
        this.bloomEnabled = true;
        this.ssaoEnabled = true;
        this.filmGrainEnabled = true;
        this.colorCorrectionEnabled = true;
        this.antiAliasingEnabled = true;
        
        // Dynamic settings
        this.timeOfDay = 0.5; // 0 = night, 0.5 = noon, 1 = sunset
        this.weatherIntensity = 0; // 0 = clear, 1 = storm
        
        this.init();
    }
    
    init() {
        console.log('🎨 Initializing enhanced post-processing system...');
        
        // Create effect composer with higher precision
        this.composer = new EffectComposer(this.renderer);
        
        // 1. Base render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // 2. Enhanced bloom for magical SWG atmosphere
        if (this.bloomEnabled) {
            this.bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                1.2,    // strength - moderate for realism
                0.6,    // radius - wider for soft glow
                0.7     // threshold - lower to affect more areas
            );
            this.composer.addPass(this.bloomPass);
        }
        
        // 3. Film grain for atmospheric feel
        if (this.filmGrainEnabled) {
            this.filmPass = new FilmPass(0.5, 0.025, 648, false); // subtle grain
            this.composer.addPass(this.filmPass);
        }
        
        // 4. FXAA for basic anti-aliasing (lighter than SMAA)
        if (this.antiAliasingEnabled) {
            this.fxaaPass = new ShaderPass(FXAAShader);
            this.fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
            this.composer.addPass(this.fxaaPass);
        }
        
        console.log('✨ Enhanced post-processing initialized with:', {
            bloom: this.bloomEnabled,
            filmGrain: this.filmGrainEnabled,
            antiAliasing: this.antiAliasingEnabled
        });
    }
    
    updateEffects(data = {}) {
        // Dynamic bloom adjustment based on movement speed
        if (this.bloomPass) {
            const speed = data.speed || 0;
            const isRunning = data.isRunning || false;
            
            if (isRunning || speed > 20) {
                this.bloomPass.strength = 1.5;
                this.bloomPass.radius = 0.8;
            } else {
                this.bloomPass.strength = 1.2;
                this.bloomPass.radius = 0.6;
            }
        }
        
        // Adjust film grain based on weather
        if (this.filmPass && data.weatherIntensity !== undefined) {
            this.weatherIntensity = data.weatherIntensity;
            this.filmPass.uniforms.nIntensity.value = 0.5 + (this.weatherIntensity * 0.3);
        }
    }
    
    // Set quality preset
    setQualityPreset(preset) {
        switch (preset) {
            case 'low':
                this.filmGrainEnabled = false;
                this.bloomPass && (this.bloomPass.strength = 0.8);
                break;
            case 'medium':
                this.filmGrainEnabled = false;
                this.bloomPass && (this.bloomPass.strength = 1.2);
                break;
            case 'high':
            case 'ultra':
                this.filmGrainEnabled = true;
                this.bloomPass && (this.bloomPass.strength = 1.5);
                break;
        }
        
        console.log(`🎮 Post-processing quality set to: ${preset}`);
    }
    
    render() {
        this.composer.render();
    }
    
    resize(width, height) {
        this.composer.setSize(width, height);
        
        // Update FXAA resolution
        if (this.fxaaPass) {
            this.fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
        }
    }
    
    // Toggle individual effects
    toggleBloom(enabled) {
        this.bloomEnabled = enabled;
        this.dispose();
        this.init();
    }
    
    dispose() {
        if (this.composer) {
            this.composer.dispose();
        }
    }
    
    // Get current settings for UI display
    getSettings() {
        return {
            bloom: this.bloomEnabled,
            filmGrain: this.filmGrainEnabled,
            antiAliasing: this.antiAliasingEnabled,
            timeOfDay: this.timeOfDay,
            weatherIntensity: this.weatherIntensity
        };
    }
}