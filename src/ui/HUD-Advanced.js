export class HUD {
    constructor() {
        this.fpsElement = document.getElementById('fps');
        this.positionElement = document.getElementById('position');
        this.planetElement = document.getElementById('planet');
        this.serverStatus = document.getElementById('server-status');
        this.scoreElement = document.getElementById('score');
        this.crystalsElement = document.getElementById('crystals');
        this.speedElement = document.getElementById('speed');
        
        this.setupChat();
    }
    
    updateFPS(fps) {
        this.fpsElement.textContent = fps;
    }
    
    updatePosition(x, y, z) {
        this.positionElement.textContent = 
            `${Math.round(x)}, ${Math.round(y)}, ${Math.round(z)}`;
    }
    
    setPlanet(planetName) {
        this.planetElement.textContent = planetName;
    }
    
    setServerStatus(status) {
        this.serverStatus.textContent = status;
        this.serverStatus.style.color = status === 'Connected' ? '#0f0' : '#f00';
    }
    
    updateScore(score, crystals) {
        if (this.scoreElement) {
            this.scoreElement.textContent = score || 0;
        }
        if (this.crystalsElement) {
            this.crystalsElement.textContent = crystals || 0;
        }
    }
    
    updateSpaceFlightData(data) {
        if (this.speedElement && data.speed !== undefined) {
            this.speedElement.textContent = `${Math.round(data.speed)} km/h`;
            
            // Color code speed
            if (data.boosting) {
                this.speedElement.style.color = '#ff6600';
                this.speedElement.style.textShadow = '0 0 5px #ff6600';
            } else if (data.speed > 30) {
                this.speedElement.style.color = '#ffff00';
                this.speedElement.style.textShadow = '0 0 5px #ffff00';
            } else {
                this.speedElement.style.color = '#00ffff';
                this.speedElement.style.textShadow = '0 0 5px #00ffff';
            }
        }
    }
    
    updateNearestPOI(poiName, distance) {
        // Keep for legacy compatibility
        console.log('POI:', poiName, distance);
    }
    
    setupChat() {
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');
        
        if (chatInput && chatMessages) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && chatInput.value.trim()) {
                    this.addChatMessage('You', chatInput.value);
                    chatInput.value = '';
                }
            });
        }
    }
    
    addChatMessage(username, message) {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.style.marginBottom = '5px';
            messageDiv.innerHTML = `<strong>${username}:</strong> ${message}`;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
}