# Tutorial Zone Connection Setup

## Changes Made

### 1. API Client Updates
- Added `login()` method to authenticate with SWGEmu server
- Added session token and account ID tracking
- Endpoint: `http://localhost:44453`

### 2. Character Selection Updates
- Default spawn location changed to **Tutorial zone**
- New characters spawn in `tutorial` planet
- Test character created with Tutorial zone assignment
- Planet selection properly passed to game client

### 3. Main Game Client Updates
- Added Tutorial zone terrain loading support
- Tutorial spawn point: `(0, 10, 0)` - center of zone
- Added Tutorial zone lighting:
  - Neutral white ambient light
  - Clear blue sky
  - Balanced fog settings
- Planet-based spawn logic:
  - `tutorial` → (0, 10, 0)
  - `tatooine` → (-1290, 12, -3590) Bestine
  - Default → (0, 10, 0)

### 4. Asset Loader Updates
- Added Tutorial biome:
  - Base color: Green grass `0x5d8a3a`
  - Water color: Blue `0x4a90e2`
  - Flat terrain with grass

### 5. POI Database Updates
- Added Tutorial zone POIs:
  - Tutorial Station (center spawn)
  - Training Area
  - Combat Training
  - Exit Terminal

## How It Works

1. **Login Flow**:
   - User enters username/password
   - Client attempts to connect to `http://localhost:44453/api/login`
   - On failure, falls back to offline mode with Tutorial character

2. **Character Selection**:
   - Characters are assigned to `tutorial` planet
   - Character data includes `planet: 'tutorial'` and `zone: 'Tutorial'`

3. **World Entry**:
   - Client loads Tutorial terrain
   - Spawns player at (0, 10, 0)
   - Sets up neutral Tutorial zone lighting
   - HUD shows "Tutorial Zone" as current planet

## Server Connection

The Docker container **StarWayGRUDA** runs the SWGEmu Core3 server with:
- **LoginServer**: Port 44453/UDP
- **ZoneServer**: Port 44455/TCP
- **Tutorial Zone**: Deployed and active

### Zones Available:
- Tutorial ✅
- Naboo ✅
- Tatooine ✅
- 10 Space Zones ✅

## Testing

To test the Tutorial zone connection:

```bash
# Start the dev server
npm run dev

# Open browser to http://localhost:8080

# Login with any credentials (offline mode will create Tutorial character)

# Select character and click "Enter World"

# You should spawn in Tutorial zone at coordinates (0, 10, 0)
```

## Future Enhancements

- [ ] Implement actual UDP connection to port 44453
- [ ] Parse SWG protocol packets
- [ ] Load Tutorial zone terrain from server
- [ ] Sync character position with ZoneServer
- [ ] Handle zone transfers
- [ ] Add Tutorial quest system
- [ ] Implement Tutorial NPCs
