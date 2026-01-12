# 🔌 StarWayGRUDA Port Allocation

## Available Ports

You have opened ports **8080-8084** for StarWayGRUDA services.

## Current Allocation

### Web Services (8080-8084)

| Port | Service | Status | Purpose |
|------|---------|--------|---------|
| **8080** | Web Client | ✅ Active | Main game client (Vite dev server) |
| **8081** | API Gateway | 🔄 Available | REST API / WebSocket bridge |
| **8082** | Admin Panel | 🔄 Available | Server admin interface |
| **8083** | Metrics | 🔄 Available | Prometheus/Grafana metrics |
| **8084** | Assets CDN | 🔄 Available | Static asset server |

### Game Server (Docker Core3)

| Port | Service | Status | Purpose |
|------|---------|--------|---------|
| **44453** | Login Server | ✅ Running | SWGEmu authentication |
| **44455** | Zone Server | ✅ Running | Game world/zone server |
| **44462** | Ping Server | ✅ Running | Server status checks |
| **44463** | Status Server | ✅ Running | Server info |
| **2222** | SSH | ✅ Running | Docker container SSH |

## Service URLs

### Player Access
- **Game Client**: http://localhost:8080
- **Character Selection**: http://localhost:8080 (auto-loads)

### Developer Access
- **API Docs** (when implemented): http://localhost:8081
- **Admin Panel** (when implemented): http://localhost:8082
- **Metrics** (when implemented): http://localhost:8083

## Recommended Usage

### 8081 - API Gateway/WebSocket Bridge
Create a Node.js server that:
- Bridges HTTP/WebSocket to SWGEmu UDP protocol
- Provides REST API for character management
- Handles authentication tokens
- Proxies game server communication

**Example:**
```javascript
// Server on port 8081
const express = require('express');
const WebSocket = require('ws');
const dgram = require('dgram');

const app = express();
const wss = new WebSocket.Server({ port: 8081 });

// Bridge WebSocket to SWGEmu UDP
wss.on('connection', (ws) => {
  const udpClient = dgram.createSocket('udp4');
  
  ws.on('message', (data) => {
    // Forward to SWGEmu port 44453
    udpClient.send(data, 44453, 'localhost');
  });
  
  udpClient.on('message', (msg) => {
    ws.send(msg);
  });
});
```

### 8082 - Admin Panel
Web interface for:
- Server management
- Player accounts
- Character editing
- Database queries
- Server logs
- Performance monitoring

### 8083 - Metrics
Monitoring dashboard:
- Server uptime
- Player count
- Performance metrics
- Database stats
- Error logs

### 8084 - Asset Server
Static file server for:
- SWG terrain heightmaps
- Texture files (.dds)
- 3D models (.iff, .msh)
- Audio files
- Configuration files

## Docker Port Mapping

When running additional services in Docker:

```bash
# API Gateway
docker run -d -p 8081:8081 --name swg-api \
  --link StarWayGRUDA:core3 \
  swg-api-gateway

# Admin Panel
docker run -d -p 8082:80 --name swg-admin \
  --link StarWayGRUDA:core3 \
  swg-admin-panel

# Metrics
docker run -d -p 8083:3000 --name swg-metrics \
  --link StarWayGRUDA:core3 \
  grafana/grafana

# Asset CDN
docker run -d -p 8084:80 --name swg-assets \
  -v ./public/assets:/usr/share/nginx/html \
  nginx:alpine
```

## Network Architecture

```
┌─────────────────────────────────────────────────┐
│  Players (Browser)                              │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│  Port 8080 - Web Client (Vite/Three.js)         │
│  - Character Selection                           │
│  - 3D Game Renderer                             │
│  - HUD/UI                                       │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│  Port 8081 - API Gateway/WebSocket Bridge       │
│  - HTTP → UDP translation                        │
│  - WebSocket ↔ SWGEmu protocol                  │
│  - Authentication                                │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│  Docker: StarWayGRUDA Container                  │
│  ├─ Port 44453 (Login Server)                   │
│  ├─ Port 44455 (Zone Server)                    │
│  ├─ Port 44462 (Ping)                           │
│  └─ Port 44463 (Status)                         │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│  MySQL Database (in Docker)                      │
│  - Accounts, Characters, Objects                 │
└──────────────────────────────────────────────────┘

         ┌────────────────────┐
         │  Port 8082         │
         │  Admin Panel       │
         │  (Management)      │
         └────────────────────┘

         ┌────────────────────┐
         │  Port 8083         │
         │  Metrics           │
         │  (Monitoring)      │
         └────────────────────┘

         ┌────────────────────┐
         │  Port 8084         │
         │  Asset CDN         │
         │  (Static Files)    │
         └────────────────────┘
```

## Firewall Rules

If deploying to production, open these ports:

```bash
# Web services (public)
sudo ufw allow 8080/tcp  # Web client
sudo ufw allow 8081/tcp  # API Gateway
sudo ufw allow 8082/tcp  # Admin panel (consider restricting)
sudo ufw allow 8083/tcp  # Metrics (consider restricting)
sudo ufw allow 8084/tcp  # Asset CDN

# Game server (public)
sudo ufw allow 44453/udp  # Login
sudo ufw allow 44455/tcp  # Zone
sudo ufw allow 44462/udp  # Ping
sudo ufw allow 44463/udp  # Status
```

## Development Workflow

1. **Start Docker server**: `docker start StarWayGRUDA`
2. **Start web client**: `npm run dev` (port 8080)
3. **Start API gateway**: `npm run api` (port 8081)
4. **Start admin panel**: `npm run admin` (port 8082)
5. **Access metrics**: http://localhost:8083
6. **Access assets**: http://localhost:8084

## Current Status

✅ **Active**:
- Port 8080: Web Client (Vite)
- Port 44453-44463: Docker Core3 Server

🔄 **Available for Development**:
- Port 8081: API Gateway
- Port 8082: Admin Panel
- Port 8083: Metrics
- Port 8084: Asset Server

## Next Steps

1. Create API Gateway on port 8081
2. Build Admin Panel on port 8082
3. Set up monitoring on port 8083
4. Configure asset CDN on port 8084

---

**Need help setting up any of these services? Let me know!**
