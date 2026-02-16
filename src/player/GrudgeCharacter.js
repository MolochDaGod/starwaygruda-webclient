import * as THREE from 'three';

// Import from Grudge Studio SDK
import { ThirdPersonController } from 'grudge-studio/controllers';
import { AnimationController, AnimationStateMachine, AnimationState } from 'grudge-studio/render';

/**
 * GrudgeCharacter - Enhanced character using Grudge Studio SDK
 * Features: Advanced controller, animation state machine, procedural character
 */
export class GrudgeCharacter {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.options = {
            species: options.species || 'human',
            gender: options.gender || 'male',
            skinColor: options.skinColor || 0xffdbac,
            hairColor: options.hairColor || 0x3a2a1a,
            clothColor: options.clothColor || 0x3366aa,
            ...options
        };
        
        this.character = null;
        this.controller = null;
        this.animController = null;
        this.stateMachine = null;
        this.mixer = null;
        
        // Input state
        this.keys = {};
        this.mouseMovement = { x: 0, y: 0 };
        
        // Character parts for animation
        this.parts = {};
        
        console.log('🎮 GrudgeCharacter initializing with Grudge Studio SDK');
    }
    
    async init() {
        // Create the character mesh
        this.character = this.createCharacterMesh();
        this.scene.add(this.character);
        
        // Create animation controller
        this.mixer = new THREE.AnimationMixer(this.character);
        this.animController = AnimationController.fromModel(this.character);
        
        // Create animations
        this.createAnimations();
        
        // Create animation state machine
        this.createStateMachine();
        
        // Create the third person controller from grudge-studio
        this.controller = new ThirdPersonController(this.character, this.camera, {
            moveSpeed: 8,
            runSpeed: 16,
            jumpForce: 12,
            gravity: 25,
            cameraDistance: 8,
            cameraHeight: 4,
            cameraLookAtHeight: 1.5,
            shoulderOffset: 0.3,
            sensitivity: 0.003,
            minPitch: -0.8,
            maxPitch: 0.6
        });
        
        // Setup input handlers
        this.setupInput();
        
        console.log('✅ GrudgeCharacter ready with Grudge Studio controllers');
        return this.character;
    }
    
    createCharacterMesh() {
        const group = new THREE.Group();
        group.name = 'GrudgeCharacter';
        
        // Materials based on options
        const skinMat = new THREE.MeshStandardMaterial({
            color: this.options.skinColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const clothMat = new THREE.MeshStandardMaterial({
            color: this.options.clothColor,
            roughness: 0.7,
            metalness: 0.2
        });
        
        const darkClothMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a3a,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const hairMat = new THREE.MeshStandardMaterial({
            color: this.options.hairColor,
            roughness: 0.9,
            metalness: 0
        });
        
        const bootMat = new THREE.MeshStandardMaterial({
            color: 0x4a3020,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Species-based sizing
        const scale = this.getSpeciesScale();
        
        // === HEAD ===
        const headGroup = new THREE.Group();
        headGroup.name = 'head';
        
        const headGeo = new THREE.SphereGeometry(0.2 * scale, 20, 20);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.castShadow = true;
        headGroup.add(head);
        
        // Hair based on species/gender
        const hairGeo = new THREE.SphereGeometry(0.22 * scale, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.y = 0.05;
        headGroup.add(hair);
        
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.03 * scale, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.06 * scale, 0.02, 0.15 * scale);
        headGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.06 * scale, 0.02, 0.15 * scale);
        headGroup.add(rightEye);
        
        headGroup.position.y = 1.9 * scale;
        group.add(headGroup);
        this.parts.head = headGroup;
        
        // === TORSO ===
        const torsoGroup = new THREE.Group();
        torsoGroup.name = 'torso';
        
        // Upper torso
        const upperTorsoGeo = new THREE.CylinderGeometry(0.25 * scale, 0.22 * scale, 0.5 * scale, 12);
        const upperTorso = new THREE.Mesh(upperTorsoGeo, clothMat);
        upperTorso.position.y = 1.55 * scale;
        upperTorso.castShadow = true;
        torsoGroup.add(upperTorso);
        
        // Lower torso
        const lowerTorsoGeo = new THREE.CylinderGeometry(0.22 * scale, 0.2 * scale, 0.3 * scale, 12);
        const lowerTorso = new THREE.Mesh(lowerTorsoGeo, clothMat);
        lowerTorso.position.y = 1.15 * scale;
        lowerTorso.castShadow = true;
        torsoGroup.add(lowerTorso);
        
        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.08 * scale, 0.1 * scale, 0.12 * scale, 8);
        const neck = new THREE.Mesh(neckGeo, skinMat);
        neck.position.y = 1.75 * scale;
        torsoGroup.add(neck);
        
        group.add(torsoGroup);
        this.parts.torso = torsoGroup;
        
        // === ARMS ===
        // Left arm
        const leftArmGroup = new THREE.Group();
        leftArmGroup.name = 'leftArm';
        
        const upperArmGeo = new THREE.CylinderGeometry(0.06 * scale, 0.05 * scale, 0.35 * scale, 8);
        const leftUpperArm = new THREE.Mesh(upperArmGeo, clothMat);
        leftUpperArm.position.set(-0.32 * scale, 1.5 * scale, 0);
        leftUpperArm.rotation.z = 0.15;
        leftUpperArm.castShadow = true;
        leftArmGroup.add(leftUpperArm);
        
        const forearmGeo = new THREE.CylinderGeometry(0.05 * scale, 0.04 * scale, 0.3 * scale, 8);
        const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
        leftForearm.position.set(-0.38 * scale, 1.18 * scale, 0);
        leftForearm.castShadow = true;
        leftArmGroup.add(leftForearm);
        
        const handGeo = new THREE.SphereGeometry(0.05 * scale, 8, 8);
        const leftHand = new THREE.Mesh(handGeo, skinMat);
        leftHand.position.set(-0.4 * scale, 0.98 * scale, 0);
        leftArmGroup.add(leftHand);
        
        group.add(leftArmGroup);
        this.parts.leftArm = leftArmGroup;
        
        // Right arm
        const rightArmGroup = new THREE.Group();
        rightArmGroup.name = 'rightArm';
        
        const rightUpperArm = new THREE.Mesh(upperArmGeo, clothMat);
        rightUpperArm.position.set(0.32 * scale, 1.5 * scale, 0);
        rightUpperArm.rotation.z = -0.15;
        rightUpperArm.castShadow = true;
        rightArmGroup.add(rightUpperArm);
        
        const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
        rightForearm.position.set(0.38 * scale, 1.18 * scale, 0);
        rightForearm.castShadow = true;
        rightArmGroup.add(rightForearm);
        
        const rightHand = new THREE.Mesh(handGeo, skinMat);
        rightHand.position.set(0.4 * scale, 0.98 * scale, 0);
        rightArmGroup.add(rightHand);
        
        group.add(rightArmGroup);
        this.parts.rightArm = rightArmGroup;
        
        // === LEGS ===
        // Left leg
        const leftLegGroup = new THREE.Group();
        leftLegGroup.name = 'leftLeg';
        
        const thighGeo = new THREE.CylinderGeometry(0.1 * scale, 0.08 * scale, 0.45 * scale, 8);
        const leftThigh = new THREE.Mesh(thighGeo, darkClothMat);
        leftThigh.position.set(-0.1 * scale, 0.77 * scale, 0);
        leftThigh.castShadow = true;
        leftLegGroup.add(leftThigh);
        
        const shinGeo = new THREE.CylinderGeometry(0.07 * scale, 0.06 * scale, 0.4 * scale, 8);
        const leftShin = new THREE.Mesh(shinGeo, darkClothMat);
        leftShin.position.set(-0.1 * scale, 0.35 * scale, 0);
        leftShin.castShadow = true;
        leftLegGroup.add(leftShin);
        
        const footGeo = new THREE.BoxGeometry(0.1 * scale, 0.08 * scale, 0.2 * scale);
        const leftFoot = new THREE.Mesh(footGeo, bootMat);
        leftFoot.position.set(-0.1 * scale, 0.08 * scale, 0.03 * scale);
        leftFoot.castShadow = true;
        leftLegGroup.add(leftFoot);
        
        group.add(leftLegGroup);
        this.parts.leftLeg = leftLegGroup;
        
        // Right leg
        const rightLegGroup = new THREE.Group();
        rightLegGroup.name = 'rightLeg';
        
        const rightThigh = new THREE.Mesh(thighGeo, darkClothMat);
        rightThigh.position.set(0.1 * scale, 0.77 * scale, 0);
        rightThigh.castShadow = true;
        rightLegGroup.add(rightThigh);
        
        const rightShin = new THREE.Mesh(shinGeo, darkClothMat);
        rightShin.position.set(0.1 * scale, 0.35 * scale, 0);
        rightShin.castShadow = true;
        rightLegGroup.add(rightShin);
        
        const rightFoot = new THREE.Mesh(footGeo, bootMat);
        rightFoot.position.set(0.1 * scale, 0.08 * scale, 0.03 * scale);
        rightFoot.castShadow = true;
        rightLegGroup.add(rightFoot);
        
        group.add(rightLegGroup);
        this.parts.rightLeg = rightLegGroup;
        
        // Shadow blob
        const shadowGeo = new THREE.CircleGeometry(0.4 * scale, 16);
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
        
        return group;
    }
    
    getSpeciesScale() {
        const scales = {
            'human': 1.0,
            'wookiee': 1.3,
            'rodian': 0.95,
            'twi\'lek': 1.0,
            'zabrak': 1.0,
            'bothan': 0.9,
            'trandoshan': 1.1,
            'mon calamari': 0.95,
            'ithorian': 1.1,
            'sullustan': 0.85
        };
        return scales[this.options.species.toLowerCase()] || 1.0;
    }
    
    createAnimations() {
        // Create procedural animation clips
        const idleClip = this.createIdleClip();
        const walkClip = this.createWalkClip();
        const runClip = this.createRunClip();
        const jumpClip = this.createJumpClip();
        
        this.animController.addClip('idle', idleClip);
        this.animController.addClip('walk', walkClip);
        this.animController.addClip('run', runClip);
        this.animController.addClip('jump', jumpClip);
    }
    
    createIdleClip() {
        const duration = 2;
        const times = [0, 0.5, 1, 1.5, 2];
        const values = [0, 0, 0, 0, 0.015, 0, 0, 0, 0, 0, 0.015, 0, 0, 0, 0];
        const track = new THREE.VectorKeyframeTrack('.position', times, values);
        return new THREE.AnimationClip('idle', duration, [track]);
    }
    
    createWalkClip() {
        const duration = 0.8;
        const times = [0, 0.2, 0.4, 0.6, 0.8];
        const values = [0, 0, 0, 0, 0.02, 0, 0, 0, 0, 0, 0.02, 0, 0, 0, 0];
        const track = new THREE.VectorKeyframeTrack('.position', times, values);
        return new THREE.AnimationClip('walk', duration, [track]);
    }
    
    createRunClip() {
        const duration = 0.5;
        const times = [0, 0.125, 0.25, 0.375, 0.5];
        const values = [0, 0, 0, 0, 0.04, 0, 0, 0, 0, 0, 0.04, 0, 0, 0, 0];
        const track = new THREE.VectorKeyframeTrack('.position', times, values);
        return new THREE.AnimationClip('run', duration, [track]);
    }
    
    createJumpClip() {
        const duration = 0.4;
        const times = [0, 0.2, 0.4];
        const values = [0, 0, 0, 0, 0.1, 0, 0, 0, 0];
        const track = new THREE.VectorKeyframeTrack('.position', times, values);
        return new THREE.AnimationClip('jump', duration, [track]);
    }
    
    createStateMachine() {
        this.stateMachine = new AnimationStateMachine(this.animController, {
            isMoving: false,
            isRunning: false,
            isGrounded: true,
            speed: 0
        });
        
        // Create states
        const idleState = new AnimationState('idle', 'idle', { loop: true, speed: 1 });
        const walkState = new AnimationState('walk', 'walk', { loop: true, speed: 1 });
        const runState = new AnimationState('run', 'run', { loop: true, speed: 1.2 });
        const jumpState = new AnimationState('jump', 'jump', { loop: false, speed: 1 });
        
        // Add transitions
        idleState.addTransition('walk', ctx => ctx.isMoving && !ctx.isRunning && ctx.isGrounded);
        idleState.addTransition('run', ctx => ctx.isMoving && ctx.isRunning && ctx.isGrounded);
        idleState.addTransition('jump', ctx => !ctx.isGrounded);
        
        walkState.addTransition('idle', ctx => !ctx.isMoving && ctx.isGrounded);
        walkState.addTransition('run', ctx => ctx.isRunning && ctx.isGrounded);
        walkState.addTransition('jump', ctx => !ctx.isGrounded);
        
        runState.addTransition('idle', ctx => !ctx.isMoving && ctx.isGrounded);
        runState.addTransition('walk', ctx => ctx.isMoving && !ctx.isRunning && ctx.isGrounded);
        runState.addTransition('jump', ctx => !ctx.isGrounded);
        
        jumpState.addTransition('idle', ctx => ctx.isGrounded && !ctx.isMoving);
        jumpState.addTransition('walk', ctx => ctx.isGrounded && ctx.isMoving && !ctx.isRunning);
        jumpState.addTransition('run', ctx => ctx.isGrounded && ctx.isMoving && ctx.isRunning);
        
        this.stateMachine.addStates([idleState, walkState, runState, jumpState]);
        this.stateMachine.start('idle');
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.mouseMovement.x = e.movementX;
                this.mouseMovement.y = e.movementY;
            }
        });
        
        window.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                document.body.requestPointerLock();
            }
        });
        
        window.addEventListener('wheel', (e) => {
            this.controller.zoom(e.deltaY * 0.01);
        });
    }
    
    update(deltaTime, terrainHeightFn = null) {
        if (!this.controller) return;
        
        // Process input
        let moveX = 0;
        let moveZ = 0;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ = -1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ = 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX = -1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX = 1;
        
        const isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        const isJumping = this.keys['Space'];
        
        // Apply to controller
        this.controller.setMoveDirection(moveX, moveZ);
        this.controller.setRunning(isRunning);
        
        if (isJumping) {
            this.controller.jump();
        }
        
        // Handle mouse look
        if (this.mouseMovement.x !== 0 || this.mouseMovement.y !== 0) {
            this.controller.look(this.mouseMovement.x, this.mouseMovement.y);
            this.mouseMovement.x = 0;
            this.mouseMovement.y = 0;
        }
        
        // Update controller
        this.controller.update(deltaTime);
        
        // Ground check with terrain
        if (terrainHeightFn) {
            const pos = this.character.position;
            const groundY = terrainHeightFn(pos.x, pos.z);
            if (pos.y < groundY) {
                pos.y = groundY;
                this.controller.velocity.y = 0;
            }
        }
        
        // Update state machine context
        const state = this.controller.getState();
        this.stateMachine.setContext('isMoving', state.isMoving);
        this.stateMachine.setContext('isRunning', state.isRunning);
        this.stateMachine.setContext('isGrounded', state.isGrounded);
        this.stateMachine.setContext('speed', state.speed);
        
        // Update animation state machine
        this.stateMachine.update(deltaTime);
        
        // Procedural leg/arm animation
        this.updateProceduralAnimation(deltaTime, state);
        
        return {
            position: this.character.position.clone(),
            velocity: this.controller.getVelocity(),
            state: this.stateMachine.getCurrentStateName(),
            isGrounded: state.isGrounded,
            speed: state.speed
        };
    }
    
    updateProceduralAnimation(deltaTime, state) {
        const time = performance.now() / 1000;
        const speed = state.speed;
        
        if (speed > 0.5) {
            const frequency = speed > 8 ? 12 : 8;
            const amplitude = speed > 8 ? 0.4 : 0.25;
            
            // Leg swing
            if (this.parts.leftLeg && this.parts.rightLeg) {
                const legSwing = Math.sin(time * frequency) * amplitude;
                // Apply via children positions (simplified)
            }
            
            // Arm swing (opposite to legs)
            if (this.parts.leftArm && this.parts.rightArm) {
                const armSwing = Math.sin(time * frequency + Math.PI) * amplitude * 0.5;
                // Apply via children positions (simplified)
            }
        }
        
        // Breathing on torso
        if (this.parts.torso) {
            const breathe = Math.sin(time * 2) * 0.005;
            // Could apply subtle scale
        }
    }
    
    setPosition(x, y, z) {
        this.controller.teleport(new THREE.Vector3(x, y, z));
    }
    
    getPosition() {
        return this.character.position.clone();
    }
    
    getCharacterData() {
        const state = this.controller.getState();
        return {
            position: this.character.position.clone(),
            velocity: this.controller.getVelocity(),
            state: this.stateMachine.getCurrentStateName(),
            speed: state.speed,
            isGrounded: state.isGrounded,
            isRunning: state.isRunning
        };
    }
    
    dispose() {
        if (this.character && this.scene) {
            this.scene.remove(this.character);
        }
        if (this.animController) {
            this.animController.dispose();
        }
    }
}

export default GrudgeCharacter;
