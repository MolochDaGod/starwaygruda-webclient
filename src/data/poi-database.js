/**
 * Star Wars Galaxies - Points of Interest Database
 * Real coordinates from SWG game files
 */

export const SWG_POIS = {
    naboo: {
        name: "Naboo",
        terrain: "naboo.trn",
        waterLevel: 0,
        cities: [
            {
                name: "Theed",
                type: "capital",
                position: { x: -4856, y: 6, z: 4162 },
                radius: 500,
                buildings: [
                    { name: "Theed Starport", x: -4900, y: 6, z: 4100 },
                    { name: "Theed Cantina", x: -4850, y: 6, z: 4200 },
                    { name: "Theed Palace", x: -5500, y: 6, z: 4300 }
                ]
            },
            {
                name: "Moenia",
                type: "city",
                position: { x: 4800, y: 4, z: -4700 },
                radius: 300,
                buildings: [
                    { name: "Moenia Starport", x: 4731, y: 4, z: -4677 },
                    { name: "Moenia Cantina", x: 4800, y: 4, z: -4650 }
                ]
            },
            {
                name: "Kaadara",
                type: "city",
                position: { x: 5200, y: 10, z: 6700 },
                radius: 300,
                buildings: [
                    { name: "Kaadara Starport", x: 5209, y: 10, z: 6677 }
                ]
            },
            {
                name: "Keren",
                type: "city",
                position: { x: 1441, y: 13, z: 2771 },
                radius: 250
            },
            {
                name: "Dee'ja Peak",
                type: "city",
                position: { x: 5003, y: -193, z: -1579 },
                radius: 200
            }
        ],
        pois: [
            { name: "Gungan Sacred Place", x: -2000, y: 5, z: -5500, type: "ruins" },
            { name: "Lake Retreat", x: -5500, y: 0, z: -20, type: "landmark" },
            { name: "Emperor's Retreat", x: 2400, y: 12, z: -3900, type: "imperial" }
        ]
    },
    
    tatooine: {
        name: "Tatooine",
        terrain: "tatooine.trn",
        waterLevel: -1000, // No water
        cities: [
            {
                name: "Mos Eisley",
                type: "capital",
                position: { x: 3528, y: 5, z: -4804 },
                radius: 400,
                buildings: [
                    { name: "Mos Eisley Starport", x: 3527, y: 5, z: -4807 },
                    { name: "Mos Eisley Cantina", x: 3400, y: 5, z: -4850 }
                ]
            },
            {
                name: "Mos Entha",
                type: "city",
                position: { x: 1291, y: 7, z: 3138 },
                radius: 300,
                buildings: [
                    { name: "Mos Entha Starport", x: 1299, y: 7, z: 3078 }
                ]
            },
            {
                name: "Bestine",
                type: "city",
                position: { x: -1290, y: 12, z: -3590 },
                radius: 300,
                buildings: [
                    { name: "Bestine Starport", x: -1286, y: 12, z: -3599 }
                ]
            },
            {
                name: "Mos Espa",
                type: "city",
                position: { x: -2902, y: 5, z: 2130 },
                radius: 350
            },
            {
                name: "Anchorhead",
                type: "city",
                position: { x: 50, y: 52, z: -5350 },
                radius: 250
            }
        ],
        pois: [
            { name: "Jabba's Palace", x: -5850, y: 60, z: -6200, type: "dungeon" },
            { name: "Krayt Graveyard", x: 7300, y: 40, z: 4500, type: "landmark" },
            { name: "Ben Kenobi's Hut", x: -4512, y: 60, z: -2270, type: "landmark" },
            { name: "Sarlacc Pit", x: -6176, y: 46, z: -3372, type: "landmark" }
        ]
    },
    
    corellia: {
        name: "Corellia",
        terrain: "corellia.trn",
        waterLevel: 0,
        cities: [
            {
                name: "Coronet",
                type: "capital",
                position: { x: -137, y: 28, z: -4723 },
                radius: 500,
                buildings: [
                    { name: "Coronet Starport", x: -130, y: 28, z: -4700 },
                    { name: "Coronet Capitol Building", x: -200, y: 28, z: -4650 }
                ]
            },
            {
                name: "Tyrena",
                type: "city",
                position: { x: -5045, y: 21, z: -2294 },
                radius: 400,
                buildings: [
                    { name: "Tyrena Starport", x: -5045, y: 21, z: -2435 }
                ]
            },
            {
                name: "Kor Vella",
                type: "city",
                position: { x: -3138, y: 31, z: 2808 },
                radius: 300
            },
            {
                name: "Doaba Guerfel",
                type: "city",
                position: { x: 3336, y: 300, z: 5525 },
                radius: 250
            },
            {
                name: "Vreni Island",
                type: "city",
                position: { x: -5552, y: 15, z: -6036 },
                radius: 200
            }
        ],
        pois: [
            { name: "Rogue CorSec Base", x: 5200, y: 100, z: 1500, type: "imperial" },
            { name: "Drall Cave", x: -6500, y: 20, z: -5700, type: "dungeon" }
        ]
    },
    
    dathomir: {
        name: "Dathomir",
        terrain: "dathomir.trn",
        waterLevel: 0,
        cities: [
            {
                name: "Science Outpost",
                type: "outpost",
                position: { x: -76, y: 18, z: -2591 },
                radius: 150
            },
            {
                name: "Trade Outpost",
                type: "outpost",
                position: { x: 592, y: 18, z: 3081 },
                radius: 150
            }
        ],
        pois: [
            { name: "Nightsister Stronghold", x: -4055, y: 125, z: 1135, type: "dungeon" },
            { name: "Sarlacc", x: -2226, y: 85, z: 3303, type: "landmark" },
            { name: "Crashed Ship", x: 5539, y: 18, z: 1960, type: "landmark" }
        ]
    },
    
    endor: {
        name: "Endor",
        terrain: "endor.trn",
        waterLevel: 0,
        cities: [
            {
                name: "Smuggler Outpost",
                type: "outpost",
                position: { x: -950, y: 73, z: 1553 },
                radius: 150
            },
            {
                name: "Research Outpost",
                type: "outpost",
                position: { x: 3204, y: 24, z: -3468 },
                radius: 150
            }
        ],
        pois: [
            { name: "Ewok Tree Village", x: 4635, y: 8, z: -2445, type: "village" },
            { name: "Imperial Outpost", x: -4647, y: 12, z: 4331, type: "imperial" },
            { name: "Death Star Wreckage", x: -4637, y: 19, z: -2879, type: "landmark" }
        ]
    },
    
    lok: {
        name: "Lok",
        terrain: "lok.trn",
        waterLevel: -1000,
        cities: [
            {
                name: "Nym's Stronghold",
                type: "pirate_base",
                position: { x: 475, y: 9, z: -4135 },
                radius: 200
            }
        ],
        pois: [
            { name: "Sulfur Lake Pirate Camp", x: -1975, y: 12, z: -467, type: "camp" },
            { name: "Kimogila Breeding Grounds", x: -70, y: 12, z: 2768, type: "spawn" }
        ]
    },
    
    rori: {
        name: "Rori",
        terrain: "rori.trn",
        waterLevel: 0,
        cities: [
            {
                name: "Restuss",
                type: "city",
                position: { x: 5362, y: 80, z: 5663 },
                radius: 300
            },
            {
                name: "Narmle",
                type: "city",
                position: { x: -5310, y: 80, z: -2221 },
                radius: 250
            }
        ],
        pois: [
            { name: "Gungan Swamp Town", x: -1105, y: 76, z: 4556, type: "village" },
            { name: "Rebel Outpost", x: 3698, y: 96, z: -6478, type: "rebel" }
        ]
    },
    
    talus: {
        name: "Talus",
        terrain: "talus.trn",
        waterLevel: 0,
        cities: [
            {
                name: "Dearic",
                type: "capital",
                position: { x: 265, y: 6, z: -2951 },
                radius: 400
            },
            {
                name: "Nashal",
                type: "city",
                position: { x: 4371, y: 2, z: 5165 },
                radius: 300
            }
        ],
        pois: [
            { name: "Aakuan Cave", x: 4040, y: -65, z: 938, type: "dungeon" },
            { name: "Imperial Outpost", x: -2228, y: 20, z: 2319, type: "imperial" }
        ]
    },
    
    yavin4: {
        name: "Yavin 4",
        terrain: "yavin4.trn",
        waterLevel: 0,
        cities: [
            {
                name: "Labor Outpost",
                type: "outpost",
                position: { x: -6921, y: 73, z: -5726 },
                radius: 150
            },
            {
                name: "Mining Outpost",
                type: "outpost",
                position: { x: -267, y: 35, z: 4896 },
                radius: 150
            }
        ],
        pois: [
            { name: "Massassi Temple", x: -875, y: 35, z: -2028, type: "ruins" },
            { name: "Rebel Base", x: -3006, y: 73, z: -3068, type: "rebel" },
            { name: "Blueleaf Temple", x: -875, y: 35, z: -2028, type: "ruins" }
        ]
    }
};

/**
 * Get POI data for a specific planet
 */
export function getPlanetPOIs(planetName) {
    const planet = SWG_POIS[planetName.toLowerCase()];
    if (!planet) {
        console.warn(`Planet ${planetName} not found in database`);
        return null;
    }
    return planet;
}

/**
 * Find nearest POI to a position
 */
export function findNearestPOI(planetName, position, maxDistance = 1000) {
    const planet = getPlanetPOIs(planetName);
    if (!planet) return null;
    
    let nearest = null;
    let nearestDist = maxDistance;
    
    // Check cities
    planet.cities.forEach(city => {
        const dist = Math.sqrt(
            Math.pow(position.x - city.position.x, 2) +
            Math.pow(position.z - city.position.z, 2)
        );
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = { ...city, distance: dist, category: 'city' };
        }
    });
    
    // Check other POIs
    if (planet.pois) {
        planet.pois.forEach(poi => {
            const dist = Math.sqrt(
                Math.pow(position.x - poi.x, 2) +
                Math.pow(position.z - poi.z, 2)
            );
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = { ...poi, distance: dist, category: 'poi' };
            }
        });
    }
    
    return nearest;
}

/**
 * Check if position is in water
 */
export function isInWater(planetName, position) {
    const planet = getPlanetPOIs(planetName);
    if (!planet) return false;
    
    return position.y < planet.waterLevel;
}
