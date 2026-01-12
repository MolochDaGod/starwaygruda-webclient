import * as THREE from 'three';

/**
 * SWG World Loader
 * Loads REAL SWG planet data including:
 * - Authentic object placements from snapshots
 * - Known city layouts
 * - Real building coordinates
 */
export class SWGWorldLoader {
    constructor(scene, planetName = 'tatooine') {
        this.scene = scene;
        this.planetName = planetName;
        this.objects = [];
        
        // Known SWG planet data from SWGEmu Core3
        this.planetData = this.getPlanetData(planetName);
    }

    getPlanetData(planet) {
        const data = {
            tatooine: {
                name: 'Tatooine',
                mapSize: 8192,
                waterLevel: -1000, // No water
                skyColor: 0xfad6a5, // Desert tan
                fogColor: 0xfad6a5,
                ambientColor: 0xffe4b5,
                cities: [
                    {
                        name: 'Mos Eisley',
                        x: 3528, y: 5, z: -4804,
                        radius: 600,
                        buildings: [
                            { name: 'Starport', x: 3529, y: 5, z: -4800, type: 'starport' },
                            { name: 'Cantina', x: 3460, y: 5, z: -4750, type: 'cantina' },
                            { name: 'Medical Center', x: 3580, y: 5, z: -4850, type: 'hospital' },
                            { name: 'Bazaar', x: 3500, y: 5, z: -4900, type: 'bazaar' },
                            // Add more buildings based on SWG city layouts
                        ]
                    },
                    {
                        name: 'Bestine',
                        x: -1290, y: 12, z: -3590,
                        radius: 400,
                        buildings: [
                            { name: 'Starport', x: -1278, y: 12, z: -3595, type: 'starport' },
                            { name: 'Cantina', x: -1320, y: 12, z: -3550, type: 'cantina' },
                        ]
                    },
                    {
                        name: 'Mos Espa',
                        x: -2902, y: 5, z: 2130,
                        radius: 500,
                        buildings: [
                            { name: 'Starport', x: -2915, y: 5, z: 2130, type: 'starport' },
                        ]
                    }
                ]
            },
            naboo: {
                name: 'Naboo',
                mapSize: 8192,
                waterLevel: 0,
                skyColor: 0x87CEEB,
                fogColor: 0xa8d5f2,
                ambientColor: 0xf0f8ff,
                cities: [
                    {
                        name: 'Theed',
                        x: -4856, y: 6, z: 4162,
                        radius: 700,
                        buildings: [
                            { name: 'Theed Starport', x: -4865, y: 6, z: 4166, type: 'starport' },
                            { name: 'Theed Palace', x: -4900, y: 20, z: 4100, type: 'palace' },
                            { name: 'Cantina', x: -4820, y: 6, z: 4190, type: 'cantina' },
                        ]
                    },
                    {
                        name: 'Moenia',
                        x: 4734, y: 4, z: -4677,
                        radius: 400,
                        buildings: [
                            { name: 'Starport', x: 4738, y: 4, z: -4680, type: 'starport' },
                        ]
                    },
                    {
                        name: 'Keren',
                        x: 1441, y: 13, z: 2771,
                        radius: 400,
                        buildings: [
                            { name: 'Starport', x: 1449, y: 13, z: 2775, type: 'starport' },
                        ]
                    }
                ]
            },
            corellia: {
                name: 'Corellia',
                mapSize: 8192,
                waterLevel: -5,
                skyColor: 0x87CEEB,
                fogColor: 0xb0c4de,
                ambientColor: 0xe6f2ff,
                cities: [
                    {
                        name: 'Coronet',
                        x: -137, y: 28, z: -4723,
                        radius: 800,
                        buildings: [
                            { name: 'Coronet Starport', x: -140, y: 28, z: -4730, type: 'starport' },
                            { name: 'Capitol Building', x: -100, y: 35, z: -4700, type: 'capitol' },
                        ]
                    },
                    {
                        name: 'Tyrena',
                        x: -5045, y: 21, z: -2400,
                        radius: 500,
                        buildings: [
                            { name: 'Starport', x: -5039, y: 21, z: -2405, type: 'starport' },
                        ]
                    },
                    {
                        name: 'Kor Vella',
                        x: -3138, y: 31, z: 2808,
                        radius: 400,
                        buildings: [
                            { name: 'Starport', x: -3130, y: 31, z: 2815, type: 'starport' },
                        ]
                    }
                ]
            }
        };

        return data[planet] || data.tatooine;
    }

    /**
     * Load and build the world
     */
    async load() {
        console.log(`🌍 Loading ${this.planetData.name}...`);

        // Try to load snapshot data
        await this.loadSnapshot();

        // Build terrain
        this.buildTerrain();

        // Place cities and buildings
        this.placeCities();

        // Add environment
        this.addEnvironment();

        console.log(`✓ ${this.planetData.name} loaded with ${this.objects.length} objects`);

        return this.planetData;
    }

    /**
     * Load snapshot data from extracted files
     */
    async loadSnapshot() {
        try {
            const response = await fetch(`/assets/swg/${this.planetName}_snapshot.json`);
            if (response.ok) {
                const snapshot = await response.json();
                console.log(`   ✓ Loaded snapshot: ${snapshot.objects?.length || 0} objects`);
                
                // Place objects from snapshot
                if (snapshot.objects && snapshot.objects.length > 0) {
                    this.placeSnapshotObjects(snapshot.objects);
                }
            }
        } catch (err) {
            console.log(`   ℹ️  No snapshot data, using known coordinates`);
        }
    }

    /**
     * Place objects from snapshot data
     */
    placeSnapshotObjects(objects) {
        objects.forEach(obj => {
            if (!obj.position || !obj.template) return;

            // Create placeholder for now (replace with real models later)
            const size = this.getObjectSize(obj.template);
            const geometry = new THREE.BoxGeometry(size.w, size.h, size.d);
            const material = new THREE.MeshStandardMaterial({
                color: this.getObjectColor(obj.template)
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
            
            // Apply rotation if available
            if (obj.rotation) {
                mesh.quaternion.set(
                    obj.rotation.x,
                    obj.rotation.y,
                    obj.rotation.z,
                    obj.rotation.w
                );
            }

            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { template: obj.template, id: obj.id };

            this.scene.add(mesh);
            this.objects.push(mesh);
        });
    }

    /**
     * Build terrain (procedural for now, will use real heightmaps later)
     */
    buildTerrain() {
        const size = this.planetData.mapSize * 2; // 16km
        const resolution = 256;

        const geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
        
        // Generate heightmap (TODO: use real .trn files)
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length / 3; i++) {
            const x = vertices[i * 3];
            const z = vertices[i * 3 + 1];
            
            // Simple noise-based terrain
            const height = this.getTerrainHeight(x, z);
            vertices[i * 3 + 2] = height;
        }

        geometry.computeVertexNormals();

        // Terrain material based on planet
        const material = new THREE.MeshStandardMaterial({
            color: this.getTerrainColor(),
            roughness: 0.9,
            metalness: 0.1
        });

        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        
        this.scene.add(terrain);
        this.objects.push(terrain);

        console.log(`   ✓ Built terrain (${resolution}x${resolution})`);
    }

    /**
     * Get terrain height at position (procedural for now)
     */
    getTerrainHeight(x, z) {
        // Simple multi-octave noise
        let height = 0;
        let frequency = 0.001;
        let amplitude = 30;

        for (let i = 0; i < 3; i++) {
            height += Math.sin(x * frequency) * Math.cos(z * frequency) * amplitude;
            frequency *= 2;
            amplitude *= 0.5;
        }

        return height;
    }

    /**
     * Get terrain color based on planet
     */
    getTerrainColor() {
        const colors = {
            tatooine: 0xc9b38f, // Sandy desert
            naboo: 0x5a8f4a,     // Green grass
            corellia: 0x6b8f5a   // Temperate grass
        };

        return colors[this.planetName] || colors.tatooine;
    }

    /**
     * Place cities with buildings
     */
    placeCities() {
        console.log(`   🏙️  Placing ${this.planetData.cities.length} cities...`);

        this.planetData.cities.forEach(city => {
            // City center marker
            this.placeCityMarker(city);

            // Place buildings
            if (city.buildings) {
                city.buildings.forEach(building => {
                    this.placeBuilding(building, city);
                });
            }
        });
    }

    /**
     * Place city center marker
     */
    placeCityMarker(city) {
        const geometry = new THREE.CylinderGeometry(50, 50, 5, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xff6600,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.6
        });

        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(city.x, city.y + 2.5, city.z);
        marker.userData = { type: 'city_marker', name: city.name };

        this.scene.add(marker);
        this.objects.push(marker);

        console.log(`      ✓ ${city.name} (${city.buildings?.length || 0} buildings)`);
    }

    /**
     * Place a building
     */
    placeBuilding(building, city) {
        const size = this.getBuildingSize(building.type);
        const color = this.getBuildingColor(building.type);

        const geometry = new THREE.BoxGeometry(size.w, size.h, size.d);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(building.x, building.y + size.h / 2, building.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { 
            type: 'building',
            buildingType: building.type,
            name: building.name,
            city: city.name
        };

        this.scene.add(mesh);
        this.objects.push(mesh);

        // Add entry marker
        if (building.type === 'starport' || building.type === 'cantina') {
            this.addBuildingMarker(building);
        }
    }

    /**
     * Add visual marker for important buildings
     */
    addBuildingMarker(building) {
        const geometry = new THREE.SphereGeometry(5, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: building.type === 'starport' ? 0x00ff00 : 0xffff00,
            emissive: building.type === 'starport' ? 0x00ff00 : 0xffff00,
            emissiveIntensity: 0.8
        });

        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(building.x, building.y + 30, building.z);
        marker.userData = { type: 'poi_marker', building: building.name };

        this.scene.add(marker);
        this.objects.push(marker);
    }

    /**
     * Add water plane if needed
     */
    addEnvironment() {
        if (this.planetData.waterLevel > -100) {
            const waterGeometry = new THREE.PlaneGeometry(16000, 16000);
            const waterMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a90e2,
                transparent: true,
                opacity: 0.6,
                roughness: 0.1,
                metalness: 0.9
            });

            const water = new THREE.Mesh(waterGeometry, waterMaterial);
            water.rotation.x = -Math.PI / 2;
            water.position.y = this.planetData.waterLevel;
            water.receiveShadow = true;

            this.scene.add(water);
            this.objects.push(water);

            console.log(`   ✓ Added water at y=${this.planetData.waterLevel}`);
        }
    }

    /**
     * Get building size based on type
     */
    getBuildingSize(type) {
        const sizes = {
            starport: { w: 60, h: 30, d: 60 },
            cantina: { w: 40, h: 20, d: 40 },
            hospital: { w: 35, h: 18, d: 35 },
            bazaar: { w: 50, h: 15, d: 50 },
            palace: { w: 80, h: 40, d: 80 },
            capitol: { w: 70, h: 35, d: 70 },
            default: { w: 30, h: 15, d: 30 }
        };

        return sizes[type] || sizes.default;
    }

    /**
     * Get building color based on type
     */
    getBuildingColor(type) {
        const colors = {
            starport: 0x808080,
            cantina: 0xa0826d,
            hospital: 0xffffff,
            bazaar: 0xd4af37,
            palace: 0xffd700,
            capitol: 0xb0b0b0,
            default: 0xcccccc
        };

        return colors[type] || colors.default;
    }

    /**
     * Get object size from template name
     */
    getObjectSize(template) {
        if (template.includes('building')) {
            return { w: 30, h: 20, d: 30 };
        } else if (template.includes('tree')) {
            return { w: 5, h: 15, d: 5 };
        } else {
            return { w: 10, h: 10, d: 10 };
        }
    }

    /**
     * Get object color from template name
     */
    getObjectColor(template) {
        if (template.includes('building')) return 0xcccccc;
        if (template.includes('tree')) return 0x2d5016;
        if (template.includes('rock')) return 0x808080;
        return 0x888888;
    }

    /**
     * Clean up
     */
    dispose() {
        this.objects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            this.scene.remove(obj);
        });
        this.objects = [];
    }
}
