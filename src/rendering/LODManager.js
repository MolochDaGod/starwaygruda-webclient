import * as THREE from 'three';
import { TerrainChunk } from './TerrainChunk.js';

export class LODManager {
    constructor(scene, terrainData) {
        this.scene = scene;
        this.terrainData = terrainData;
        this.chunks = [];
        this.chunkSize = 256; // meters
        this.worldSize = terrainData.size || 16000; // SWG planets are 16km
        this.frustum = new THREE.Frustum();
        this.frustumMatrix = new THREE.Matrix4();
        
        this.createChunks();
    }
    
    createChunks() {
        const numChunks = Math.ceil(this.worldSize / this.chunkSize);
        const offsetX = -this.worldSize / 2;
        const offsetZ = -this.worldSize / 2;
        
        console.log(`[LODManager] Creating ${numChunks}x${numChunks} terrain chunks (${this.chunkSize}m each)`);
        
        for (let z = 0; z < numChunks; z++) {
            for (let x = 0; x < numChunks; x++) {
                const chunkX = offsetX + x * this.chunkSize;
                const chunkZ = offsetZ + z * this.chunkSize;
                
                const chunk = new TerrainChunk(
                    chunkX,
                    chunkZ,
                    this.chunkSize,
                    this.terrainData.heightmap,
                    64 // Initial resolution
                );
                
                this.scene.add(chunk.mesh);
                this.chunks.push(chunk);
            }
        }
        
        console.log(`[LODManager] Created ${this.chunks.length} chunks`);
    }
    
    update(camera) {
        // Update frustum for culling
        this.frustumMatrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.frustumMatrix);
        
        let visibleChunks = 0;
        let culledChunks = 0;
        
        // Update each chunk
        for (const chunk of this.chunks) {
            // Frustum culling
            if (chunk.isInFrustum(this.frustum)) {
                if (!chunk.visible) {
                    chunk.setVisible(true);
                }
                
                // Update LOD based on camera distance
                chunk.updateLOD(camera.position);
                visibleChunks++;
            } else {
                if (chunk.visible) {
                    chunk.setVisible(false);
                }
                culledChunks++;
            }
        }
        
        // Debug info (update every second)
        if (!this.lastLog || Date.now() - this.lastLog > 1000) {
            // console.log(`[LODManager] Visible: ${visibleChunks}, Culled: ${culledChunks}`);
            this.lastLog = Date.now();
        }
    }
    
    getHeightAt(x, z) {
        // Find the chunk containing this position
        const offsetX = -this.worldSize / 2;
        const offsetZ = -this.worldSize / 2;
        
        const chunkX = Math.floor((x - offsetX) / this.chunkSize);
        const chunkZ = Math.floor((z - offsetZ) / this.chunkSize);
        
        const numChunks = Math.ceil(this.worldSize / this.chunkSize);
        const chunkIndex = chunkZ * numChunks + chunkX;
        
        if (chunkIndex >= 0 && chunkIndex < this.chunks.length) {
            const chunk = this.chunks[chunkIndex];
            return chunk.getHeight(x - chunk.x, z - chunk.z);
        }
        
        return 0;
    }
    
    dispose() {
        for (const chunk of this.chunks) {
            this.scene.remove(chunk.mesh);
            chunk.dispose();
        }
        this.chunks = [];
    }
}
