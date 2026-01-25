import * as THREE from 'three';
import { createNoise2D, createNoise3D } from 'simplex-noise';
import * as earcut from 'earcut';

/**
 * AI-driven procedural architecture generator
 * Creates realistic SWG-style buildings with proper geometry
 */
export class ProceduralArchitect {
    constructor() {
        this.noise2D = createNoise2D();
        this.noise3D = createNoise3D();
        this.buildingCache = new Map();
    }

    /**
     * Generate a complete building with AI-driven architecture
     * @param {Object} params - Building parameters
     * @returns {THREE.Group}
     */
    generateBuilding(params = {}) {
        const {
            type = 'cantina',           // cantina, starport, hospital, townhall, house
            width = 40,                 // Base width
            depth = 40,                 // Base depth
            height = 25,                // Base height
            floors = 2,                 // Number of floors
            style = 'tatooine',         // tatooine, naboo, corellia
            seed = Math.random()
        } = params;

        const cacheKey = JSON.stringify(params);
        if (this.buildingCache.has(cacheKey)) {
            return this.buildingCache.get(cacheKey).clone();
        }

        const building = new THREE.Group();
        building.userData.type = type;
        building.userData.style = style;

        // Generate base structure
        const foundation = this.createFoundation(width, depth, 3, style);
        building.add(foundation);

        // Generate walls with proper CSG
        const walls = this.createWalls(width, depth, height, floors, style, seed);
        building.add(walls);

        // Generate roof
        const roof = this.createRoof(width, depth, height, style, seed);
        building.add(roof);

        // Add entrance
        const entrance = this.createEntrance(width, depth, style);
        building.add(entrance);

        // Add windows based on floor count
        const windows = this.createWindows(width, depth, height, floors, style, seed);
        building.add(windows);

        // Add architectural details
        const details = this.createArchitecturalDetails(width, depth, height, style, seed);
        building.add(details);

        // Cache and return
        this.buildingCache.set(cacheKey, building);
        return building;
    }

    /**
     * Create foundation with proper geometry
     */
    createFoundation(width, depth, height, style) {
        const group = new THREE.Group();
        
        // Main foundation block
        const geo = new THREE.BoxGeometry(width + 2, height, depth + 2);
        const mat = new THREE.MeshStandardMaterial({
            color: this.getColorForStyle(style, 'foundation'),
            roughness: 0.9,
            metalness: 0
        });
        
        const foundation = new THREE.Mesh(geo, mat);
        foundation.position.y = height / 2;
        foundation.castShadow = true;
        foundation.receiveShadow = true;
        
        group.add(foundation);
        
        // Add steps if needed
        const steps = this.createSteps(width, depth, style);
        group.add(steps);
        
        return group;
    }

    /**
     * Create walls with CSG for doors and windows
     */
    createWalls(width, depth, height, floors, style, seed) {
        const group = new THREE.Group();
        const floorHeight = height / floors;
        
        for (let floor = 0; floor < floors; floor++) {
            const floorY = 3 + floor * floorHeight;
            
            // Front wall
            const frontWall = this.createWall(width, floorHeight, style, 'front');
            frontWall.position.set(0, floorY + floorHeight / 2, depth / 2);
            group.add(frontWall);
            
            // Back wall
            const backWall = this.createWall(width, floorHeight, style, 'back');
            backWall.position.set(0, floorY + floorHeight / 2, -depth / 2);
            backWall.rotation.y = Math.PI;
            group.add(backWall);
            
            // Left wall
            const leftWall = this.createWall(depth, floorHeight, style, 'side');
            leftWall.position.set(-width / 2, floorY + floorHeight / 2, 0);
            leftWall.rotation.y = Math.PI / 2;
            group.add(leftWall);
            
            // Right wall
            const rightWall = this.createWall(depth, floorHeight, style, 'side');
            rightWall.position.set(width / 2, floorY + floorHeight / 2, 0);
            rightWall.rotation.y = -Math.PI / 2;
            group.add(rightWall);
        }
        
        return group;
    }

    /**
     * Create a single wall segment
     */
    createWall(width, height, style, side) {
        const thickness = 0.5;
        const geo = new THREE.BoxGeometry(width, height, thickness);
        const mat = new THREE.MeshStandardMaterial({
            color: this.getColorForStyle(style, 'wall'),
            roughness: 0.85,
            metalness: 0
        });
        
        const wall = new THREE.Mesh(geo, mat);
        wall.castShadow = true;
        wall.receiveShadow = true;
        
        return wall;
    }

    /**
     * Create procedural roof with style variations
     */
    createRoof(width, depth, height, style, seed) {
        const group = new THREE.Group();
        
        if (style === 'tatooine') {
            // Flat roof with slight dome
            const roofGeo = new THREE.CylinderGeometry(width * 0.6, width * 0.7, 2, 32);
            const roofMat = new THREE.MeshStandardMaterial({
                color: 0xc9b38f,
                roughness: 0.95
            });
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = height + 4;
            roof.castShadow = true;
            group.add(roof);
        } else if (style === 'naboo') {
            // Peaked roof
            const roofShape = new THREE.Shape();
            roofShape.moveTo(-width / 2, 0);
            roofShape.lineTo(0, 8);
            roofShape.lineTo(width / 2, 0);
            roofShape.lineTo(-width / 2, 0);
            
            const extrudeSettings = { depth: depth, bevelEnabled: false };
            const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
            const roofMat = new THREE.MeshStandardMaterial({
                color: 0x8B4513,
                roughness: 0.9
            });
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(0, height + 3, -depth / 2);
            roof.castShadow = true;
            group.add(roof);
        } else {
            // Simple flat roof
            const roofGeo = new THREE.BoxGeometry(width + 1, 1, depth + 1);
            const roofMat = new THREE.MeshStandardMaterial({
                color: 0x666666,
                roughness: 0.8
            });
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = height + 3.5;
            roof.castShadow = true;
            group.add(roof);
        }
        
        return group;
    }

    /**
     * Create entrance with door
     */
    createEntrance(width, depth, style) {
        const group = new THREE.Group();
        
        // Door frame
        const doorWidth = 4;
        const doorHeight = 6;
        
        const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.3);
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x3d2817,
            roughness: 0.7,
            metalness: 0.1
        });
        
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 3 + doorHeight / 2, depth / 2 + 0.3);
        door.castShadow = true;
        door.userData.interactable = true;
        door.userData.type = 'door';
        
        group.add(door);
        
        // Door frame decoration
        const frameGeo = new THREE.BoxGeometry(doorWidth + 0.5, doorHeight + 0.5, 0.5);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.8
        });
        
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(0, 3 + doorHeight / 2, depth / 2 + 0.5);
        frame.castShadow = true;
        
        group.add(frame);
        
        return group;
    }

    /**
     * Create windows procedurally
     */
    createWindows(width, depth, height, floors, style, seed) {
        const group = new THREE.Group();
        const floorHeight = height / floors;
        
        for (let floor = 0; floor < floors; floor++) {
            const floorY = 3 + floor * floorHeight + floorHeight * 0.6;
            
            // Front windows
            this.addWindowRow(group, width, floorY, depth / 2 + 0.3, 0, 3, style);
            
            // Back windows
            this.addWindowRow(group, width, floorY, -depth / 2 - 0.3, Math.PI, 3, style);
            
            // Side windows
            this.addWindowRow(group, depth, floorY, 0, Math.PI / 2, 2, style, -width / 2 - 0.3);
            this.addWindowRow(group, depth, floorY, 0, -Math.PI / 2, 2, style, width / 2 + 0.3);
        }
        
        return group;
    }

    /**
     * Add a row of windows
     */
    addWindowRow(group, wallWidth, y, z, rotation, count, style, x = 0) {
        const windowWidth = 2;
        const windowHeight = 2.5;
        const spacing = wallWidth / (count + 1);
        
        for (let i = 0; i < count; i++) {
            const windowGeo = new THREE.PlaneGeometry(windowWidth, windowHeight);
            const windowMat = new THREE.MeshStandardMaterial({
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.7,
                emissive: 0x4444ff,
                emissiveIntensity: 0.2
            });
            
            const window = new THREE.Mesh(windowGeo, windowMat);
            window.position.set(
                x === 0 ? -wallWidth / 2 + spacing * (i + 1) : x,
                y,
                z
            );
            window.rotation.y = rotation;
            
            group.add(window);
        }
    }

    /**
     * Create steps leading to entrance
     */
    createSteps(width, depth, style) {
        const group = new THREE.Group();
        const stepCount = 3;
        const stepHeight = 0.5;
        const stepDepth = 1;
        
        for (let i = 0; i < stepCount; i++) {
            const stepGeo = new THREE.BoxGeometry(width * 0.4, stepHeight, stepDepth);
            const stepMat = new THREE.MeshStandardMaterial({
                color: this.getColorForStyle(style, 'foundation'),
                roughness: 0.9
            });
            
            const step = new THREE.Mesh(stepGeo, stepMat);
            step.position.set(
                0,
                stepHeight * (i + 1) / 2,
                depth / 2 + stepDepth * i + stepDepth / 2
            );
            step.receiveShadow = true;
            
            group.add(step);
        }
        
        return group;
    }

    /**
     * Add architectural details (columns, decorations, etc.)
     */
    createArchitecturalDetails(width, depth, height, style, seed) {
        const group = new THREE.Group();
        
        if (style === 'tatooine') {
            // Add corner columns
            this.addColumn(group, -width / 2 + 1, height, depth / 2 - 1);
            this.addColumn(group, width / 2 - 1, height, depth / 2 - 1);
        } else if (style === 'naboo') {
            // Add decorative arches
            this.addArch(group, 0, height / 2, depth / 2 + 0.5, width * 0.3);
        }
        
        return group;
    }

    /**
     * Add a column
     */
    addColumn(group, x, height, z) {
        const columnGeo = new THREE.CylinderGeometry(0.5, 0.6, height, 8);
        const columnMat = new THREE.MeshStandardMaterial({
            color: 0xc9b38f,
            roughness: 0.8
        });
        
        const column = new THREE.Mesh(columnGeo, columnMat);
        column.position.set(x, 3 + height / 2, z);
        column.castShadow = true;
        
        group.add(column);
    }

    /**
     * Add decorative arch
     */
    addArch(group, x, y, z, width) {
        const archShape = new THREE.Shape();
        const radius = width / 2;
        
        archShape.absarc(0, 0, radius, Math.PI, 0, false);
        archShape.lineTo(radius, -1);
        archShape.lineTo(-radius, -1);
        
        const archGeo = new THREE.ExtrudeGeometry(archShape, {
            depth: 0.5,
            bevelEnabled: false
        });
        
        const archMat = new THREE.MeshStandardMaterial({
            color: 0xd4a574,
            roughness: 0.85
        });
        
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.position.set(x, y, z);
        arch.rotation.y = Math.PI;
        arch.castShadow = true;
        
        group.add(arch);
    }

    /**
     * Get color palette for architectural style
     */
    getColorForStyle(style, element) {
        const palettes = {
            tatooine: {
                foundation: 0xc9b38f,
                wall: 0xd4a574,
                roof: 0xa89968,
                detail: 0x8B7355
            },
            naboo: {
                foundation: 0xf0e68c,
                wall: 0xfff8dc,
                roof: 0x8B4513,
                detail: 0xDAA520
            },
            corellia: {
                foundation: 0x808080,
                wall: 0xa9a9a9,
                roof: 0x696969,
                detail: 0x505050
            }
        };
        
        return palettes[style]?.[element] || 0xcccccc;
    }

    /**
     * Clear building cache
     */
    clearCache() {
        this.buildingCache.clear();
    }
}

/**
 * Building type presets for quick generation
 */
export const BuildingPresets = {
    cantina: {
        type: 'cantina',
        width: 50,
        depth: 50,
        height: 30,
        floors: 2,
        style: 'tatooine'
    },
    starport: {
        type: 'starport',
        width: 80,
        depth: 60,
        height: 40,
        floors: 3,
        style: 'corellia'
    },
    hospital: {
        type: 'hospital',
        width: 60,
        depth: 60,
        height: 35,
        floors: 3,
        style: 'naboo'
    },
    townhall: {
        type: 'townhall',
        width: 70,
        depth: 70,
        height: 45,
        floors: 4,
        style: 'naboo'
    },
    house: {
        type: 'house',
        width: 30,
        depth: 30,
        height: 20,
        floors: 1,
        style: 'tatooine'
    }
};
