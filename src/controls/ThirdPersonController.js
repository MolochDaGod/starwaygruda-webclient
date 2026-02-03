import * as THREE from 'three';

/**
 * Third-Person Shooter Controller
 * Professional TPS controls with:
 * - Orbiting camera system
 * - Shoulder view and aim-down-sights
 * - Weapon system with switching and reload
 * - Recoil and weapon sway
 * - Hit detection with raycasting
 */
export class ThirdPersonController {
    constructor(camera, character, domElement) {
        this.camera = camera;
        this.character = character;
        this.domElement = domElement;
        
        // Camera settings
        this.cameraDistance = 5;
        this.cameraHeight = 2;
        this.cameraOffset = new THREE.Vector3(1, 0, 0); // Shoulder offset
        this.cameraSmoothness = 0.1;
        this.cameraRotation = { yaw: 0, pitch: 0 };
        this.minPitch = -Math.PI / 3;
        this.maxPitch = Math.PI / 3;
        
        // Aiming
        this.isAiming = false;
        this.aimZoom = 2.5; // Closer camera when aiming
        this.aimFOV = 50;
        this.normalFOV = 75;
        
        // Weapon system
        this.currentWeapon = null;
        this.weapons = [];
        this.weaponIndex = 0;
        this.isReloading = false;
        this.canFire = true;
        this.recoil = new THREE.Vector2(0, 0);
        this.recoilRecovery = 0.1;
        
        // Raycasting for hit detection
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 1000;
        
        // Input state
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprint: false,
            jump: false,
            fire: false,
            reload: false,
            switchWeapon: false
        };
        
        this.mouseDelta = new THREE.Vector2(0, 0);
        this.sensitivity = 0.002;
        
        // Movement
        this.moveSpeed = 10;
        this.sprintMultiplier = 1.5;
        this.velocity = new THREE.Vector3();
        
        this.setupControls();
        console.log('🎮 Third-Person Controller initialized');
    }
    
    setupControls() {
        // Mouse movement
        this.domElement.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === this.domElement) {
                this.mouseDelta.x = e.movementX * this.sensitivity;
                this.mouseDelta.y = e.movementY * this.sensitivity;
            }
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'KeyW': this.input.forward = true; break;
                case 'KeyS': this.input.backward = true; break;
                case 'KeyA': this.input.left = true; break;
                case 'KeyD': this.input.right = true; break;
                case 'ShiftLeft': this.input.sprint = true; break;
                case 'Space': this.input.jump = true; break;
                case 'KeyR': this.reload(); break;
                case 'Digit1': this.switchWeapon(0); break;
                case 'Digit2': this.switchWeapon(1); break;
                case 'Digit3': this.switchWeapon(2); break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'KeyW': this.input.forward = false; break;
                case 'KeyS': this.input.backward = false; break;
                case 'KeyA': this.input.left = false; break;
                case 'KeyD': this.input.right = false; break;
                case 'ShiftLeft': this.input.sprint = false; break;
                case 'Space': this.input.jump = false; break;
            }
        });
        
        // Mouse buttons
        this.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.input.fire = true;
            } else if (e.button === 2) { // Right click
                this.isAiming = true;
            }
        });
        
        this.domElement.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.input.fire = false;
            } else if (e.button === 2) {
                this.isAiming = false;
            }
        });
        
        // Prevent context menu
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Weapon management
     */
    addWeapon(weapon) {
        this.weapons.push(weapon);
        if (!this.currentWeapon) {
            this.currentWeapon = weapon;
        }
    }
    
    switchWeapon(index) {
        if (index < this.weapons.length && !this.isReloading) {
            this.weaponIndex = index;
            this.currentWeapon = this.weapons[index];
            console.log(`Switched to ${this.currentWeapon.name}`);
        }
    }
    
    reload() {
        if (!this.currentWeapon || this.isReloading) return;
        
        if (this.currentWeapon.ammo < this.currentWeapon.maxAmmo) {
            this.isReloading = true;
            console.log('Reloading...');
            
            setTimeout(() => {
                this.currentWeapon.ammo = this.currentWeapon.maxAmmo;
                this.isReloading = false;
                console.log('Reload complete!');
            }, this.currentWeapon.reloadTime || 2000);
        }
    }
    
    /**
     * Fire weapon
     */
    fire(scene, targets = []) {
        if (!this.currentWeapon || !this.canFire || this.isReloading) return null;
        
        if (this.currentWeapon.ammo <= 0) {
            console.log('Out of ammo! Press R to reload');
            return null;
        }
        
        // Consume ammo
        this.currentWeapon.ammo--;
        this.canFire = false;
        
        // Fire rate cooldown
        setTimeout(() => {
            this.canFire = true;
        }, 1000 / (this.currentWeapon.fireRate || 5));
        
        // Apply recoil
        this.recoil.y += this.currentWeapon.recoil || 0.05;
        this.recoil.x += (Math.random() - 0.5) * (this.currentWeapon.recoil || 0.05) * 0.5;
        
        // Raycast from camera
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        
        // Add weapon spread
        const spread = this.currentWeapon.spread || 0.01;
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.normalize();
        
        this.raycaster.set(this.camera.position, direction);
        
        // Check for hits
        const intersects = this.raycaster.intersectObjects(targets, true);
        
        const result = {
            hit: false,
            target: null,
            point: null,
            distance: null
        };
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            result.hit = true;
            result.target = hit.object;
            result.point = hit.point;
            result.distance = hit.distance;
        }
        
        return result;
    }
    
    /**
     * Update camera position and rotation
     */
    updateCamera(delta) {
        // Apply mouse input to rotation
        this.cameraRotation.yaw -= this.mouseDelta.x;
        this.cameraRotation.pitch -= this.mouseDelta.y;
        
        // Apply recoil
        this.cameraRotation.pitch += this.recoil.y;
        this.cameraRotation.yaw += this.recoil.x;
        
        // Clamp pitch
        this.cameraRotation.pitch = Math.max(
            this.minPitch,
            Math.min(this.maxPitch, this.cameraRotation.pitch)
        );
        
        // Recover from recoil
        this.recoil.multiplyScalar(1 - this.recoilRecovery);
        
        // Reset mouse delta
        this.mouseDelta.set(0, 0);
        
        // Calculate target camera position
        const distance = this.isAiming ? this.aimZoom : this.cameraDistance;
        const targetPos = new THREE.Vector3();
        
        // Position behind and above character
        targetPos.x = this.character.position.x + 
            Math.sin(this.cameraRotation.yaw) * distance +
            this.cameraOffset.x * Math.cos(this.cameraRotation.yaw);
        targetPos.y = this.character.position.y + this.cameraHeight;
        targetPos.z = this.character.position.z + 
            Math.cos(this.cameraRotation.yaw) * distance +
            this.cameraOffset.x * Math.sin(this.cameraRotation.yaw);
        
        // Smooth camera movement
        this.camera.position.lerp(targetPos, this.cameraSmoothness);
        
        // Look at character (slightly above)
        const lookAt = this.character.position.clone();
        lookAt.y += 1.5;
        
        const currentLookAt = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookAt);
        currentLookAt.multiplyScalar(-1).add(this.camera.position);
        
        currentLookAt.lerp(lookAt, this.cameraSmoothness);
        this.camera.lookAt(currentLookAt);
        
        // Apply pitch rotation
        this.camera.rotateX(this.cameraRotation.pitch * this.cameraSmoothness);
        
        // Update FOV for aiming
        const targetFOV = this.isAiming ? this.aimFOV : this.normalFOV;
        this.camera.fov += (targetFOV - this.camera.fov) * 0.1;
        this.camera.updateProjectionMatrix();
    }
    
    /**
     * Update character movement
     */
    updateMovement(delta) {
        // Calculate movement direction relative to camera
        const forward = new THREE.Vector3(
            -Math.sin(this.cameraRotation.yaw),
            0,
            -Math.cos(this.cameraRotation.yaw)
        );
        
        const right = new THREE.Vector3(
            Math.cos(this.cameraRotation.yaw),
            0,
            -Math.sin(this.cameraRotation.yaw)
        );
        
        const moveDir = new THREE.Vector3();
        
        if (this.input.forward) moveDir.add(forward);
        if (this.input.backward) moveDir.sub(forward);
        if (this.input.left) moveDir.sub(right);
        if (this.input.right) moveDir.add(right);
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            
            // Apply speed
            let speed = this.moveSpeed;
            if (this.input.sprint && !this.isAiming) {
                speed *= this.sprintMultiplier;
            }
            if (this.isAiming) {
                speed *= 0.5; // Slower when aiming
            }
            
            this.velocity.x = moveDir.x * speed;
            this.velocity.z = moveDir.z * speed;
            
            // Rotate character to face movement direction
            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            const currentRotation = this.character.rotation.y;
            this.character.rotation.y = THREE.MathUtils.lerp(
                currentRotation,
                targetRotation,
                0.1
            );
        } else {
            // Decelerate
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
        }
        
        // Apply velocity
        this.character.position.x += this.velocity.x * delta;
        this.character.position.z += this.velocity.z * delta;
        
        // Jump (simple)
        if (this.input.jump) {
            this.velocity.y = 10;
            this.input.jump = false;
        }
        
        // Gravity
        this.velocity.y -= 20 * delta;
        this.character.position.y += this.velocity.y * delta;
        
        // Ground collision (simple)
        if (this.character.position.y < 1) {
            this.character.position.y = 1;
            this.velocity.y = 0;
        }
    }
    
    /**
     * Main update
     */
    update(delta) {
        this.updateMovement(delta);
        this.updateCamera(delta);
        
        // Handle firing
        if (this.input.fire && this.canFire) {
            return { firing: true };
        }
        
        return { firing: false };
    }
    
    /**
     * Get crosshair position for UI
     */
    getCrosshairPosition() {
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
    }
    
    /**
     * Get weapon info for UI
     */
    getWeaponInfo() {
        if (!this.currentWeapon) return null;
        
        return {
            name: this.currentWeapon.name,
            ammo: this.currentWeapon.ammo,
            maxAmmo: this.currentWeapon.maxAmmo,
            isReloading: this.isReloading
        };
    }
}

/**
 * Weapon class
 */
export class Weapon {
    constructor(config) {
        this.name = config.name || 'Weapon';
        this.damage = config.damage || 10;
        this.fireRate = config.fireRate || 5; // Rounds per second
        this.ammo = config.ammo || 30;
        this.maxAmmo = config.maxAmmo || 30;
        this.reloadTime = config.reloadTime || 2000; // ms
        this.spread = config.spread || 0.01;
        this.recoil = config.recoil || 0.05;
        this.range = config.range || 1000;
    }
}

// Preset weapons
export const WEAPONS = {
    PISTOL: new Weapon({
        name: 'Pistol',
        damage: 15,
        fireRate: 3,
        ammo: 12,
        maxAmmo: 12,
        reloadTime: 1500,
        spread: 0.02,
        recoil: 0.04
    }),
    
    RIFLE: new Weapon({
        name: 'Assault Rifle',
        damage: 25,
        fireRate: 8,
        ammo: 30,
        maxAmmo: 30,
        reloadTime: 2500,
        spread: 0.015,
        recoil: 0.06
    }),
    
    SNIPER: new Weapon({
        name: 'Sniper Rifle',
        damage: 80,
        fireRate: 1,
        ammo: 5,
        maxAmmo: 5,
        reloadTime: 3000,
        spread: 0.001,
        recoil: 0.15
    })
};

export default ThirdPersonController;
