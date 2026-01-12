export class HUD {
    constructor() {
        this.fpsElement = document.getElementById('fps');
        this.positionElement = document.getElementById('position');
        this.planetElement = document.getElementById('planet');
        this.serverStatus = document.getElementById('server-status');
        this.poiElement = document.getElementById('nearest-poi');
        
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
    
    updateNearestPOI(poiName, distance) {
        if (this.poiElement) {
            if (poiName && distance !== null) {
                this.poiElement.textContent = `${poiName} (${Math.round(distance)}m)`;
            } else {
                this.poiElement.textContent = 'None';
            }
        }
    }
    
    setupChat() {
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim()) {
                this.addChatMessage('You', chatInput.value);
                chatInput.value = '';
            }
        });
    }
    
    addChatMessage(username, message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.style.marginBottom = '5px';
        messageDiv.innerHTML = `<strong>${username}:</strong> ${message}`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}
