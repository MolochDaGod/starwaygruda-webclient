# StarWayGRUDA Server Deployment Guide

🎮 **Complete server deployment and management system for StarWayGRUDA**

## Quick Start

### Option 1: Instant Launch (Recommended)
```bash
# Double-click to launch
LAUNCH-GAME.bat
```

### Option 2: Command Line
```bash
# Quick server start
npm run quick-start

# Full management interface
npm run manager

# System health check
npm run status
```

## 🎯 What's Been Fixed

### ✅ Server Architecture
- **Enhanced Bridge Server**: Complete multiplayer networking with Socket.IO
- **WebSocket Support**: Real-time player communication and synchronization
- **Session Management**: Proper user authentication and cleanup
- **Error Handling**: Comprehensive error catching and graceful failures
- **Health Monitoring**: `/api/health` endpoint for system status

### ✅ Deployment Infrastructure
- **PM2 Integration**: Production-ready process management
- **Environment Configuration**: Separate dev/prod settings
- **Auto-reload Development**: File watching for rapid development
- **Comprehensive Testing**: Automated server functionality tests

### ✅ Multiplayer Features
- **Player Position Sync**: Real-time coordinate sharing
- **Chat System**: Global and zone-based messaging
- **Zone Transfers**: Seamless planet transitions
- **Character Management**: Save/load character data
- **Room Management**: Automatic player grouping

### ✅ Management Tools
- **Server Manager**: Complete control panel via PowerShell
- **Health Monitoring**: System status and diagnostics
- **Log Management**: Centralized logging and debugging
- **Quick Deploy**: One-click production deployment

## 🚀 Server Startup Options

### Development Mode
```bash
# Start bridge server only (fastest)
quick-start-server.ps1

# Start with auto-reload (development)
server-manager.ps1 → Option 2
```

### Production Mode
```bash
# Deploy with PM2 (recommended for production)
server-manager.ps1 → Option 5

# Full deployment pipeline
deploy-all.ps1
```

## 📊 Server Endpoints

| Endpoint | Purpose | URL |
|----------|---------|-----|
| **Web Client** | Main game interface | http://localhost:3001 |
| **WebSocket** | Real-time multiplayer | ws://localhost:3001 |
| **API Health** | Server status check | http://localhost:3001/api/health |
| **Character API** | Character management | http://localhost:3001/api/characters |
| **Chat API** | Message handling | http://localhost:3001/api/chat |

## 🎮 Multiplayer Features

### Real-time Communication
- **Global Chat**: Server-wide messaging
- **Zone Chat**: Planet-specific channels
- **Private Messages**: Direct player communication
- **System Messages**: Server announcements

### Player Synchronization
- **Position Updates**: Real-time coordinate sharing
- **Zone Transitions**: Seamless planet changes
- **Player Discovery**: See other online players
- **Session Management**: Automatic cleanup

### Character System
- **Character Creation**: Web-based character builder
- **Data Persistence**: Character save/load
- **Session Tracking**: Login/logout handling
- **Multi-character Support**: Multiple characters per account

## 🛠️ Management Commands

### Quick Actions
```bash
npm run quick-start     # Fast server startup
npm run manager        # Full management interface
npm run status         # System health check
npm run health         # Server health only
npm run test          # Run server tests
```

### PowerShell Scripts
```powershell
# Server management (recommended)
.\server-manager.ps1

# Quick deployment
.\quick-start-server.ps1

# System diagnostics
.\system-health.ps1

# Complete deployment
.\deploy-all.ps1
```

### Production Management
```bash
# PM2 commands (after production deployment)
pm2 status            # Check process status
pm2 logs             # View server logs
pm2 restart starway-bridge  # Restart server
pm2 stop starway-bridge     # Stop server
pm2 delete starway-bridge   # Remove process
```

## 📋 System Requirements

### Required
- **Node.js 16+**: JavaScript runtime
- **NPM**: Package manager (included with Node.js)
- **Windows PowerShell**: For management scripts

### Optional (Production)
- **PM2**: Production process manager
- **WSL2**: For SWGEmu server integration

### Development Tools
- **Nodemon**: Auto-reload development (installed automatically)
- **Socket.IO**: WebSocket communication (included)
- **Express.js**: Web server framework (included)

## 🔧 Configuration

### Environment Variables
Create `server/.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development
HOST=localhost

# SWGEmu Integration
SWGEMU_HOST=localhost
SWGEMU_LOGIN_PORT=44453
SWGEMU_ZONE_PORT=44455

# Security
SESSION_SECRET=your-secret-key-here
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

### PM2 Configuration
The `ecosystem.config.cjs` file handles production deployment:
- Process management and monitoring
- Environment variable injection
- Log file configuration
- Restart policies

## 🐛 Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check Node.js installation
node --version

# Install dependencies
npm install
cd server && npm install

# Check port availability
netstat -an | findstr :3001
```

#### WebSocket Connection Failed
- Ensure server is running on port 3001
- Check firewall settings
- Verify client connection URL
- Review browser console for errors

#### PM2 Issues
```bash
# Install PM2 globally
npm install -g pm2

# Reset PM2
pm2 kill
pm2 start ecosystem.config.cjs
```

### Debug Mode
Enable detailed logging:
```env
# In server/.env
LOG_LEVEL=debug
NODE_ENV=development
```

## 🔒 Security Features

### Session Management
- Secure session handling
- Automatic session cleanup
- Connection rate limiting
- CORS protection

### Data Validation
- Input sanitization
- Command validation
- Error boundary protection
- Graceful failure handling

## 📈 Performance

### Optimizations
- **Connection Pooling**: Efficient WebSocket management
- **Memory Management**: Automatic garbage collection
- **Event Batching**: Reduced network overhead
- **Caching**: Frequently accessed data caching

### Monitoring
- **Health Endpoints**: `/api/health` for status monitoring
- **Performance Metrics**: Memory usage, uptime, connections
- **Error Tracking**: Comprehensive error logging
- **Resource Usage**: CPU and memory monitoring

## 🚀 Deployment Options

### Local Development
1. Run `quick-start-server.ps1`
2. Access http://localhost:3001
3. Start gaming!

### Production Deployment
1. Run `server-manager.ps1`
2. Choose option 5 (Deploy to production)
3. Server runs with PM2 process manager
4. Automatic restart on failure

### Cloud Deployment
- **VPS**: Deploy to DigitalOcean, AWS EC2, etc.
- **Docker**: Container deployment (via mtgserver/docker)
- **Vercel**: Client-side deployment for web interface

## 📚 API Documentation

### WebSocket Events

#### Client → Server
```javascript
// Player actions
socket.emit('player:move', { x, y, z, zone });
socket.emit('chat:send', { message, channel });
socket.emit('zone:transfer', { targetZone });

// Character management
socket.emit('character:select', { characterId });
socket.emit('character:create', { characterData });
```

#### Server → Client
```javascript
// Player updates
socket.on('player:moved', (playerData));
socket.on('chat:message', (messageData));
socket.on('zone:changed', (zoneData));

// System events
socket.on('player:joined', (playerInfo));
socket.on('player:left', (playerId));
```

### HTTP API Endpoints

#### Health Check
```
GET /api/health
Returns: { status: 'ok', stats: { uptime, connectedPlayers, memoryUsage } }
```

#### Character Management
```
GET    /api/characters      # List characters
POST   /api/characters      # Create character
GET    /api/characters/:id  # Get character
PUT    /api/characters/:id  # Update character
DELETE /api/characters/:id  # Delete character
```

## 🎯 Next Steps

### Immediate Actions
1. **Test the Server**: Run system health check
2. **Start Gaming**: Use quick-start option
3. **Invite Players**: Share the server URL
4. **Monitor Performance**: Check health endpoints

### Future Enhancements
- **Database Integration**: Persistent character storage
- **Load Balancing**: Multiple server instances
- **Advanced Security**: Authentication systems
- **Metrics Dashboard**: Real-time monitoring UI

---

## 🎮 Ready to Game!

Your StarWayGRUDA server is now fully operational with:
- ✅ Complete multiplayer networking
- ✅ Production-ready deployment
- ✅ Comprehensive management tools
- ✅ Real-time communication
- ✅ Automatic error recovery

**Launch the game with `LAUNCH-GAME.bat` and start your adventure!**