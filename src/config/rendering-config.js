/**
 * Rendering Configuration for StarWayGRUDA
 * Optimized for performance with LOD system
 */

export const RenderingConfig = {
    // View Distance Zones
    viewDistance: {
        // Full detail render distance (terrain + objects + trees + everything)
        full: 2000, // 2km - full detail
        
        // Terrain-only render distance (just ground, no objects)
        terrainOnly: 5000, // 5km - terrain ground only
        
        // Maximum world size (boundaries)
        worldSize: 15000, // 15km playable area
    },

    // Level of Detail (LOD) settings
    lod: {
        // High detail: 0-1km
        high: {
            distance: 1000,
            terrainSegments: 256,
            objectDetail: 'high',
            drawTrees: true,
            drawRocks: true,
            drawGrass: true,
            shadowQuality: 'high'
        },
        
        // Medium detail: 1-2km
        medium: {
            distance: 2000,
            terrainSegments: 128,
            objectDetail: 'medium',
            drawTrees: true,
            drawRocks: true,
            drawGrass: false,
            shadowQuality: 'medium'
        },
        
        // Low detail: 2-5km (terrain only)
        low: {
            distance: 5000,
            terrainSegments: 64,
            objectDetail: 'none', // No objects beyond 2km
            drawTrees: false,
            drawRocks: false,
            drawGrass: false,
            shadowQuality: 'none'
        }
    },

    // Chunk-based terrain streaming
    terrain: {
        chunkSize: 256, // 256m chunks
        chunksVisible: 8, // 8x8 grid = ~2km visible
        chunksPreload: 16, // 16x16 grid for streaming
        updateInterval: 100, // ms between chunk updates
    },

    // Object culling
    culling: {
        // Don't render buildings beyond 2km
        buildings: 2000,
        
        // Don't render trees beyond 1.5km
        trees: 1500,
        
        // Don't render small objects beyond 1km
        smallObjects: 1000,
        
        // Don't render other players beyond 2km
        players: 2000,
        
        // Always render landmarks (special POI)
        landmarks: 5000,
    },

    // Performance settings
    performance: {
        targetFPS: 60,
        maxTriangles: 500000, // Maximum triangles to render
        frustumCulling: true,
        occlusionCulling: false, // Too expensive, leave off
        instancing: true, // Use instancing for repeated objects
    },

    // Fog settings (helps hide pop-in at distance)
    fog: {
        enabled: true,
        near: 1000, // Start fog at 1km
        far: 5000,  // Full fog at 5km
        color: 0x87ceeb, // Sky blue
        density: 0.0001
    }
};

/**
 * Get LOD level based on distance
 * @param {number} distance - Distance from camera
 * @returns {string} LOD level: 'high', 'medium', or 'low'
 */
export function getLODLevel(distance) {
    if (distance < RenderingConfig.lod.high.distance) return 'high';
    if (distance < RenderingConfig.lod.medium.distance) return 'medium';
    if (distance < RenderingConfig.lod.low.distance) return 'low';
    return 'culled'; // Beyond render distance
}

/**
 * Should render object at this distance?
 * @param {string} objectType - Type: 'building', 'tree', 'player', etc.
 * @param {number} distance - Distance from camera
 * @returns {boolean}
 */
export function shouldRenderObject(objectType, distance) {
    const maxDist = RenderingConfig.culling[objectType] || RenderingConfig.viewDistance.full;
    return distance <= maxDist;
}

/**
 * Calculate terrain segment count based on distance
 * @param {number} distance 
 * @returns {number}
 */
export function getTerrainSegments(distance) {
    const lodLevel = getLODLevel(distance);
    return RenderingConfig.lod[lodLevel]?.terrainSegments || 32;
}
