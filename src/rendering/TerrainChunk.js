import * as THREE from 'three';

export class TerrainChunk {
    constructor(x, z, size, heightmapData, resolution) {
        this.x = x;
        this.z = z;
        this.size = size; // meters (e.g., 256m)
        this.heightmapData = heightmapData;
        this.resolution = resolution; // vertices per side (e.g., 64)
        
        this.mesh = null;
        this.lod = 0; // Current LOD level: 0=high, 1=medium, 2=low
        this.visible = false;
        this.lastUpdateDistance = Infinity;
        
        // Bounds for frustum culling
        this.bounds = new THREE.Box3(
            new THREE.Vector3(x, -50, z),
            new THREE.Vector3(x + size, 150, z + size)
        );
        
        this.createMesh();
    }
    
    createMesh() {
        const geometry = this.createGeometry(this.resolution);
        
        // Terrain material with texture splatting
        const material = new THREE.MeshStandardMaterial({
            color: 0x5d8a3a,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: false,
            wireframe: false
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = false;
        this.mesh.frustumCulled = true;
    }
    
    createGeometry(resolution) {
        const geometry = new THREE.PlaneGeometry(
            this.size,
            this.size,
            resolution - 1,
            resolution - 1
        );
        
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(this.x + this.size / 2, 0, this.z + this.size / 2);
        
        // Apply heightmap data
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length / 3; i++) {
            const x = positions[i * 3];
            const z = positions[i * 3 + 2];
            
            // Get height from heightmap
            const height = this.getHeight(x - this.x, z - this.z);
            positions[i * 3 + 1] = height;
        }
        
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        
        return geometry;
    }
    
    getHeight(localX, localZ) {
        if (!this.heightmapData) return 0;
        
        // Normalize to heightmap coordinates
        const u = (localX / this.size) * (this.heightmapData.width - 1);
        const v = (localZ / this.size) * (this.heightmapData.height - 1);
        
        // Bilinear interpolation
        const x0 = Math.floor(u);
        const x1 = Math.min(x0 + 1, this.heightmapData.width - 1);
        const z0 = Math.floor(v);
        const z1 = Math.min(z0 + 1, this.heightmapData.height - 1);
        
        const tx = u - x0;
        const tz = v - z0;
        
        const h00 = this.heightmapData.data[z0 * this.heightmapData.width + x0];
        const h10 = this.heightmapData.data[z0 * this.heightmapData.width + x1];
        const h01 = this.heightmapData.data[z1 * this.heightmapData.width + x0];
        const h11 = this.heightmapData.data[z1 * this.heightmapData.width + x1];
        
        const h0 = h00 * (1 - tx) + h10 * tx;
        const h1 = h01 * (1 - tx) + h11 * tx;
        
        return h0 * (1 - tz) + h1 * tz;
    }
    
    updateLOD(cameraPosition) {
        const center = new THREE.Vector3(
            this.x + this.size / 2,
            0,
            this.z + this.size / 2
        );
        
        const distance = center.distanceTo(cameraPosition);
        this.lastUpdateDistance = distance;
        
        // Determine LOD level based on distance
        let targetLOD;
        if (distance < 512) {
            targetLOD = 0; // High detail (64 verts)
        } else if (distance < 1024) {
            targetLOD = 1; // Medium detail (32 verts)
        } else {
            targetLOD = 2; // Low detail (16 verts)
        }
        
        // Rebuild geometry if LOD changed
        if (targetLOD !== this.lod) {
            this.lod = targetLOD;
            const resolution = [64, 32, 16][this.lod];
            this.mesh.geometry.dispose();
            this.mesh.geometry = this.createGeometry(resolution);
        }
    }
    
    isInFrustum(frustum) {
        return frustum.intersectsBox(this.bounds);
    }
    
    setVisible(visible) {
        if (this.mesh) {
            this.mesh.visible = visible;
            this.visible = visible;
        }
    }
    
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}
