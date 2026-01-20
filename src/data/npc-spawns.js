/**
 * SWG NPC Spawn Database
 * Based on SWGEmu Core3 spawn data
 * Defines creature spawn points across all planets
 */

export const NPC_SPAWNS = {
  tatooine: {
    creatures: [
      // Mos Eisley
      {
        template: 'object/creature/npc/base/shared_base_npc.iff',
        name: 'Figrin D\'an',
        type: 'musician',
        faction: 'neutral',
        x: 3460, y: 5, z: -4750,
        radius: 5,
        respawn: false,
        dialog: ['Welcome to the Mos Eisley Cantina!']
      },
      {
        template: 'object/creature/npc/theme_park/shared_imperial_recruiter.iff',
        name: 'Imperial Recruiter',
        type: 'recruiter',
        faction: 'imperial',
        x: 3529, y: 5, z: -4800,
        radius: 10,
        respawn: true,
        dialog: ['Join the Empire!', 'We need pilots.']
      },
      {
        template: 'object/creature/npc/theme_park/shared_rebel_recruiter.iff',
        name: 'Rebel Recruiter',
        type: 'recruiter',
        faction: 'rebel',
        x: 3530, y: 5, z: -4805,
        radius: 10,
        respawn: true,
        dialog: ['The Rebellion needs you!']
      },
      // Wildlife spawns
      {
        template: 'object/creature/monster/creature_herd/shared_canyon_krayt_dragon.iff',
        name: 'Canyon Krayt Dragon',
        type: 'creature',
        faction: 'neutral',
        x: 7300, y: 40, z: 4500,
        radius: 200,
        respawn: true,
        level: 275
      },
      {
        template: 'object/creature/monster/shared_bantha.iff',
        name: 'Bantha',
        type: 'creature',
        faction: 'neutral',
        x: 1000, y: 20, z: 2000,
        radius: 500,
        respawn: true,
        level: 12,
        count: 5
      },
      {
        template: 'object/creature/monster/shared_dewback.iff',
        name: 'Dewback',
        type: 'creature',
        faction: 'neutral',
        x: -3000, y: 15, z: 1500,
        radius: 300,
        respawn: true,
        level: 8,
        count: 3
      },
      {
        template: 'object/creature/monster/shared_sand_people.iff',
        name: 'Tusken Raider',
        type: 'humanoid',
        faction: 'tusken',
        x: -4000, y: 30, z: 3000,
        radius: 400,
        respawn: true,
        level: 25,
        count: 8,
        hostile: true
      },
      {
        template: 'object/creature/monster/shared_jawa.iff',
        name: 'Jawa',
        type: 'humanoid',
        faction: 'jawa',
        x: 2000, y: 10, z: -3000,
        radius: 200,
        respawn: true,
        level: 5,
        count: 10
      }
    ]
  },

  naboo: {
    creatures: [
      // Theed NPCs
      {
        template: 'object/creature/npc/shared_naboo_naboo_police.iff',
        name: 'Naboo Security',
        type: 'guard',
        faction: 'naboo',
        x: -4856, y: 6, z: 4162,
        radius: 50,
        respawn: true,
        count: 4
      },
      {
        template: 'object/creature/npc/shared_naboo_gungan.iff',
        name: 'Boss Nass',
        type: 'vendor',
        faction: 'gungan',
        x: -2000, y: 5, z: -5500,
        radius: 10,
        respawn: false,
        dialog: ['Mesa Boss Nass!', 'Yousa want trade?']
      },
      // Wildlife
      {
        template: 'object/creature/monster/shared_fambaa.iff',
        name: 'Fambaa',
        type: 'creature',
        faction: 'neutral',
        x: 1000, y: 3, z: 2000,
        radius: 600,
        respawn: true,
        level: 45,
        count: 2
      },
      {
        template: 'object/creature/monster/shared_kaadu.iff',
        name: 'Kaadu',
        type: 'creature',
        faction: 'neutral',
        x: -1500, y: 4, z: 3000,
        radius: 400,
        respawn: true,
        level: 10,
        count: 6
      },
      {
        template: 'object/creature/monster/shared_mott.iff',
        name: 'Mott',
        type: 'creature',
        faction: 'neutral',
        x: 3000, y: 5, z: -2000,
        radius: 300,
        respawn: true,
        level: 6,
        count: 8
      }
    ]
  },

  corellia: {
    creatures: [
      // Coronet NPCs
      {
        template: 'object/creature/npc/shared_corsec_trooper.iff',
        name: 'CorSec Officer',
        type: 'guard',
        faction: 'corsec',
        x: -137, y: 28, z: -4723,
        radius: 40,
        respawn: true,
        count: 6
      },
      {
        template: 'object/creature/npc/shared_commoner.iff',
        name: 'Citizen',
        type: 'civilian',
        faction: 'neutral',
        x: -200, y: 28, z: -4650,
        radius: 100,
        respawn: true,
        count: 15
      },
      // Wildlife
      {
        template: 'object/creature/monster/shared_durni.iff',
        name: 'Durni',
        type: 'creature',
        faction: 'neutral',
        x: 2000, y: 40, z: 3000,
        radius: 500,
        respawn: true,
        level: 8,
        count: 10
      },
      {
        template: 'object/creature/monster/shared_slice_hound.iff',
        name: 'Slice Hound',
        type: 'creature',
        faction: 'neutral',
        x: -3000, y: 25, z: 2000,
        radius: 300,
        respawn: true,
        level: 15,
        count: 5,
        hostile: true
      }
    ]
  },

  dathomir: {
    creatures: [
      {
        template: 'object/creature/npc/shared_nightsister_elder.iff',
        name: 'Nightsister Elder',
        type: 'hostile_npc',
        faction: 'nightsister',
        x: -4055, y: 125, z: 1135,
        radius: 100,
        respawn: true,
        level: 150,
        count: 3,
        hostile: true
      },
      {
        template: 'object/creature/monster/shared_rancor.iff',
        name: 'Rancor',
        type: 'creature',
        faction: 'neutral',
        x: 1000, y: 40, z: -2000,
        radius: 400,
        respawn: true,
        level: 80,
        count: 2,
        hostile: true
      },
      {
        template: 'object/creature/monster/shared_brackaset.iff',
        name: 'Brackaset',
        type: 'creature',
        faction: 'neutral',
        x: 2500, y: 35, z: 1500,
        radius: 500,
        respawn: true,
        level: 45,
        count: 4
      }
    ]
  },

  endor: {
    creatures: [
      {
        template: 'object/creature/npc/shared_ewok.iff',
        name: 'Ewok Scout',
        type: 'npc',
        faction: 'ewok',
        x: 4635, y: 8, z: -2445,
        radius: 100,
        respawn: true,
        level: 5,
        count: 12
      },
      {
        template: 'object/creature/monster/shared_gorax.iff',
        name: 'Gorax',
        type: 'creature',
        faction: 'neutral',
        x: 1000, y: 60, z: 3000,
        radius: 300,
        respawn: true,
        level: 190,
        hostile: true
      },
      {
        template: 'object/creature/monster/shared_bordok.iff',
        name: 'Bordok',
        type: 'creature',
        faction: 'neutral',
        x: -2000, y: 45, z: 1000,
        radius: 600,
        respawn: true,
        level: 12,
        count: 8
      }
    ]
  },

  lok: {
    creatures: [
      {
        template: 'object/creature/npc/shared_nym_pirate.iff',
        name: 'Nym\'s Pirate',
        type: 'npc',
        faction: 'pirate',
        x: 475, y: 9, z: -4135,
        radius: 80,
        respawn: true,
        level: 35,
        count: 10
      },
      {
        template: 'object/creature/monster/shared_kimogila.iff',
        name: 'Kimogila',
        type: 'creature',
        faction: 'neutral',
        x: -70, y: 12, z: 2768,
        radius: 200,
        respawn: true,
        level: 275,
        hostile: true
      }
    ]
  },

  rori: {
    creatures: [
      {
        template: 'object/creature/npc/shared_gungan.iff',
        name: 'Gungan Trader',
        type: 'vendor',
        faction: 'gungan',
        x: -1105, y: 76, z: 4556,
        radius: 30,
        respawn: true,
        count: 3
      },
      {
        template: 'object/creature/monster/shared_torton.iff',
        name: 'Torton',
        type: 'creature',
        faction: 'neutral',
        x: 2000, y: 80, z: 2000,
        radius: 500,
        respawn: true,
        level: 25,
        count: 5
      }
    ]
  },

  talus: {
    creatures: [
      {
        template: 'object/creature/npc/shared_commoner.iff',
        name: 'Dearic Citizen',
        type: 'civilian',
        faction: 'neutral',
        x: 265, y: 6, z: -2951,
        radius: 50,
        respawn: true,
        count: 8
      },
      {
        template: 'object/creature/monster/shared_flit.iff',
        name: 'Flit',
        type: 'creature',
        faction: 'neutral',
        x: 1500, y: 10, z: 2000,
        radius: 400,
        respawn: true,
        level: 7,
        count: 12
      }
    ]
  },

  yavin4: {
    creatures: [
      {
        template: 'object/creature/npc/shared_rebel_trooper.iff',
        name: 'Rebel Soldier',
        type: 'guard',
        faction: 'rebel',
        x: -3006, y: 73, z: -3068,
        radius: 60,
        respawn: true,
        level: 30,
        count: 8
      },
      {
        template: 'object/creature/monster/shared_choku.iff',
        name: 'Choku',
        type: 'creature',
        faction: 'neutral',
        x: 2000, y: 50, z: 3000,
        radius: 600,
        respawn: true,
        level: 18,
        count: 6
      },
      {
        template: 'object/creature/monster/shared_woolamander.iff',
        name: 'Woolamander',
        type: 'creature',
        faction: 'neutral',
        x: -1000, y: 40, z: 2000,
        radius: 500,
        respawn: true,
        level: 8,
        count: 10
      }
    ]
  }
};

/**
 * Get all NPC spawns for a planet
 */
export function getPlanetSpawns(planetName) {
  return NPC_SPAWNS[planetName.toLowerCase()] || { creatures: [] };
}

/**
 * Get spawns near a position
 */
export function getSpawnsNearPosition(planetName, position, radius = 1000) {
  const planetSpawns = getPlanetSpawns(planetName);
  
  return planetSpawns.creatures.filter(spawn => {
    const distance = Math.sqrt(
      Math.pow(position.x - spawn.x, 2) +
      Math.pow(position.z - spawn.z, 2)
    );
    return distance <= radius;
  });
}

/**
 * Get total creature count for all planets
 */
export function getTotalCreatureCount() {
  return Object.values(NPC_SPAWNS).reduce((total, planet) => {
    return total + planet.creatures.reduce((sum, spawn) => {
      return sum + (spawn.count || 1);
    }, 0);
  }, 0);
}
