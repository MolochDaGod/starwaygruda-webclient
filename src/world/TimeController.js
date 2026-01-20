import * as THREE from 'three';

/**
 * Time Controller - Manages day/night cycles
 */
export class TimeController {
    constructor(scene) {
        this.scene = scene;
        this.timeOfDay = Math.PI; // Start at noon
        this.timeSpeed = 1; // 1 = normal speed
        this.paused = false;
        
        console.log('🕒 Time Controller initialized');
    }
    
    update() {
        if (this.paused) return;
        
        // Update time of day (0 to 2π represents full day cycle)
        this.timeOfDay += 0.001 * this.timeSpeed;
        
        // Wrap around after full day
        if (this.timeOfDay > Math.PI * 2) {
            this.timeOfDay -= Math.PI * 2;
        }
    }
    
    setTimeSpeed(speed) {
        this.timeSpeed = speed;
        console.log('⏰ Time speed set to:', speed);
    }
    
    pause() {
        this.paused = true;
    }
    
    resume() {
        this.paused = false;
    }
    
    setTimeOfDay(time) {
        // time should be 0-1 (0 = midnight, 0.5 = noon)
        this.timeOfDay = time * Math.PI * 2;
    }
    
    getTimeOfDayHours() {
        // Convert radians to 24-hour format
        const hours = (this.timeOfDay / (Math.PI * 2)) * 24;
        return hours;
    }
}