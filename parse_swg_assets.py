#!/usr/bin/env python3
"""
SWG Asset Parser - Python Edition
Automatically parses all SWG assets and generates JSON manifests
Much faster than manual web parsing!
"""

import os
import json
import struct
import re
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

class SWGAssetParser:
    def __init__(self, swg_path: str):
        self.swg_path = Path(swg_path)
        self.results = {
            'characters': [],
            'flying_mounts': [],
            'effects': [],
            'professions': [],
            'stats': {}
        }
        
    def parse_all(self):
        """Parse all asset types"""
        print("=" * 60)
        print("  SWG Asset Parser - Batch Processing")
        print("=" * 60)
        print(f"Source: {self.swg_path}\n")
        
        self.parse_characters()
        self.parse_flying_mounts()
        self.parse_effects()
        self.parse_professions()
        self.parse_stats()
        
        return self.results
    
    def parse_characters(self):
        """Parse character .iff files"""
        print("📦 Parsing characters...")
        char_path = self.swg_path / 'object' / 'creature' / 'player'
        
        if not char_path.exists():
            print(f"   ⚠️  Character path not found: {char_path}")
            return
        
        for iff_file in char_path.glob('*.iff'):
            try:
                char = self.parse_character_iff(iff_file)
                self.results['characters'].append(char)
            except Exception as e:
                print(f"   ❌ Failed to parse {iff_file.name}: {e}")
        
        print(f"   ✓ Parsed {len(self.results['characters'])} characters\n")
    
    def parse_character_iff(self, file_path: Path) -> Dict[str, Any]:
        """Parse individual character file"""
        name = file_path.stem.replace('shared_', '')
        species = self.detect_species(name)
        gender = 'female' if 'female' in name else 'male'
        
        return {
            'name': name,
            'fileName': file_path.name,
            'species': species,
            'gender': gender,
            'spawnLocations': self.get_species_spawn_locations(species)
        }
    
    def parse_flying_mounts(self):
        """Parse ship files as flying mounts"""
        print("🚀 Parsing ships as flying mounts...")
        ship_path = self.swg_path / 'object' / 'ship'
        
        if not ship_path.exists():
            print(f"   ⚠️  Ship path not found: {ship_path}")
            return
        
        for iff_file in ship_path.glob('shared_*.iff'):
            try:
                mount = self.parse_mount_iff(iff_file)
                self.results['flying_mounts'].append(mount)
            except Exception as e:
                print(f"   ❌ Failed to parse {iff_file.name}: {e}")
        
        print(f"   ✓ Parsed {len(self.results['flying_mounts'])} flying mounts\n")
    
    def parse_mount_iff(self, file_path: Path) -> Dict[str, Any]:
        """Parse ship as flying mount"""
        name = file_path.stem.replace('shared_', '')
        tier = self.extract_tier(name)
        base_ship = re.sub(r'_tier\d+', '', name)
        
        return {
            'name': name,
            'displayName': self.format_display_name(base_ship, tier),
            'fileName': file_path.name,
            'type': 'flying_mount',
            'category': self.detect_mount_category(base_ship),
            'tier': tier,
            'flightStats': {
                'maxSpeed': self.calculate_mount_speed(base_ship, tier),
                'acceleration': self.calculate_acceleration(base_ship),
                'turnRate': self.calculate_turn_rate(base_ship),
                'maxAltitude': self.calculate_max_altitude(base_ship),
                'hoverHeight': self.calculate_hover_height(base_ship)
            },
            'mountStats': {
                'mountTime': 2.0,
                'dismountTime': 1.5,
                'canFlyInCombat': False,
                'passengerSeats': self.get_passenger_count(base_ship)
            },
            'appearance': {
                'scale': self.calculate_mount_scale(base_ship),
                'hasTrails': True,
                'engineGlow': True
            },
            'availability': {
                'requiresLicense': tier >= 3,
                'minLevel': max(1, (tier - 1) * 10),
                'cost': self.calculate_cost(base_ship, tier),
                'planets': ['tatooine', 'naboo', 'corellia', 'dantooine', 'lok']
            }
        }
    
    def parse_effects(self):
        """Parse .eft shader files"""
        print("✨ Parsing effects...")
        effect_path = self.swg_path / 'effect'
        
        if not effect_path.exists():
            print(f"   ⚠️  Effect path not found: {effect_path}")
            return
        
        for eft_file in effect_path.glob('*.eft'):
            try:
                effect = self.parse_effect_file(eft_file)
                self.results['effects'].append(effect)
            except Exception as e:
                print(f"   ❌ Failed to parse {eft_file.name}: {e}")
        
        print(f"   ✓ Parsed {len(self.results['effects'])} effects\n")
    
    def parse_effect_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse .eft shader file"""
        name = file_path.stem
        
        # Read file content
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except:
            content = ""
        
        return {
            'name': name,
            'fileName': file_path.name,
            'type': 'effect',
            'shaderType': self.detect_shader_type(name),
            'textures': self.extract_texture_references(content),
            'properties': {
                'hasAlpha': 'alpha' in name,
                'hasBlend': 'blend' in name,
                'hasEmissive': 'emis' in name,
                'hasBump': 'bump' in name or 'cbmp' in name,
                'hasSpecular': 'spec' in name
            }
        }
    
    def parse_professions(self):
        """Parse profession data"""
        print("🎯 Parsing professions...")
        
        # Use default professions
        self.results['professions'] = [
            {
                'name': 'Brawler',
                'icon': '🥊',
                'description': 'Skilled in hand-to-hand combat',
                'startingSkills': ['unarmed_combat', 'melee_weapons'],
                'requiredStats': {'health': 100, 'action': 0, 'mind': 0},
                'availableOn': ['tatooine', 'naboo', 'corellia']
            },
            {
                'name': 'Marksman',
                'icon': '🎯',
                'description': 'Expert with ranged weapons',
                'startingSkills': ['ranged_combat', 'carbines'],
                'requiredStats': {'health': 0, 'action': 100, 'mind': 0},
                'availableOn': ['tatooine', 'naboo', 'corellia']
            },
            {
                'name': 'Artisan',
                'icon': '🔨',
                'description': 'Master crafter and trader',
                'startingSkills': ['crafting', 'resource_harvesting'],
                'requiredStats': {'health': 0, 'action': 0, 'mind': 100},
                'availableOn': ['tatooine', 'naboo', 'corellia']
            },
            {
                'name': 'Scout',
                'icon': '🏕️',
                'description': 'Explorer and wilderness expert',
                'startingSkills': ['exploration', 'tracking', 'camping'],
                'requiredStats': {'health': 50, 'action': 50, 'mind': 0},
                'availableOn': ['tatooine', 'naboo', 'corellia', 'dantooine']
            },
            {
                'name': 'Medic',
                'icon': '⚕️',
                'description': 'Healer and doctor',
                'startingSkills': ['healing', 'medicine'],
                'requiredStats': {'health': 0, 'action': 0, 'mind': 100},
                'availableOn': ['tatooine', 'naboo', 'corellia']
            },
            {
                'name': 'Entertainer',
                'icon': '🎭',
                'description': 'Musician and dancer',
                'startingSkills': ['music', 'dance'],
                'requiredStats': {'health': 0, 'action': 50, 'mind': 50},
                'availableOn': ['tatooine', 'naboo', 'corellia']
            }
        ]
        
        print(f"   ✓ Loaded {len(self.results['professions'])} professions\n")
    
    def parse_stats(self):
        """Parse stats and attributes"""
        print("📊 Parsing stats...")
        
        self.results['stats'] = {
            'attributes': {
                'health': {'min': 100, 'max': 1000, 'base': 500},
                'action': {'min': 100, 'max': 1000, 'base': 500},
                'mind': {'min': 100, 'max': 1000, 'base': 500},
                'strength': {'min': 0, 'max': 100, 'base': 50},
                'constitution': {'min': 0, 'max': 100, 'base': 50},
                'stamina': {'min': 0, 'max': 100, 'base': 50},
                'agility': {'min': 0, 'max': 100, 'base': 50},
                'luck': {'min': 0, 'max': 100, 'base': 50},
                'precision': {'min': 0, 'max': 100, 'base': 50},
                'willpower': {'min': 0, 'max': 100, 'base': 50}
            },
            'racialMods': {
                'human': {'health': 0, 'action': 0, 'mind': 0},
                'wookiee': {'health': 100, 'action': 50, 'mind': -50, 'strength': 15},
                'twilek': {'health': -50, 'action': 50, 'mind': 0, 'agility': 10},
                'zabrak': {'health': 50, 'action': 0, 'mind': 0, 'stamina': 10},
                'ithorian': {'health': 0, 'action': -50, 'mind': 100, 'willpower': 10},
                'sullustan': {'health': -25, 'action': 25, 'mind': 25, 'agility': 8}
            }
        }
        
        print("   ✓ Loaded stats and racial modifiers\n")
    
    # Helper methods
    
    def detect_species(self, name: str) -> str:
        """Detect species from character name"""
        name_lower = name.lower()
        if 'human' in name_lower: return 'human'
        if 'wookiee' in name_lower: return 'wookiee'
        if 'twilek' in name_lower: return 'twilek'
        if 'zabrak' in name_lower: return 'zabrak'
        if 'ithorian' in name_lower: return 'ithorian'
        if 'sullustan' in name_lower: return 'sullustan'
        if 'trandoshan' in name_lower: return 'trandoshan'
        if 'bothan' in name_lower: return 'bothan'
        if 'rodian' in name_lower: return 'rodian'
        return 'unknown'
    
    def get_species_spawn_locations(self, species: str) -> List[Dict[str, Any]]:
        """Get spawn locations for species"""
        spawn_map = {
            'human': [
                {'planet': 'tatooine', 'city': 'Bestine', 'x': -1290, 'y': 12, 'z': -3590},
                {'planet': 'naboo', 'city': 'Theed', 'x': -4856, 'y': 6, 'z': 4162},
                {'planet': 'corellia', 'city': 'Coronet', 'x': -137, 'y': 28, 'z': -4723}
            ],
            'wookiee': [
                {'planet': 'kashyyyk', 'city': 'Kachirho', 'x': 150, 'y': 15, 'z': 80}
            ],
            'twilek': [
                {'planet': 'ryloth', 'city': "Kala'uun", 'x': -200, 'y': 10, 'z': 300}
            ],
            'ithorian': [
                {'planet': 'tatooine', 'city': 'Mos Eisley', 'x': 3528, 'y': 5, 'z': -4804},
                {'planet': 'naboo', 'city': 'Moenia', 'x': 4734, 'y': 4, 'z': -4677}
            ],
            'sullustan': [
                {'planet': 'corellia', 'city': 'Tyrena', 'x': -5045, 'y': 21, 'z': -2400}
            ]
        }
        return spawn_map.get(species, spawn_map['human'])
    
    def extract_tier(self, name: str) -> int:
        """Extract tier from name"""
        match = re.search(r'tier(\d+)', name, re.IGNORECASE)
        return int(match.group(1)) if match else 1
    
    def detect_mount_category(self, ship_name: str) -> str:
        """Detect mount category"""
        fighters = ['xwing', 'tiefighter', 'awing', 'ywing', 'z95']
        speeders = ['flash_speeder', 'swoop']
        transports = ['transport', 'shuttle']
        
        for fighter in fighters:
            if fighter in ship_name:
                return 'fighter'
        for speeder in speeders:
            if speeder in ship_name:
                return 'speeder'
        for transport in transports:
            if transport in ship_name:
                return 'transport'
        return 'custom'
    
    def calculate_mount_speed(self, ship_name: str, tier: int) -> int:
        """Calculate mount speed"""
        base_speeds = {
            'xwing': 25, 'tiefighter': 28, 'awing': 30,
            'ywing': 20, 'z95': 22, 'flash_speeder': 18,
            'swoop': 26, 'transport': 15
        }
        
        speed = 20  # default
        for ship, base_speed in base_speeds.items():
            if ship in ship_name:
                speed = base_speed
                break
        
        tier_multiplier = 1 + ((tier - 1) * 0.05)
        return round(speed * tier_multiplier)
    
    def calculate_acceleration(self, ship_name: str) -> str:
        """Calculate acceleration"""
        if 'awing' in ship_name or 'tiefighter' in ship_name:
            return 'high'
        elif 'ywing' in ship_name or 'transport' in ship_name:
            return 'low'
        return 'medium'
    
    def calculate_turn_rate(self, ship_name: str) -> str:
        """Calculate turn rate"""
        if 'tiefighter' in ship_name or 'awing' in ship_name:
            return 'high'
        elif 'ywing' in ship_name or 'z95' in ship_name:
            return 'medium'
        elif 'transport' in ship_name:
            return 'low'
        return 'medium'
    
    def calculate_max_altitude(self, ship_name: str) -> int:
        """Calculate max altitude"""
        if any(s in ship_name for s in ['xwing', 'tiefighter', 'awing', 'ywing']):
            return 200
        elif 'speeder' in ship_name or 'swoop' in ship_name:
            return 50
        return 100
    
    def calculate_hover_height(self, ship_name: str) -> float:
        """Calculate hover height"""
        return 1.5 if 'speeder' in ship_name else 3.0
    
    def get_passenger_count(self, ship_name: str) -> int:
        """Get passenger seat count"""
        if 'transport' in ship_name or 'shuttle' in ship_name:
            return 4
        return 0
    
    def calculate_mount_scale(self, ship_name: str) -> float:
        """Calculate visual scale"""
        scales = {
            'tiefighter': 0.6, 'xwing': 0.7, 'awing': 0.7,
            'ywing': 0.75, 'transport': 0.9, 'speeder': 0.5
        }
        for ship, scale in scales.items():
            if ship in ship_name:
                return scale
        return 0.7
    
    def calculate_cost(self, ship_name: str, tier: int) -> int:
        """Calculate cost"""
        base_costs = {
            'xwing': 15000, 'tiefighter': 12000, 'awing': 18000,
            'ywing': 10000, 'transport': 25000
        }
        base_cost = 5000
        for ship, cost in base_costs.items():
            if ship in ship_name:
                base_cost = cost
                break
        return base_cost * tier
    
    def format_display_name(self, base_name: str, tier: int) -> str:
        """Format display name"""
        formatted = ' '.join(word.capitalize() for word in base_name.split('_'))
        return f"{formatted} Mk.{tier}" if tier > 1 else formatted
    
    def detect_shader_type(self, name: str) -> str:
        """Detect shader type"""
        if 'particle' in name: return 'particle'
        if 'water' in name: return 'water'
        if 'terrain' in name: return 'terrain'
        if 'blend' in name: return 'blend'
        if 'alpha' in name: return 'alpha'
        if 'emis' in name: return 'emissive'
        return 'standard'
    
    def extract_texture_references(self, content: str) -> List[str]:
        """Extract texture references from shader"""
        textures = []
        patterns = [
            r'["\'](.*?\.(?:dds|tga))["\']',
            r'texture\s*=\s*([^\s;]+)'
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            textures.extend(matches)
        return list(set(textures))


def main():
    import sys
    
    # Default path
    swg_path = r"C:\Users\david\OneDrive\Desktop\SWGTERRAIN"
    
    # Allow custom path as argument
    if len(sys.argv) > 1:
        swg_path = sys.argv[1]
    
    # Parse assets
    parser = SWGAssetParser(swg_path)
    results = parser.parse_all()
    
    # Generate output filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'swg_assets_{timestamp}.json'
    
    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("=" * 60)
    print("  Summary")
    print("=" * 60)
    print(f"Characters:     {len(results['characters'])}")
    print(f"Flying Mounts:  {len(results['flying_mounts'])}")
    print(f"Effects:        {len(results['effects'])}")
    print(f"Professions:    {len(results['professions'])}")
    print(f"Stats:          {len(results['stats']['attributes'])} attributes")
    print("=" * 60)
    print(f"\n✓ Saved to: {output_file}")
    print("\nYou can now import this JSON into your web client!")


if __name__ == '__main__':
    main()
