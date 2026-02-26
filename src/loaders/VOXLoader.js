import * as THREE from 'three';

/**
 * VOXLoader - Load MagicaVoxel .vox files into Three.js
 * 
 * MagicaVoxel format specification:
 * https://github.com/ephtracy/voxel-model/blob/master/MagicaVoxel-file-format-vox.txt
 */
export class VOXLoader {
    constructor() {
        this.defaultPalette = this.createDefaultPalette();
    }
    
    /**
     * Load a .vox file and return a Three.js mesh
     */
    async load(url) {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        return this.parse(buffer);
    }
    
    /**
     * Parse .vox file buffer
     */
    parse(buffer) {
        const data = new DataView(buffer);
        let offset = 0;
        
        // Read header "VOX "
        const magic = this.readString(data, offset, 4);
        offset += 4;
        
        if (magic !== 'VOX ') {
            throw new Error('Invalid VOX file: bad magic number');
        }
        
        // Version
        const version = data.getInt32(offset, true);
        offset += 4;
        
        // Parse chunks
        let size = { x: 0, y: 0, z: 0 };
        let voxels = [];
        let palette = this.defaultPalette;
        
        while (offset < buffer.byteLength) {
            const chunkId = this.readString(data, offset, 4);
            offset += 4;
            
            const chunkSize = data.getInt32(offset, true);
            offset += 4;
            
            const childChunks = data.getInt32(offset, true);
            offset += 4;
            
            if (chunkId === 'SIZE') {
                size.x = data.getInt32(offset, true);
                size.y = data.getInt32(offset + 4, true);
                size.z = data.getInt32(offset + 8, true);
            } else if (chunkId === 'XYZI') {
                const numVoxels = data.getInt32(offset, true);
                for (let i = 0; i < numVoxels; i++) {
                    const voxelOffset = offset + 4 + i * 4;
                    voxels.push({
                        x: data.getUint8(voxelOffset),
                        y: data.getUint8(voxelOffset + 1),
                        z: data.getUint8(voxelOffset + 2),
                        colorIndex: data.getUint8(voxelOffset + 3)
                    });
                }
            } else if (chunkId === 'RGBA') {
                palette = [];
                for (let i = 0; i < 256; i++) {
                    const colorOffset = offset + i * 4;
                    palette.push({
                        r: data.getUint8(colorOffset) / 255,
                        g: data.getUint8(colorOffset + 1) / 255,
                        b: data.getUint8(colorOffset + 2) / 255,
                        a: data.getUint8(colorOffset + 3) / 255
                    });
                }
            }
            
            offset += chunkSize;
        }
        
        return this.createMesh(size, voxels, palette);
    }
    
    /**
     * Create Three.js mesh from voxel data
     */
    createMesh(size, voxels, palette) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const normals = [];
        const indices = [];
        
        // Create a voxel lookup for face culling
        const voxelMap = new Map();
        for (const voxel of voxels) {
            voxelMap.set(`${voxel.x},${voxel.y},${voxel.z}`, voxel.colorIndex);
        }
        
        const hasVoxel = (x, y, z) => voxelMap.has(`${x},${y},${z}`);
        
        // Face definitions
        const faces = [
            { dir: [1, 0, 0], corners: [[1,0,0], [1,1,0], [1,1,1], [1,0,1]], normal: [1,0,0] },   // +X
            { dir: [-1, 0, 0], corners: [[0,0,1], [0,1,1], [0,1,0], [0,0,0]], normal: [-1,0,0] }, // -X
            { dir: [0, 1, 0], corners: [[0,1,0], [0,1,1], [1,1,1], [1,1,0]], normal: [0,1,0] },   // +Y
            { dir: [0, -1, 0], corners: [[0,0,1], [0,0,0], [1,0,0], [1,0,1]], normal: [0,-1,0] }, // -Y
            { dir: [0, 0, 1], corners: [[0,0,1], [1,0,1], [1,1,1], [0,1,1]], normal: [0,0,1] },   // +Z
            { dir: [0, 0, -1], corners: [[0,1,0], [1,1,0], [1,0,0], [0,0,0]], normal: [0,0,-1] }  // -Z
        ];
        
        let vertexIndex = 0;
        
        for (const voxel of voxels) {
            const color = palette[voxel.colorIndex - 1] || { r: 1, g: 0, b: 1, a: 1 };
            
            for (const face of faces) {
                const nx = voxel.x + face.dir[0];
                const ny = voxel.y + face.dir[1];
                const nz = voxel.z + face.dir[2];
                
                // Only add face if neighbor doesn't exist (face culling)
                if (!hasVoxel(nx, ny, nz)) {
                    // Add 4 vertices for this face
                    for (const corner of face.corners) {
                        positions.push(
                            voxel.x + corner[0] - size.x / 2,
                            voxel.z + corner[2],  // Swap Y/Z for Three.js coordinate system
                            voxel.y + corner[1] - size.y / 2
                        );
                        colors.push(color.r, color.g, color.b);
                        normals.push(face.normal[0], face.normal[2], face.normal[1]);
                    }
                    
                    // Add 2 triangles (6 indices) for this face
                    indices.push(
                        vertexIndex, vertexIndex + 1, vertexIndex + 2,
                        vertexIndex, vertexIndex + 2, vertexIndex + 3
                    );
                    vertexIndex += 4;
                }
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setIndex(indices);
        
        const material = new THREE.MeshLambertMaterial({
            vertexColors: true,
            side: THREE.FrontSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store metadata
        mesh.userData.voxelSize = size;
        mesh.userData.voxelCount = voxels.length;
        
        return mesh;
    }
    
    /**
     * Read string from DataView
     */
    readString(data, offset, length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += String.fromCharCode(data.getUint8(offset + i));
        }
        return str;
    }
    
    /**
     * Create default MagicaVoxel palette
     */
    createDefaultPalette() {
        // MagicaVoxel default palette (simplified)
        const palette = [];
        for (let i = 0; i < 256; i++) {
            const r = ((i >> 0) & 3) / 3;
            const g = ((i >> 2) & 3) / 3;
            const b = ((i >> 4) & 3) / 3;
            palette.push({ r, g, b, a: 1 });
        }
        return palette;
    }
}

export default VOXLoader;
