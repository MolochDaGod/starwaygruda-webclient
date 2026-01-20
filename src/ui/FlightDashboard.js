/**
 * Flight Dashboard UI - Shows speed, altitude, heading, boost
 * Based on the Desert Dunes Explorer design
 */
export class FlightDashboard {
    constructor() {
        this.element = null;
        this.isVisible = false;
        this.flightData = {
            speed: 0,
            altitude: 0,
            heading: 0,
            boostEnergy: 100,
            isBoosting: false
        };
        
        this.createDashboard();
    }
    
    createDashboard() {
        this.element = document.createElement('div');
        this.element.className = 'flight-dashboard';
        this.element.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 15px;
            background-color: rgba(0, 0, 0, 0.7);
            color: #ffcc66;
            border-radius: 10px;
            font-family: "Orbitron", monospace;
            z-index: 1000;
            box-shadow: 0 0 15px rgba(255, 153, 0, 0.4);
            border: 1px solid #ff9900;
            min-width: 200px;
            display: none;
            backdrop-filter: blur(10px);
        `;
        
        this.element.innerHTML = `
            <div class="flight-data">
                <div class="data-row">
                    <div class="data-label">SPEED:</div>
                    <div class="data-value" id="speed-value">0 km/h</div>
                </div>
                <div class="data-row">
                    <div class="data-label">ALT:</div>
                    <div class="data-value" id="altitude-value">0 m</div>
                </div>
                <div class="data-row">
                    <div class="data-label">HEADING:</div>
                    <div class="data-value" id="heading-value">0°</div>
                </div>
                
                <div class="boost-section">
                    <div class="boost-header">
                        <div class="boost-label">BOOST:</div>
                        <div class="boost-status" id="boost-status">READY</div>
                    </div>
                    <div class="boost-meter">
                        <div class="boost-bar" id="boost-bar"></div>
                    </div>
                    <div class="boost-hint">SHIFT KEY</div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .flight-dashboard .data-row {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .flight-dashboard .data-label {
                width: 80px;
                font-weight: bold;
                color: #ffaa33;
            }
            
            .flight-dashboard .data-value {
                color: #ffcc66;
                font-family: "Orbitron", monospace;
            }
            
            .flight-dashboard .boost-section {
                margin-top: 10px;
                border-top: 1px solid rgba(255, 153, 0, 0.3);
                padding-top: 10px;
            }
            
            .flight-dashboard .boost-header {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
            }
            
            .flight-dashboard .boost-label {
                font-weight: bold;
                color: #ffaa33;
                margin-right: 5px;
            }
            
            .flight-dashboard .boost-status {
                margin-left: 5px;
                font-size: 0.8rem;
                transition: all 0.3s ease;
            }
            
            .flight-dashboard .boost-meter {
                width: 100%;
                height: 10px;
                background-color: rgba(255, 153, 0, 0.1);
                border-radius: 5px;
                overflow: hidden;
                border: 1px solid rgba(255, 153, 0, 0.3);
                margin-bottom: 3px;
            }
            
            .flight-dashboard .boost-bar {
                height: 100%;
                width: 100%;
                background-color: #ffaa33;
                transition: width 0.1s ease, background-color 0.3s ease;
                border-radius: 4px;
            }
            
            .flight-dashboard .boost-hint {
                font-size: 0.7rem;
                text-align: right;
                opacity: 0.7;
                color: #ffcc66;
            }
            
            .flight-dashboard.boosting .boost-status {
                color: #ff3300;
                text-shadow: 0 0 5px rgba(255, 51, 0, 0.7);
            }
            
            .flight-dashboard.boosting .boost-bar {
                background-color: #ff3300;
                box-shadow: inset 0 0 5px rgba(255, 255, 0, 0.5);
            }
            
            .flight-dashboard.low-energy .boost-status {
                color: #ff5500;
            }
            
            .flight-dashboard.low-energy .boost-bar {
                background-color: #ff5500;
            }
            
            @keyframes dashboardEntrance {
                from {
                    opacity: 0;
                    transform: translateX(-100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .flight-dashboard.entering {
                animation: dashboardEntrance 0.5s ease-out;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.element);
    }
    
    show() {
        if (!this.isVisible) {
            this.element.style.display = 'block';
            this.element.classList.add('entering');
            this.isVisible = true;
            
            setTimeout(() => {
                this.element.classList.remove('entering');
            }, 500);
        }
    }
    
    hide() {
        if (this.isVisible) {
            this.element.style.display = 'none';
            this.isVisible = false;
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    update(flightData) {
        if (!this.isVisible) return;
        
        this.flightData = { ...this.flightData, ...flightData };
        
        // Update values
        document.getElementById('speed-value').textContent = `${Math.round(this.flightData.speed)} km/h`;
        document.getElementById('altitude-value').textContent = `${Math.round(this.flightData.altitude)} m`;
        document.getElementById('heading-value').textContent = `${Math.round(this.flightData.heading)}°`;
        
        // Update boost status
        const boostStatus = document.getElementById('boost-status');
        const boostBar = document.getElementById('boost-bar');
        
        if (this.flightData.isBoosting) {
            boostStatus.textContent = 'ACTIVE';
            this.element.classList.add('boosting');
            this.element.classList.remove('low-energy');
        } else if (this.flightData.boostEnergy < 20) {
            boostStatus.textContent = 'LOW';
            this.element.classList.remove('boosting');
            this.element.classList.add('low-energy');
        } else {
            boostStatus.textContent = 'READY';
            this.element.classList.remove('boosting');
            this.element.classList.remove('low-energy');
        }
        
        // Update boost bar
        boostBar.style.width = `${this.flightData.boostEnergy}%`;
    }
    
    dispose() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}