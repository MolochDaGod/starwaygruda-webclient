import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { StarsSystem } from './StarsSystem.js';
import { TimeController } from './TimeController.js';
import { PostProcessingSystem } from './PostProcessingSystem.js';
import { CrystalSystem } from './CrystalSystem.js';

/**
 * Advanced Three.js Scene with Space Flight
 * Features: Dynamic terrain, day/night cycle, particle effects, crystal collection
 */
export class AdvancedThreeScene {
    constructor(mountRef) {
        this.mountRef = mountRef;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.baseFOV = 75;
        this.maxFOVBoost = 10;
        
        // Mobile detection and optimizations
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: !this.isMobile,
            powerPreference: "high-performance" 
        });
        
        // Terrain system
        this.terrainChunks = [];
        this.chunkSize = 100;
        this.baseChunksVisibleDistance = this.isMobile ? 2 : 3;
        this.maxChunksVisibleDistance = this.isMobile ? 4 : 8;
        this.chunksVisibleInDistance = this.baseChunksVisibleDistance;
        this.minAltitudeForMaxRender = 40;
        
        // Spaceship and flight
        this.spaceship = null;
        this.clock = new THREE.Clock();
        this.keys = {};
        
        // Flight physics
        this.speed = 0.2;
        this.turnSpeed = 0.03;
        this.maxSpeed = 0.5;
        this.boostMaxSpeed = 0.8;
        this.acceleration = 0.005;
        this.boostAcceleration = 0.01;
        this.deceleration = 0.01;
        this.currentSpeed = 0;
        this.tiltAmount = 0.2;
        
        // Boost system
        this.isBoosting = false;
        this.boostEnergy = 100;
        this.boostEnergyMax = 100;
        this.boostEnergyRegenRate = 0.2;
        this.boostEnergyCostRate = 0.8;
        
        // Particle effects
        this.particles = [];
        this.maxParticles = this.isMobile ? 80 : 200;
        
        // Score tracking
        this.score = 0;
        this.crystalsCollected = 0;
        
        // Time system
        this.sunElevation = 90;
        
        console.log('🚀 Advanced Three.js Scene initialized');
    }
    
    init(updateFlightData) {
        this.updateFlightData = updateFlightData;
        
        // Renderer setup
        this.renderer.setPixelRatio(this.isMobile ? Math.min(1.5, window.devicePixelRatio) : window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.mountRef.current.appendChild(this.renderer.domElement);
        
        // Initialize post-processing
        this.initPostProcessing();
        
        // Setup scene components
        this.setupEnvironment();
        this.setupLights();
        this.scene.fog = new THREE.FogExp2(0xd8e8ff, 0.00015);
        
        // Initialize systems
        this.timeController = new TimeController(this.scene);
        this.setupTerrainSystem();
        this.loadSpaceship();
        this.initCrystalSystem();
        
        // Camera position
        this.camera.position.set(0, 10, 20);
        
        // Event listeners
        this.handleResize();
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        this.animate();
        
        return () => this.cleanup();
    }
    
    initPostProcessing() {
        try {
            this.postProcessing = new PostProcessingSystem(this.renderer, this.scene, this.camera);
            console.log('✨ Post-processing enabled');
        } catch (error) {
            console.warn('Post-processing failed to initialize:', error);
            this.postProcessing = null;
        }
    }
    
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        if (this.postProcessing) {
            this.postProcessing.resize(width, height);
        }
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const delta = this.clock.getDelta();
        
        // Update time system
        if (this.timeController) {
            this.timeController.update();
            this.updateSkyForTimeOfDay();
        }
        
        // Update crystal system
        if (this.crystalSystem) {
            const time = this.clock.getElapsedTime();
            this.crystalSystem.update(time);
            
            if (this.spaceship) {
                this.checkCrystalCollisions();
                this.updateCrystalAnimations(delta);
            }
        }
        
        // Update spaceship
        if (this.spaceship) {
            this.updateSpaceshipControls(delta);
            this.updateParticles(delta);
            
            // Send flight data to UI
            if (this.updateFlightData) {
                const speedKmh = this.calculateCurrentSpeed() * 36;
                const heading = ((this.spaceship.rotation.y * (180/Math.PI)) + 180) % 360;
                
                const flightData = {
                    speed: speedKmh,
                    altitude: this.spaceship.position.y,
                    heading: heading,
                    boostEnergy: this.boostEnergy,
                    isBoosting: this.isBoosting,
                    renderDistance: this.chunksVisibleInDistance
                };
                
                this.updateFlightData(flightData);
                this.prevFlightData = flightData;
            }
        }
        
        // Update terrain
        if (this.spaceship) {
            this.updateTerrainChunks();
        }
        
        // Update stars
        if (this.starsSystem) {
            this.starsSystem.update(this.sunElevation);
        }
        
        // Render with post-processing
        if (this.postProcessing) {
            this.postProcessing.updateEffects({
                speed: this.calculateCurrentSpeed() * 36,
                isBoosting: this.isBoosting,
                shipPosition: this.spaceship ? this.spaceship.position : null
            });
            this.postProcessing.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    setupEnvironment() {
        // Create sky
        this.sky = new Sky();
        this.sky.scale.setScalar(450000);
        this.scene.add(this.sky);
        
        // Set initial sun position
        const sunPosition = new THREE.Vector3().setFromSphericalCoords(
            1, 
            THREE.MathUtils.degToRad(90), 
            THREE.MathUtils.degToRad(180)
        );
        
        // Configure sky
        const uniforms = this.sky.material.uniforms;
        uniforms.sunPosition.value.copy(sunPosition);
        uniforms.turbidity.value = 3;
        uniforms.rayleigh.value = 0.8;
        uniforms.mieCoefficient.value = 0.0015;
        uniforms.mieDirectionalG.value = 0.85;
        
        // Load HDRI for environment lighting
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();
        
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load("https://play.rosebud.ai/assets/DaySkyHDRI026A_4K-TONEMAPPED.jpg?N7w8", (hdriTexture) => {
            const envMap = pmremGenerator.fromEquirectangular(hdriTexture).texture;
            this.scene.environment = envMap;
            pmremGenerator.dispose();
        });
        
        // Initialize stars
        this.starsSystem = new StarsSystem(this.scene);
        this.starsSystem.init();
    }
    
    updateSkyForTimeOfDay() {
        if (!this.sky || !this.timeController) return;
        
        const timeOfDay = this.timeController.timeOfDay;
        const elevation = 90 * Math.sin(timeOfDay - Math.PI/2);
        
        let azimuth = 180;
        if (timeOfDay < Math.PI) {
            azimuth = 90 + (timeOfDay / Math.PI) * 90;
        } else {
            azimuth = 180 + ((timeOfDay - Math.PI) / Math.PI) * 90;
        }
        
        this.sunElevation = elevation;
        
        // Update sun position
        const sunPosition = new THREE.Vector3().setFromSphericalCoords(
            1, 
            THREE.MathUtils.degToRad(90 - elevation),
            THREE.MathUtils.degToRad(azimuth)
        );
        
        const uniforms = this.sky.material.uniforms;
        uniforms.sunPosition.value.copy(sunPosition);
        
        // Update sky parameters based on time
        if (elevation > 45) {
            uniforms.turbidity.value = 3;
            uniforms.rayleigh.value = 0.8;
            uniforms.mieCoefficient.value = 0.0015;
            uniforms.mieDirectionalG.value = 0.85;
        } else if (elevation > 15) {
            const t = (elevation - 15) / 30;
            uniforms.turbidity.value = 6 + t * (3 - 6);
            uniforms.rayleigh.value = 0.8 + t * (0.8 - 0.8);
            uniforms.mieCoefficient.value = 0.013 + t * (0.0015 - 0.013);
            uniforms.mieDirectionalG.value = 0.9 + t * (0.85 - 0.9);
        }
        
        // Update lighting
        if (this.directionalLight) {
            const distance = 300;
            this.directionalLight.position.copy(sunPosition.clone().multiplyScalar(distance));
            
            let intensity;
            if (elevation > 0) {
                intensity = THREE.MathUtils.mapLinear(Math.min(elevation, 50), 0, 50, 1.0, 2.5);
            } else if (elevation > -6) {
                intensity = THREE.MathUtils.mapLinear(elevation, -6, 0, 0.3, 1.0);
            } else {
                intensity = 0.05;
            }
            
            this.directionalLight.intensity = intensity;
            
            // Update light color
            if (elevation > 15) {
                this.directionalLight.color.set(0xffe0c0);
            } else if (elevation > 0) {
                const t = elevation / 45;
                const color = new THREE.Color().setHSL(0.03 + t * 0.02, 1.0, 0.5 + t * 0.15);
                this.directionalLight.color.copy(color);
            } else {
                this.directionalLight.color.set(0x4466cc);
            }
        }
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xc8d8ff, 1.0);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        this.directionalLight = new THREE.DirectionalLight(0xfffaf0, 2.5);
        this.directionalLight.position.set(50, 100, 50);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 4096;
        this.directionalLight.shadow.mapSize.height = 4096;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 1000;
        this.directionalLight.shadow.camera.left = -300;
        this.directionalLight.shadow.camera.right = 300;
        this.directionalLight.shadow.camera.top = 300;
        this.directionalLight.shadow.camera.bottom = -300;
        this.directionalLight.shadow.bias = -0.0005;
        
        this.directionalLight.target = new THREE.Object3D();
        this.scene.add(this.directionalLight.target);
        this.scene.add(this.directionalLight);
    }
    
    setupTerrainSystem() {
        this.terrainTextures = this.loadTerrainTextures();
        this.updateTerrainChunks();
    }
    
    loadTerrainTextures() {
        const textureLoader = new THREE.TextureLoader();
        
        const colorTexture = textureLoader.load("https://play.rosebud.ai/assets/Ground080_1K-PNG_Color.png?DQQg");
        const normalTexture = textureLoader.load("https://play.rosebud.ai/assets/Ground080_1K-PNG_NormalGL.png?22xK");
        const roughnessTexture = textureLoader.load("https://play.rosebud.ai/assets/Ground080_1K-PNG_Roughness.png?XEW9");
        const aoTexture = textureLoader.load("https://play.rosebud.ai/assets/Ground080_1K-PNG_AmbientOcclusion.png?BUEw");
        const displacementTexture = textureLoader.load("https://play.rosebud.ai/assets/Ground080_1K-PNG_Displacement.png?fzD6");
        
        [colorTexture, normalTexture, roughnessTexture, aoTexture, displacementTexture].forEach(texture => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = this.isMobile ? 1 : 4;
            texture.generateMipmaps = !this.isMobile;
            if (this.isMobile) {
                texture.minFilter = THREE.LinearFilter;
            }
            texture.repeat.set(this.isMobile ? 12 : 8, this.isMobile ? 12 : 8);
        });
        
        return { colorTexture, normalTexture, roughnessTexture, aoTexture, displacementTexture };
    }
    
    createTerrainChunk(x, z) {
        const segments = this.isMobile ? 64 : 128;
        const geometry = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize, segments, segments);
        geometry.rotateX(-Math.PI / 2);
        
        // Apply height displacement for dune effect
        const vertices = geometry.attributes.position.array;
        const worldOffsetX = x * this.chunkSize;
        const worldOffsetZ = z * this.chunkSize;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const vertexX = vertices[i] + worldOffsetX;
            const vertexZ = vertices[i + 2] + worldOffsetZ;
            
            vertices[i + 1] = 
                4.5 * Math.sin(vertexX * 0.02) * Math.cos(vertexZ * 0.02) + 
                3.0 * Math.sin(vertexX * 0.05) * Math.sin(vertexZ * 0.05) +
                1.5 * Math.cos(vertexX * 0.1) * Math.sin(vertexZ * 0.1);
        }
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            map: this.terrainTextures.colorTexture,
            normalMap: this.terrainTextures.normalTexture,
            roughnessMap: this.terrainTextures.roughnessTexture,
            aoMap: this.terrainTextures.aoTexture,
            displacementMap: this.isMobile ? null : this.terrainTextures.displacementTexture,
            displacementScale: this.isMobile ? 0 : 0.5,
            roughness: 0.9,
            metalness: 0.05,
            side: this.isMobile ? THREE.FrontSide : THREE.DoubleSide
        });
        
        const chunk = new THREE.Mesh(geometry, material);
        chunk.position.set(x * this.chunkSize, 0, z * this.chunkSize);
        chunk.receiveShadow = true;
        chunk.castShadow = true;
        chunk.userData = { gridX: x, gridZ: z };
        
        this.scene.add(chunk);
        this.terrainChunks.push(chunk);
        
        return chunk;
    }
    
    updateTerrainChunks() {
        if (!this.spaceship) return;
        
        this.updateRenderDistance();
        
        const playerX = Math.round(this.spaceship.position.x / this.chunkSize);
        const playerZ = Math.round(this.spaceship.position.z / this.chunkSize);
        
        const keepChunks = [];
        const neededChunks = new Set();
        
        for (let x = playerX - this.chunksVisibleInDistance; x <= playerX + this.chunksVisibleInDistance; x++) {
            for (let z = playerZ - this.chunksVisibleInDistance; z <= playerZ + this.chunksVisibleInDistance; z++) {
                neededChunks.add(`${x},${z}`);
            }
        }
        
        for (let i = 0; i < this.terrainChunks.length; i++) {
            const chunk = this.terrainChunks[i];
            const chunkKey = `${chunk.userData.gridX},${chunk.userData.gridZ}`;
            
            if (neededChunks.has(chunkKey)) {
                keepChunks.push(chunk);
                neededChunks.delete(chunkKey);
            } else {
                this.scene.remove(chunk);
                chunk.geometry.dispose();
                chunk.material.dispose();
            }
        }
        
        this.terrainChunks = keepChunks;
        
        neededChunks.forEach(chunkKey => {
            const [x, z] = chunkKey.split(',').map(Number);
            this.createTerrainChunk(x, z);
        });
    }
    
    loadSpaceship(modelUrl = 'https://play.rosebud.ai/assets/Spaceship_RaeTheRedPanda.gltf?D7yt') {
        const loader = new GLTFLoader();
        
        if (this.spaceship) {
            const oldPosition = this.spaceship.position.clone();
            const oldRotation = this.spaceship.rotation.clone();
            this.scene.remove(this.spaceship);
            
            loader.load(modelUrl, (gltf) => {
                this.spaceship = gltf.scene;
                this.spaceship.scale.set(0.5, 0.5, 0.5);
                this.spaceship.position.copy(oldPosition);
                this.spaceship.rotation.copy(oldRotation);
                this.spaceship.castShadow = true;
                this.spaceship.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.scene.add(this.spaceship);
            });
        } else {
            loader.load(modelUrl, (gltf) => {
                this.spaceship = gltf.scene;
                this.spaceship.scale.set(0.5, 0.5, 0.5);
                this.spaceship.position.set(0, 5, 0);
                this.spaceship.rotation.y = Math.PI;
                this.spaceship.castShadow = true;
                this.spaceship.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.scene.add(this.spaceship);
            });
        }
    }
    
    initCrystalSystem() {
        this.crystalSystem = new CrystalSystem(this.scene);
        this.spawnCrystals(20);
        
        this.crystalSpawnInterval = setInterval(() => {
            if (this.crystalSystem.crystals.length < this.crystalSystem.maxCrystals) {
                const toSpawn = Math.min(5, this.crystalSystem.maxCrystals - this.crystalSystem.crystals.length);
                this.spawnCrystals(toSpawn);
            }
        }, 10000);
    }
    
    handleKeyDown(event) {
        this.keys[event.key] = true;
    }
    
    handleKeyUp(event) {
        this.keys[event.key] = false;
    }
    
    updateSpaceshipControls(delta) {
        if (!this.spaceship) return;
        
        // Update boost status
        this.isBoosting = this.keys['Shift'] && this.boostEnergy > 0;
        
        // Handle boost energy
        if (this.isBoosting) {
            this.boostEnergy = Math.max(0, this.boostEnergy - this.boostEnergyCostRate);
        } else {
            this.boostEnergy = Math.min(this.boostEnergyMax, this.boostEnergy + this.boostEnergyRegenRate);
        }
        
        const currentMaxSpeed = this.isBoosting ? this.boostMaxSpeed : this.maxSpeed;
        const currentAcceleration = this.isBoosting ? this.boostAcceleration : this.acceleration;
        
        // Movement controls
        if (this.keys['w']) {
            this.currentSpeed = Math.min(currentMaxSpeed, this.currentSpeed + currentAcceleration);
        } else if (this.keys['s']) {
            this.currentSpeed = Math.max(-this.maxSpeed / 2, this.currentSpeed - this.acceleration);
        } else {
            if (this.currentSpeed > 0) {
                this.currentSpeed = Math.max(0, this.currentSpeed - this.deceleration);
            } else if (this.currentSpeed < 0) {
                this.currentSpeed = Math.min(0, this.currentSpeed + this.deceleration);
            }
        }
        
        // Create particles when moving
        if (this.currentSpeed > 0) {
            if (this.isBoosting) {
                this.createBoostParticle();
            } else if (this.currentSpeed > this.maxSpeed * 0.4 && Math.random() > 0.7) {
                this.createBoostParticle();
            }
        }
        
        const currentTurnSpeed = this.isBoosting ? this.turnSpeed * 0.9 : this.turnSpeed;
        
        // Rotation controls with banking
        let tiltX = 0, tiltZ = 0;
        
        if (this.keys['a'] || this.keys['ArrowLeft']) {
            this.spaceship.rotation.y += currentTurnSpeed;
            tiltX = this.tiltAmount * (this.isBoosting ? 1.2 : 1);
        }
        
        if (this.keys['d'] || this.keys['ArrowRight']) {
            this.spaceship.rotation.y -= currentTurnSpeed;
            tiltX = -this.tiltAmount * (this.isBoosting ? 1.2 : 1);
        }
        
        const verticalSpeedMultiplier = this.isBoosting ? 0.7 : 0.5;
        
        // Vertical controls
        if (this.keys['e'] || this.keys['ArrowUp']) {
            this.spaceship.position.y += this.speed * verticalSpeedMultiplier;
            tiltZ = -this.tiltAmount / 2;
        }
        
        if (this.keys['q'] || this.keys['ArrowDown']) {
            const terrainHeight = this.getTerrainHeightAtPosition(this.spaceship.position.x, this.spaceship.position.z);
            const minimumHeight = terrainHeight + 3.0;
            
            if (this.spaceship.position.y > minimumHeight) {
                this.spaceship.position.y -= this.speed * verticalSpeedMultiplier;
                tiltZ = this.tiltAmount / 2;
            }
        }
        
        // Apply tilting
        const tiltResponseRate = this.isBoosting ? 0.15 : 0.1;
        this.spaceship.rotation.x = THREE.MathUtils.lerp(this.spaceship.rotation.x, tiltZ, tiltResponseRate);
        this.spaceship.rotation.z = THREE.MathUtils.lerp(this.spaceship.rotation.z, tiltX, tiltResponseRate);
        
        // Apply movement
        this.spaceship.position.x += Math.sin(this.spaceship.rotation.y) * this.currentSpeed;
        this.spaceship.position.z += Math.cos(this.spaceship.rotation.y) * this.currentSpeed;
        
        // Ensure spaceship stays above terrain
        const terrainHeight = this.getTerrainHeightAtPosition(this.spaceship.position.x, this.spaceship.position.z);
        const safetyBuffer = 3.0;
        this.spaceship.position.y = Math.max(terrainHeight + safetyBuffer, this.spaceship.position.y);
        
        // Update camera FOV for speed effect
        const targetFOV = this.calculateTargetFOV();
        const fovLerpFactor = this.isBoosting ? 0.1 : 0.05;
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, fovLerpFactor);
        this.camera.updateProjectionMatrix();
        
        // Update camera position
        const cameraDistance = this.isBoosting ? 13 : 11;
        const cameraHeight = this.isBoosting ? 6 : 5.5;
        
        const idealCameraX = this.spaceship.position.x - Math.sin(this.spaceship.rotation.y) * cameraDistance;
        const idealCameraY = this.spaceship.position.y + cameraHeight;
        const idealCameraZ = this.spaceship.position.z - Math.cos(this.spaceship.rotation.y) * cameraDistance;
        
        const cameraLerpFactor = this.isBoosting ? 0.07 : 0.05;
        
        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, idealCameraX, cameraLerpFactor);
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, idealCameraY, cameraLerpFactor);
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, idealCameraZ, cameraLerpFactor);
        
        this.camera.lookAt(this.spaceship.position);
    }
    
    calculateCurrentSpeed() {
        if (!this.prevPosition && this.spaceship) {
            this.prevPosition = this.spaceship.position.clone();
            return 0;
        }
        
        if (!this.spaceship) return 0;
        
        const distance = this.spaceship.position.distanceTo(this.prevPosition);
        this.prevPosition = this.spaceship.position.clone();
        
        return distance;
    }
    
    calculateTargetFOV() {
        const maxSpeedValue = this.isBoosting ? this.boostMaxSpeed : this.maxSpeed;
        const speedFactor = this.currentSpeed / maxSpeedValue;
        return this.baseFOV + (speedFactor * this.maxFOVBoost);
    }
    
    createBoostParticle() {
        if (this.particles.length >= this.maxParticles) return;
        
        const particleCount = this.isBoosting ? 3 : 1;
        
        for (let i = 0; i < particleCount; i++) {
            const spaceshipPos = this.spaceship.position.clone();
            const direction = new THREE.Vector3(
                Math.sin(this.spaceship.rotation.y),
                0,
                Math.cos(this.spaceship.rotation.y)
            );
            
            const particlePos = spaceshipPos.clone().sub(direction.multiplyScalar(1.2));
            particlePos.x += (Math.random() - 0.5) * 0.6;
            particlePos.y += (Math.random() - 0.5) * 0.6;
            particlePos.z += (Math.random() - 0.5) * 0.6;
            
            const geometry = new THREE.SphereGeometry(this.isBoosting ? 0.25 : 0.2, 8, 8);
            
            let particleColor;
            const colorRand = Math.random();
            
            if (this.isBoosting) {
                if (colorRand < 0.3) {
                    particleColor = 0xff2200;
                } else if (colorRand < 0.6) {
                    particleColor = 0xff6600;
                } else {
                    particleColor = 0xffcc00;
                }
            } else {
                if (colorRand < 0.3) {
                    particleColor = 0xff8800;
                } else if (colorRand < 0.7) {
                    particleColor = 0xffaa00;
                } else {
                    particleColor = 0xffcc44;
                }
            }
            
            const material = new THREE.MeshStandardMaterial({
                color: particleColor,
                transparent: true,
                opacity: 0.9,
                emissive: particleColor,
                emissiveIntensity: this.isBoosting ? 5.0 : 2.5,
                toneMapped: false
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(particlePos);
            
            particle.userData = {
                life: this.isBoosting ? 1.0 : 0.8,
                decay: this.isBoosting ? (0.01 + Math.random() * 0.02) : (0.03 + Math.random() * 0.03),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * (this.isBoosting ? 0.12 : 0.08),
                    0.12 + Math.random() * (this.isBoosting ? 0.25 : 0.15),
                    (Math.random() - 0.5) * (this.isBoosting ? 0.12 : 0.08)
                ),
                initialScale: this.isBoosting ? (0.4 + Math.random() * 0.5) : (0.2 + Math.random() * 0.2),
                color: particleColor,
                initialColor: new THREE.Color(particleColor)
            };
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }
    
    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.userData.life -= particle.userData.decay;
            
            if (particle.userData.life <= 0) {
                this.scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            
            particle.userData.velocity.x += (Math.random() - 0.5) * 0.01;
            particle.userData.velocity.y += (Math.random() - 0.5) * 0.01;
            particle.userData.velocity.z += (Math.random() - 0.5) * 0.01;
            
            particle.position.add(particle.userData.velocity);
            
            const lifeProgress = particle.userData.life;
            const easeOutQuad = 1 - (1 - lifeProgress) * (1 - lifeProgress);
            
            let scaleMultiplier;
            if (lifeProgress > 0.8) {
                scaleMultiplier = 0.8 + (1.0 - lifeProgress) * 1.0;
            } else {
                scaleMultiplier = lifeProgress * 1.2;
            }
            
            const scale = particle.userData.initialScale * scaleMultiplier;
            particle.scale.set(scale, scale, scale);
            
            if (lifeProgress < 0.3 && this.isBoosting) {
                const t = 1 - (lifeProgress / 0.3);
                const color = new THREE.Color(particle.userData.color);
                color.lerp(new THREE.Color(0xff3300), t);
                particle.material.color = color;
            } else if (!this.isBoosting) {
                particle.material.emissiveIntensity = 2.5 * easeOutQuad;
            }
            
            particle.material.opacity = this.isBoosting ? (easeOutQuad * 0.9) : (easeOutQuad * 0.7);
        }
    }
    
    updateRenderDistance() {
        if (!this.spaceship) return;
        
        const altitude = this.spaceship.position.y;
        const altitudeFactor = Math.min(1, altitude / this.minAltitudeForMaxRender);
        const newRenderDistance = this.baseChunksVisibleDistance + 
            Math.round(altitudeFactor * (this.maxChunksVisibleDistance - this.baseChunksVisibleDistance));
        
        if (newRenderDistance !== this.chunksVisibleInDistance) {
            this.chunksVisibleInDistance = newRenderDistance;
        }
    }
    
    getTerrainHeightAtPosition(x, z) {
        let maxHeight = -1000;
        
        for (const chunk of this.terrainChunks) {
            const chunkX = chunk.userData.gridX * this.chunkSize;
            const chunkZ = chunk.userData.gridZ * this.chunkSize;
            const halfSize = this.chunkSize / 2;
            
            if (x >= chunkX - halfSize && x <= chunkX + halfSize && 
                z >= chunkZ - halfSize && z <= chunkZ + halfSize) {
                
                const height = 
                    4.5 * Math.sin(x * 0.02) * Math.cos(z * 0.02) + 
                    3.0 * Math.sin(x * 0.05) * Math.sin(z * 0.05) +
                    1.5 * Math.cos(x * 0.1) * Math.sin(z * 0.1);
                
                maxHeight = Math.max(maxHeight, height);
            }
        }
        
        return maxHeight === -1000 ? 0 : maxHeight;
    }
    
    spawnCrystals(count = 5) {
        if (!this.crystalSystem) return;
        
        const playerPos = this.spaceship ? this.spaceship.position.clone() : new THREE.Vector3(0, 0, 0);
        
        for (let i = 0; i < count; i++) {
            const radius = 100 + Math.random() * 400;
            const angle = Math.random() * Math.PI * 2;
            
            const posX = playerPos.x + Math.cos(angle) * radius;
            const posZ = playerPos.z + Math.sin(angle) * radius;
            const terrainHeight = this.getTerrainHeightAtPosition(posX, posZ);
            const posY = terrainHeight + 3 + Math.random() * 8;
            
            const crystal = this.crystalSystem.createCrystal(new THREE.Vector3(posX, posY, posZ));
            crystal.userData.originalY = posY;
        }
    }
    
    collectCrystal(crystal) {
        if (!crystal || crystal.userData.collected) return;
        
        crystal.userData.collected = true;
        
        const pointValue = crystal.userData.value || 10;
        this.score += pointValue;
        this.crystalsCollected++;
        
        this.lastCollectedCrystalType = crystal.userData.type;
        
        console.log(`Crystal collected! Type: ${crystal.userData.type}, Value: ${pointValue}, Total Score: ${this.score}`);
        
        crystal.userData.collectionAnimation = {
            startTime: this.clock.getElapsedTime(),
            duration: 1.0,
            startPosition: crystal.position.clone(),
            startScale: crystal.scale.clone()
        };
        
        crystal.material = crystal.material.clone();
    }
    
    checkCrystalCollisions() {
        if (!this.crystalSystem || !this.spaceship) return;
        
        const shipPosition = this.spaceship.position.clone();
        const collectionDistance = this.crystalSystem.crystalHitbox;
        
        for (let i = this.crystalSystem.crystals.length - 1; i >= 0; i--) {
            const crystal = this.crystalSystem.crystals[i];
            
            if (crystal.userData.collected) continue;
            
            const distance = shipPosition.distanceTo(crystal.position);
            
            if (distance < collectionDistance) {
                this.collectCrystal(crystal);
            }
        }
    }
    
    updateCrystalAnimations(delta) {
        // This method can be used for additional crystal effects
    }
    
    cleanup() {
        window.removeEventListener('resize', this.handleResize.bind(this));
        window.removeEventListener('keydown', this.handleKeyDown.bind(this));
        window.removeEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Clean up terrain chunks
        for (const chunk of this.terrainChunks) {
            this.scene.remove(chunk);
            chunk.geometry.dispose();
            chunk.material.dispose();
        }
        this.terrainChunks = [];
        
        // Clean up spaceship
        if (this.spaceship) {
            this.scene.remove(this.spaceship);
        }
        
        // Clean up scene objects
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
            this.scene.remove(object);
        }
        
        // Clean up systems
        if (this.starsSystem) {
            this.starsSystem.dispose();
            this.starsSystem = null;
        }
        
        if (this.crystalSystem) {
            this.crystalSystem.dispose();
            this.crystalSystem = null;
            
            if (this.crystalSpawnInterval) {
                clearInterval(this.crystalSpawnInterval);
                this.crystalSpawnInterval = null;
            }
        }
        
        if (this.postProcessing) {
            this.postProcessing.dispose();
            this.postProcessing = null;
        }
        
        // Clean up DOM
        if (this.mountRef.current && this.renderer.domElement) {
            this.mountRef.current.removeChild(this.renderer.domElement);
        }
        
        this.renderer.dispose();
    }
}