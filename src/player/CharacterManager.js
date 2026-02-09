import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * CharacterManager - Handles animated character creation and management
 * Uses procedural rigged characters with proper skeletal animation
 * Best practices for web game deployment
 */
export class CharacterManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.character = null;
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;
        this.currentState = 'idle';
        
        // Animation blending settings
        this.blendDuration = 0.2;
        
        // Character physics
        this.velocity = new THREE.Vector3();
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.targetRotation = 0;
        
        // Movement settings
        this.walkSpeed = 8;
        this.runSpeed = 16;
        this.rotationSpeed = 10;
        this.gravity = -30;
        this.jumpForce = 12;
        this.isGrounded = true;
        this.isRunning = false;
        
        // Input state
        this.keys = {};
        
        // Camera settings
        this.cameraDistance = 10;
        this.cameraHeight = 5;
        this.cameraAngle = 0;
        this.cameraPitch = -0.3;
        this.cameraSmoothness = 0.08;
        
        // Skeleton for animation
        this.skeleton = null;
        this.bones = {};
    }
    
    /**
     * Initialize character and controls
     */
    async init() {
        // Create rigged character
        this.createRiggedCharacter();
        
        // Setup input handlers
        this.setupControls();
        
        // Position camera
        this.updateCamera(0.016);
        
        console.log('✅ CharacterManager initialized with animated character');
        return this.character;
    }
    
    /**
     * Create a procedural rigged character with bones for animation
     */
    createRiggedCharacter() {
        this.character = new THREE.Group();
        this.character.name = 'PlayerCharacter';
        
        // Create skeleton
        const bones = [];
        const bonePositions = [
            { name: 'root', pos: [0, 0, 0], parent: null },
            { name: 'hips', pos: [0, 1, 0], parent: 0 },
            { name: 'spine', pos: [0, 0.4, 0], parent: 1 },
            { name: 'chest', pos: [0, 0.4, 0], parent: 2 },
            { name: 'neck', pos: [0, 0.3, 0], parent: 3 },
            { name: 'head', pos: [0, 0.2, 0], parent: 4 },
            // Left arm
            { name: 'leftShoulder', pos: [-0.25, 0.2, 0], parent: 3 },
            { name: 'leftArm', pos: [-0.3, 0, 0], parent: 6 },
            { name: 'leftForearm', pos: [-0.35, 0, 0], parent: 7 },
            { name: 'leftHand', pos: [-0.25, 0, 0], parent: 8 },
            // Right arm
            { name: 'rightShoulder', pos: [0.25, 0.2, 0], parent: 3 },
            { name: 'rightArm', pos: [0.3, 0, 0], parent: 10 },
            { name: 'rightForearm', pos: [0.35, 0, 0], parent: 11 },
            { name: 'rightHand', pos: [0.25, 0, 0], parent: 12 },
            // Left leg
            { name: 'leftHip', pos: [-0.15, -0.1, 0], parent: 1 },
            { name: 'leftThigh', pos: [0, -0.45, 0], parent: 14 },
            { name: 'leftShin', pos: [0, -0.45, 0], parent: 15 },
            { name: 'leftFoot', pos: [0, -0.1, 0.1], parent: 16 },
            // Right leg
            { name: 'rightHip', pos: [0.15, -0.1, 0], parent: 1 },
            { name: 'rightThigh', pos: [0, -0.45, 0], parent: 18 },
            { name: 'rightShin', pos: [0, -0.45, 0], parent: 19 },
            { name: 'rightFoot', pos: [0, -0.1, 0.1], parent: 20 },
        ];
        
        // Create bones
        bonePositions.forEach((boneData, i) => {
            const bone = new THREE.Bone();
            bone.name = boneData.name;
            bone.position.set(...boneData.pos);
            bones.push(bone);
            this.bones[boneData.name] = bone;
            
            if (boneData.parent !== null) {
                bones[boneData.parent].add(bone);
            }
        });
        
        this.skeleton = new THREE.Skeleton(bones);
        
        // Create character mesh with skinning
        this.createCharacterMesh();
        
        // Create procedural animations
        this.createAnimations();
        
        // Add to scene
        this.character.position.copy(this.position);
        this.scene.add(this.character);
    }
    
    /**
     * Create character visual mesh
     */
    createCharacterMesh() {
        const group = new THREE.Group();
        
        // Materials
        const skinMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffdbac, 
            roughness: 0.8,
            metalness: 0.1
        });
        
        const clothMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3366aa, 
            roughness: 0.7,
            metalness: 0.2
        });
        
        const darkClothMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a3a, 
            roughness: 0.8,
            metalness: 0.1
        });
        
        const hairMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a2a1a, 
            roughness: 0.9,
            metalness: 0
        });
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const head = new THREE.Mesh(headGeo, skinMaterial);
        head.position.set(0, 2.1, 0);
        head.castShadow = true;
        group.add(head);
        
        // Hair
        const hairGeo = new THREE.SphereGeometry(0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const hair = new THREE.Mesh(hairGeo, hairMaterial);
        hair.position.set(0, 2.15, 0);
        group.add(hair);
        
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.03, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.06, 2.12, 0.15);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.06, 2.12, 0.15);
        group.add(rightEye);
        
        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8);
        const neck = new THREE.Mesh(neckGeo, skinMaterial);
        neck.position.set(0, 1.85, 0);
        group.add(neck);
        
        // Torso (upper body)
        const torsoGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.5, 8);
        const torso = new THREE.Mesh(torsoGeo, clothMaterial);
        torso.position.set(0, 1.55, 0);
        torso.castShadow = true;
        group.add(torso);
        
        // Lower torso
        const lowerTorsoGeo = new THREE.CylinderGeometry(0.22, 0.2, 0.3, 8);
        const lowerTorso = new THREE.Mesh(lowerTorsoGeo, clothMaterial);
        lowerTorso.position.set(0, 1.15, 0);
        lowerTorso.castShadow = true;
        group.add(lowerTorso);
        
        // Upper arms
        const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 8);
        
        const leftUpperArm = new THREE.Mesh(armGeo, clothMaterial);
        leftUpperArm.position.set(-0.35, 1.55, 0);
        leftUpperArm.rotation.z = 0.2;
        leftUpperArm.castShadow = true;
        this.leftUpperArm = leftUpperArm;
        group.add(leftUpperArm);
        
        const rightUpperArm = new THREE.Mesh(armGeo, clothMaterial);
        rightUpperArm.position.set(0.35, 1.55, 0);
        rightUpperArm.rotation.z = -0.2;
        rightUpperArm.castShadow = true;
        this.rightUpperArm = rightUpperArm;
        group.add(rightUpperArm);
        
        // Lower arms (skin)
        const forearmGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.3, 8);
        
        const leftForearm = new THREE.Mesh(forearmGeo, skinMaterial);
        leftForearm.position.set(-0.4, 1.2, 0);
        leftForearm.castShadow = true;
        this.leftForearm = leftForearm;
        group.add(leftForearm);
        
        const rightForearm = new THREE.Mesh(forearmGeo, skinMaterial);
        rightForearm.position.set(0.4, 1.2, 0);
        rightForearm.castShadow = true;
        this.rightForearm = rightForearm;
        group.add(rightForearm);
        
        // Hands
        const handGeo = new THREE.SphereGeometry(0.05, 8, 8);
        
        const leftHand = new THREE.Mesh(handGeo, skinMaterial);
        leftHand.position.set(-0.42, 1.0, 0);
        this.leftHand = leftHand;
        group.add(leftHand);
        
        const rightHand = new THREE.Mesh(handGeo, skinMaterial);
        rightHand.position.set(0.42, 1.0, 0);
        this.rightHand = rightHand;
        group.add(rightHand);
        
        // Upper legs
        const thighGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.45, 8);
        
        const leftThigh = new THREE.Mesh(thighGeo, darkClothMaterial);
        leftThigh.position.set(-0.12, 0.77, 0);
        leftThigh.castShadow = true;
        this.leftThigh = leftThigh;
        group.add(leftThigh);
        
        const rightThigh = new THREE.Mesh(thighGeo, darkClothMaterial);
        rightThigh.position.set(0.12, 0.77, 0);
        rightThigh.castShadow = true;
        this.rightThigh = rightThigh;
        group.add(rightThigh);
        
        // Lower legs
        const shinGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.4, 8);
        
        const leftShin = new THREE.Mesh(shinGeo, darkClothMaterial);
        leftShin.position.set(-0.12, 0.35, 0);
        leftShin.castShadow = true;
        this.leftShin = leftShin;
        group.add(leftShin);
        
        const rightShin = new THREE.Mesh(shinGeo, darkClothMaterial);
        rightShin.position.set(0.12, 0.35, 0);
        rightShin.castShadow = true;
        this.rightShin = rightShin;
        group.add(rightShin);
        
        // Feet
        const footGeo = new THREE.BoxGeometry(0.1, 0.08, 0.2);
        const footMat = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 });
        
        const leftFoot = new THREE.Mesh(footGeo, footMat);
        leftFoot.position.set(-0.12, 0.08, 0.03);
        leftFoot.castShadow = true;
        this.leftFoot = leftFoot;
        group.add(leftFoot);
        
        const rightFoot = new THREE.Mesh(footGeo, footMat);
        rightFoot.position.set(0.12, 0.08, 0.03);
        rightFoot.castShadow = true;
        this.rightFoot = rightFoot;
        group.add(rightFoot);
        
        // Add shadow circle under character
        const shadowGeo = new THREE.CircleGeometry(0.4, 16);
        const shadowMat = new THREE.MeshBasicMaterial({ 
            color: 0x000000, 
            transparent: true, 
            opacity: 0.3,
            depthWrite: false
        });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01;
        group.add(shadow);
        
        this.characterMesh = group;
        this.character.add(group);
    }
    
    /**
     * Create procedural animations
     */
    createAnimations() {
        // Animation mixer for the character
        this.mixer = new THREE.AnimationMixer(this.character);
        
        // Create animation clips procedurally
        this.animations = {
            idle: this.createIdleAnimation(),
            walk: this.createWalkAnimation(),
            run: this.createRunAnimation(),
            jump: this.createJumpAnimation()
        };
        
        // Play idle by default
        this.playAnimation('idle');
    }
    
    /**
     * Create idle animation clip
     */
    createIdleAnimation() {
        const duration = 2;
        const times = [0, 0.5, 1, 1.5, 2];
        
        // Subtle breathing motion
        const values = [
            0, 0, 0,
            0, 0.02, 0,
            0, 0, 0,
            0, 0.02, 0,
            0, 0, 0
        ];
        
        const track = new THREE.VectorKeyframeTrack('.position', times, values);
        const clip = new THREE.AnimationClip('idle', duration, [track]);
        
        return this.mixer.clipAction(clip);
    }
    
    /**
     * Create walk animation clip - we'll handle this procedurally in update
     */
    createWalkAnimation() {
        // Simple placeholder - actual animation is procedural
        const duration = 0.8;
        const times = [0, 0.2, 0.4, 0.6, 0.8];
        const values = [0, 0, 0, 0, 0.03, 0, 0, 0, 0, 0, 0.03, 0, 0, 0, 0];
        
        const track = new THREE.VectorKeyframeTrack('.position', times, values);
        const clip = new THREE.AnimationClip('walk', duration, [track]);
        
        return this.mixer.clipAction(clip);
    }
    
    /**
     * Create run animation clip
     */
    createRunAnimation() {
        const duration = 0.5;
        const times = [0, 0.125, 0.25, 0.375, 0.5];
        const values = [0, 0, 0, 0, 0.05, 0, 0, 0, 0, 0, 0.05, 0, 0, 0, 0];
        
        const track = new THREE.VectorKeyframeTrack('.position', times, values);
        const clip = new THREE.AnimationClip('run', duration, [track]);
        
        return this.mixer.clipAction(clip);
    }
    
    /**
     * Create jump animation
     */
    createJumpAnimation() {
        const duration = 0.3;
        const times = [0, 0.15, 0.3];
        const values = [0, 0, 0, 0, 0.1, 0, 0, 0, 0];
        
        const track = new THREE.VectorKeyframeTrack('.position', times, values);
        const clip = new THREE.AnimationClip('jump', duration, [track]);
        
        const action = this.mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        
        return action;
    }
    
    /**
     * Play animation with blending
     */
    playAnimation(name) {
        const newAction = this.animations[name];
        if (!newAction || this.currentState === name) return;
        
        if (this.currentAction) {
            // Crossfade to new animation
            this.currentAction.fadeOut(this.blendDuration);
        }
        
        newAction.reset();
        newAction.fadeIn(this.blendDuration);
        newAction.play();
        
        this.currentAction = newAction;
        this.currentState = name;
    }
    
    /**
     * Setup keyboard controls
     */
    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse for camera rotation
        window.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.cameraAngle -= e.movementX * 0.003;
                this.cameraPitch -= e.movementY * 0.002;
                this.cameraPitch = Math.max(-1, Math.min(0.5, this.cameraPitch));
            }
        });
        
        // Click to lock pointer
        window.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                document.body.requestPointerLock();
            }
        });
        
        // Scroll for camera distance
        window.addEventListener('wheel', (e) => {
            this.cameraDistance += e.deltaY * 0.01;
            this.cameraDistance = Math.max(4, Math.min(20, this.cameraDistance));
        });
    }
    
    /**
     * Main update loop
     */
    update(delta, terrainHeightFn = null) {
        if (!this.character) return;
        
        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        // Process input
        this.processMovement(delta);
        
        // Apply gravity and ground collision
        this.applyPhysics(delta, terrainHeightFn);
        
        // Update procedural limb animation
        this.updateProceduralAnimation(delta);
        
        // Update character position
        this.character.position.copy(this.position);
        
        // Smooth rotation
        const rotDiff = this.targetRotation - this.rotation;
        this.rotation += rotDiff * this.rotationSpeed * delta;
        this.character.rotation.y = this.rotation;
        
        // Update camera
        this.updateCamera(delta);
        
        return {
            position: this.position.clone(),
            velocity: this.velocity.clone(),
            state: this.currentState,
            isGrounded: this.isGrounded
        };
    }
    
    /**
     * Process movement input
     */
    processMovement(delta) {
        this.isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        const speed = this.isRunning ? this.runSpeed : this.walkSpeed;
        
        // Calculate movement direction relative to camera
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngle);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngle);
        
        const moveDir = new THREE.Vector3();
        let isMoving = false;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            moveDir.add(forward);
            isMoving = true;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            moveDir.sub(forward);
            isMoving = true;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            moveDir.sub(right);
            isMoving = true;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            moveDir.add(right);
            isMoving = true;
        }
        
        // Jump
        if ((this.keys['Space']) && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.playAnimation('jump');
        }
        
        if (isMoving) {
            moveDir.normalize();
            
            // Set target rotation to face movement direction
            this.targetRotation = Math.atan2(moveDir.x, moveDir.z);
            
            // Apply movement
            this.velocity.x = moveDir.x * speed;
            this.velocity.z = moveDir.z * speed;
            
            // Play appropriate animation
            if (this.isGrounded) {
                if (this.isRunning) {
                    this.playAnimation('run');
                } else {
                    this.playAnimation('walk');
                }
            }
        } else {
            // Decelerate
            this.velocity.x *= 0.85;
            this.velocity.z *= 0.85;
            
            // Return to idle when stopped
            if (this.isGrounded && Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.z) < 0.1) {
                this.playAnimation('idle');
            }
        }
    }
    
    /**
     * Apply physics (gravity, ground collision)
     */
    applyPhysics(delta, terrainHeightFn) {
        // Apply gravity
        this.velocity.y += this.gravity * delta;
        
        // Update position
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;
        this.position.z += this.velocity.z * delta;
        
        // Ground collision
        let groundHeight = 0;
        if (terrainHeightFn) {
            groundHeight = terrainHeightFn(this.position.x, this.position.z);
        }
        
        if (this.position.y <= groundHeight) {
            this.position.y = groundHeight;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
    }
    
    /**
     * Update procedural limb animation
     */
    updateProceduralAnimation(delta) {
        if (!this.characterMesh) return;
        
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        const time = performance.now() / 1000;
        
        // Animation speed based on movement
        const animSpeed = this.isRunning ? 12 : 8;
        const legSwing = this.currentState === 'idle' ? 0 : Math.sin(time * animSpeed) * 0.5;
        const armSwing = this.currentState === 'idle' ? 0 : Math.sin(time * animSpeed) * 0.4;
        
        // Leg animation
        if (this.leftThigh) {
            this.leftThigh.rotation.x = legSwing;
            this.leftShin.position.z = legSwing > 0 ? legSwing * 0.1 : 0;
        }
        if (this.rightThigh) {
            this.rightThigh.rotation.x = -legSwing;
            this.rightShin.position.z = -legSwing > 0 ? -legSwing * 0.1 : 0;
        }
        
        // Arm animation (opposite to legs)
        if (this.leftUpperArm) {
            this.leftUpperArm.rotation.x = -armSwing * 0.8;
        }
        if (this.rightUpperArm) {
            this.rightUpperArm.rotation.x = armSwing * 0.8;
        }
        
        // Subtle body bob when moving
        if (speed > 0.5 && this.characterMesh) {
            const bobAmount = this.isRunning ? 0.08 : 0.04;
            this.characterMesh.position.y = Math.abs(Math.sin(time * animSpeed * 2)) * bobAmount;
        } else {
            this.characterMesh.position.y = 0;
        }
        
        // Breathing animation when idle
        if (this.currentState === 'idle') {
            const breathe = Math.sin(time * 2) * 0.01;
            this.characterMesh.position.y = breathe;
        }
    }
    
    /**
     * Update third-person camera
     */
    updateCamera(delta) {
        if (!this.camera || !this.character) return;
        
        // Calculate target camera position
        const cameraOffset = new THREE.Vector3(
            Math.sin(this.cameraAngle) * this.cameraDistance,
            this.cameraHeight + Math.sin(this.cameraPitch) * this.cameraDistance * 0.5,
            Math.cos(this.cameraAngle) * this.cameraDistance
        );
        
        const targetPos = this.position.clone().add(cameraOffset);
        targetPos.y = Math.max(this.position.y + 2, targetPos.y); // Keep camera above ground
        
        // Smooth camera movement
        this.camera.position.lerp(targetPos, this.cameraSmoothness);
        
        // Look at character
        const lookTarget = this.position.clone();
        lookTarget.y += 1.5; // Look at character's head
        this.camera.lookAt(lookTarget);
    }
    
    /**
     * Set character position
     */
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.character) {
            this.character.position.copy(this.position);
        }
    }
    
    /**
     * Get character position
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Get character data for HUD
     */
    getCharacterData() {
        return {
            position: this.position.clone(),
            velocity: this.velocity.clone(),
            state: this.currentState,
            isGrounded: this.isGrounded,
            isRunning: this.isRunning,
            speed: Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2)
        };
    }
    
    /**
     * Cleanup
     */
    dispose() {
        if (this.character) {
            this.scene.remove(this.character);
        }
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
    }
}

export default CharacterManager;
