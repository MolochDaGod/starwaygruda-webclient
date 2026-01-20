import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

/**
 * Stars System - Dynamic star field that reacts to time of day
 */
export class StarsSystem {
    constructor(scene) {
        this.scene = scene;
        this.stars = null;
        this.starsMaterial = null;
    }
    
    init() {
        // Create star field
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            // Create stars in a sphere around the scene
            const radius = 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);     // x
            positions[i + 1] = radius * Math.cos(phi);                   // y  
            positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta); // z
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        this.starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.0,
            transparent: true,
            opacity: 0.0 // Start invisible
        });
        
        this.stars = new THREE.Points(starsGeometry, this.starsMaterial);
        this.scene.add(this.stars);
        
        console.log('✨ Stars system initialized');
    }
    
    update(sunElevation) {
        if (!this.stars) return;
        
        // Stars become visible when sun is below horizon
        let starOpacity = 0;
        if (sunElevation < -5) {
            // Full star visibility during deep night
            starOpacity = 0.8;
        } else if (sunElevation < 5) {
            // Fade in/out during twilight
            starOpacity = THREE.MathUtils.mapLinear(sunElevation, 5, -5, 0, 0.8);
        }
        
        this.starsMaterial.opacity = starOpacity;
        
        // Slowly rotate stars
        this.stars.rotation.y += 0.0001;
    }
    
    dispose() {
        if (this.stars) {
            this.scene.remove(this.stars);
            this.stars.geometry.dispose();
            this.stars.material.dispose();
        }
    }
}