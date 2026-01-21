import * as THREE from 'three';

/**
 * Enhanced Lighting System - Creates dynamic, cinematic lighting for third-person gameplay
 */
export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Lighting components
        this.ambientLight = null;
        this.directionalLight = null;
        this.hemisphereLight = null;
        this.pointLights = [];
        
        // Dynamic settings
        this.timeOfDay = 0.6; // 0 = night, 0.5 = noon, 1 = sunset
        this.weatherIntensity = 0; // 0 = clear, 1 = storm
        
        this.init();
    }
    
    init() {
        console.log('💡 Initializing enhanced lighting system...');
        
        // 1. Hemisphere light for natural sky lighting
        this.hemisphereLight = new THREE.HemisphereLight(
            0x87CEEB, // Sky color (light blue)
            0x8B4513, // Ground color (brown)
            0.3
        );
        this.scene.add(this.hemisphereLight);
        
        // 2. Main directional light (sun)
        this.directionalLight = new THREE.DirectionalLight(0xFFFFE0, 1.2);
        this.directionalLight.position.set(100, 200, 50);
        this.directionalLight.castShadow = true;
        
        // Enhanced shadow settings
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        this.directionalLight.shadow.bias = -0.0001;
        this.directionalLight.shadow.normalBias = 0.02;
        
        this.scene.add(this.directionalLight);
        
        // 3. Ambient light for basic scene illumination
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(this.ambientLight);
        
        // 4. Create atmospheric point lights
        this.createAtmosphericLights();
        
        console.log('✨ Enhanced lighting system initialized');\n    }
    
    createAtmosphericLights() {
        // Add some atmospheric point lights for visual interest
        const lightPositions = [
            { x: 50, y: 15, z: 50, color: 0x4444FF, intensity: 0.3 },
            { x: -30, y: 10, z: -40, color: 0xFF4444, intensity: 0.2 },
            { x: 80, y: 12, z: -20, color: 0x44FF44, intensity: 0.25 }
        ];
        
        lightPositions.forEach((lightData, index) => {
            const light = new THREE.PointLight(lightData.color, lightData.intensity, 100);
            light.position.set(lightData.x, lightData.y, lightData.z);
            light.castShadow = true;
            light.shadow.mapSize.width = 512;
            light.shadow.mapSize.height = 512;
            
            this.pointLights.push(light);
            this.scene.add(light);
            
            // Add a subtle glow sphere for visual effect
            const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: lightData.color,
                transparent: true,
                opacity: 0.1
            });
            const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
            glowSphere.position.copy(light.position);
            this.scene.add(glowSphere);
        });
    }
    
    updateTimeOfDay(timeOfDay) {
        this.timeOfDay = Math.max(0, Math.min(1, timeOfDay));
        
        // Update sun position and color based on time of day
        const sunAngle = this.timeOfDay * Math.PI;
        const sunHeight = Math.sin(sunAngle) * 100 + 50;
        const sunDistance = Math.cos(sunAngle) * 200;
        
        this.directionalLight.position.set(sunDistance, sunHeight, 50);
        
        // Dynamic sun color and intensity
        if (this.timeOfDay < 0.2 || this.timeOfDay > 0.8) {
            // Night time - cooler, dimmer
            this.directionalLight.color.setHex(0x8888CC);
            this.directionalLight.intensity = 0.3;
            this.ambientLight.intensity = 0.1;
            this.hemisphereLight.intensity = 0.1;
        } else if (this.timeOfDay > 0.6 && this.timeOfDay < 0.8) {
            // Sunset/Sunrise - warm colors
            this.directionalLight.color.setHex(0xFFAA66);
            this.directionalLight.intensity = 0.8;
            this.ambientLight.intensity = 0.15;
            this.hemisphereLight.intensity = 0.2;
        } else {
            // Day time - bright and neutral
            this.directionalLight.color.setHex(0xFFFFE0);
            this.directionalLight.intensity = 1.2;
            this.ambientLight.intensity = 0.2;
            this.hemisphereLight.intensity = 0.3;
        }
        
        // Update hemisphere colors
        if (this.timeOfDay < 0.3) {
            // Night sky
            this.hemisphereLight.color.setHex(0x001122);
            this.hemisphereLight.groundColor.setHex(0x000811);
        } else if (this.timeOfDay > 0.7) {
            // Sunset sky
            this.hemisphereLight.color.setHex(0xFF6633);
            this.hemisphereLight.groundColor.setHex(0x331100);
        } else {
            // Day sky
            this.hemisphereLight.color.setHex(0x87CEEB);
            this.hemisphereLight.groundColor.setHex(0x8B4513);
        }
    }
    
    updateWeather(intensity) {
        this.weatherIntensity = Math.max(0, Math.min(1, intensity));
        
        // Adjust lighting based on weather
        const weatherDimming = 1 - (this.weatherIntensity * 0.4);
        
        this.directionalLight.intensity *= weatherDimming;
        this.ambientLight.intensity *= weatherDimming;
        this.hemisphereLight.intensity *= weatherDimming;
        
        // Add atmospheric effects for storms
        if (this.weatherIntensity > 0.5) {
            // Make lighting more dramatic during storms
            this.directionalLight.color.setHex(0x666688);
        }
    }
    
    // Follow the player for dynamic lighting
    followPlayer(playerPosition) {
        // Adjust point lights to create atmospheric lighting around player
        this.pointLights.forEach((light, index) => {
            const offset = [
                { x: 30, z: 30 },
                { x: -25, z: -35 },
                { x: 40, z: -15 }
            ][index];
            
            if (offset) {
                light.position.x = playerPosition.x + offset.x;
                light.position.z = playerPosition.z + offset.z;
            }
        });
        
        // Move shadow camera to follow player for better shadow quality
        this.directionalLight.shadow.camera.position.set(
            playerPosition.x,
            this.directionalLight.shadow.camera.position.y,
            playerPosition.z
        );
        this.directionalLight.shadow.camera.updateMatrixWorld();
    }
    
    // Add dynamic lighting effects
    addGlow(position, color = 0x00FFFF, intensity = 1, duration = 2000) {
        const light = new THREE.PointLight(color, intensity, 50);
        light.position.copy(position);
        this.scene.add(light);
        
        // Animate the glow
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.scene.remove(light);
                return;
            }
            
            // Fade out over time
            light.intensity = intensity * (1 - progress);
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    // Get current lighting settings for UI
    getSettings() {
        return {
            timeOfDay: this.timeOfDay,
            weatherIntensity: this.weatherIntensity,
            sunIntensity: this.directionalLight.intensity,
            ambientIntensity: this.ambientLight.intensity
        };
    }
    
    dispose() {
        // Clean up all lights
        this.scene.remove(this.ambientLight);
        this.scene.remove(this.directionalLight);
        this.scene.remove(this.hemisphereLight);
        this.pointLights.forEach(light => this.scene.remove(light));
        this.pointLights = [];
    }
}