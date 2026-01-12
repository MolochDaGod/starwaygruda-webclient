#!/usr/bin/env node

/**
 * SWG Asset Parser CLI
 * Parses original SWG assets and generates a replacement manifest
 * 
 * Usage:
 *   node parse-assets.js [options]
 * 
 * Options:
 *   --swg-path <path>     Path to SWGTERRAIN directory (default: C:\Users\david\OneDrive\Desktop\SWGTERRAIN)
 *   --output <file>       Output file for manifest (default: asset-manifest.json)
 *   --format <type>       Output format: json|yaml|markdown (default: json)
 */

import { SWGAssetParser } from './src/loaders/SWGAssetParser.js';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    swgPath: 'C:\\Users\\david\\OneDrive\\Desktop\\SWGTERRAIN',
    output: 'asset-manifest.json',
    format: 'json'
};

for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    switch (flag) {
        case '--swg-path':
            options.swgPath = value;
            break;
        case '--output':
            options.output = value;
            break;
        case '--format':
            options.format = value;
            break;
    }
}

console.log('═══════════════════════════════════════════════════════');
console.log('  SWG Asset Parser - StarWayGRUDA Asset Migration Tool');
console.log('═══════════════════════════════════════════════════════');
console.log(`Source: ${options.swgPath}`);
console.log(`Output: ${options.output}`);
console.log('───────────────────────────────────────────────────────\n');

async function main() {
    try {
        // Initialize parser
        const parser = new SWGAssetParser(options.swgPath);
        
        // Parse all assets
        console.log('Starting asset parsing...\n');
        const results = await parser.parseAllAssets();
        
        console.log('\n───────────────────────────────────────────────────────');
        console.log('Parsing complete! Summary:');
        console.log('───────────────────────────────────────────────────────');
        console.log(`Characters:  ${results.characters.length}`);
        console.log(`Effects:     ${results.effects.length}`);
        console.log(`Professions: ${results.professions.length}`);
        console.log(`Attributes:  ${Object.keys(results.stats.attributes).length}`);
        console.log(`Racial Mods: ${Object.keys(results.stats.racialMods).length}`);
        console.log('───────────────────────────────────────────────────────\n');
        
        // Generate replacement manifest
        console.log('Generating replacement manifest...');
        const manifest = parser.generateReplacementManifest();
        
        // Save manifest
        switch (options.format) {
            case 'json':
                saveJSON(manifest, options.output);
                break;
            case 'yaml':
                saveYAML(manifest, options.output);
                break;
            case 'markdown':
                saveMarkdown(manifest, options.output);
                break;
            default:
                console.error(`Unknown format: ${options.format}`);
                process.exit(1);
        }
        
        console.log(`\n✓ Manifest saved to: ${options.output}`);
        
        // Print detailed breakdown
        printDetailedBreakdown(results);
        
    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

function saveJSON(manifest, outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
}

function saveYAML(manifest, outputPath) {
    // Simple YAML serialization (for full YAML support, use js-yaml package)
    const yaml = objectToYAML(manifest);
    fs.writeFileSync(outputPath, yaml);
}

function saveMarkdown(manifest, outputPath) {
    const md = [];
    
    md.push('# SWG Asset Replacement Manifest');
    md.push('');
    md.push(`**Generated:** ${manifest.timestamp}`);
    md.push(`**Source:** ${manifest.source}`);
    md.push('');
    
    md.push('## Characters');
    md.push('');
    for (const char of manifest.characters) {
        md.push(`### ${char.name}`);
        md.push(`- **Original:** ${char.original}`);
        md.push(`- **Model:** ${char.replacement.model}`);
        md.push(`- **Textures:** ${char.replacement.textures.join(', ')}`);
        md.push(`- **Required Effects:** ${char.requiredEffects.join(', ')}`);
        md.push('');
    }
    
    md.push('## Effects');
    md.push('');
    for (const effect of manifest.effects) {
        md.push(`### ${effect.name}`);
        md.push(`- **Original:** ${effect.original}`);
        md.push(`- **Shader:** ${effect.replacement.shader}`);
        md.push(`- **Properties:** Alpha:${effect.properties.hasAlpha}, Blend:${effect.properties.hasBlend}, Emissive:${effect.properties.hasEmissive}`);
        md.push('');
    }
    
    md.push('## Professions');
    md.push('');
    for (const prof of manifest.professions) {
        md.push(`### ${prof.name}`);
        md.push(`- **Description:** ${prof.description}`);
        md.push(`- **Skills:** ${prof.skills.join(', ')}`);
        md.push(`- **Required Stats:** Health:${prof.requiredStats.health}, Action:${prof.requiredStats.action}, Mind:${prof.requiredStats.mind}`);
        md.push('');
    }
    
    fs.writeFileSync(outputPath, md.join('\n'));
}

function objectToYAML(obj, indent = 0) {
    const lines = [];
    const spaces = ' '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            lines.push(`${spaces}${key}: null`);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            lines.push(`${spaces}${key}:`);
            lines.push(objectToYAML(value, indent + 2));
        } else if (Array.isArray(value)) {
            lines.push(`${spaces}${key}:`);
            for (const item of value) {
                if (typeof item === 'object') {
                    lines.push(`${spaces}  -`);
                    lines.push(objectToYAML(item, indent + 4));
                } else {
                    lines.push(`${spaces}  - ${item}`);
                }
            }
        } else {
            lines.push(`${spaces}${key}: ${value}`);
        }
    }
    
    return lines.join('\n');
}

function printDetailedBreakdown(results) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Detailed Breakdown');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Characters
    console.log('📦 Characters:');
    results.characters.slice(0, 5).forEach(char => {
        console.log(`   - ${char.name} (${char.filePath})`);
        if (char.appearance) console.log(`     Appearance: ${char.appearance}`);
        if (char.effects.length > 0) console.log(`     Effects: ${char.effects.join(', ')}`);
    });
    if (results.characters.length > 5) {
        console.log(`   ... and ${results.characters.length - 5} more\n`);
    } else {
        console.log('');
    }
    
    // Effects
    console.log('✨ Effects (Sample):');
    results.effects.slice(0, 10).forEach(effect => {
        const props = [];
        if (effect.hasAlpha) props.push('alpha');
        if (effect.hasBlend) props.push('blend');
        if (effect.hasEmissive) props.push('emissive');
        if (effect.hasBump) props.push('bump');
        if (effect.hasSpecular) props.push('specular');
        console.log(`   - ${effect.name} [${effect.shaderType}] (${props.join(', ')})`);
    });
    if (results.effects.length > 10) {
        console.log(`   ... and ${results.effects.length - 10} more\n`);
    } else {
        console.log('');
    }
    
    // Professions
    console.log('🎯 Professions:');
    results.professions.forEach(prof => {
        console.log(`   - ${prof.name}: ${prof.description || 'No description'}`);
        console.log(`     Skills: ${prof.startingSkills.join(', ') || 'None'}`);
    });
    console.log('');
    
    // Stats
    console.log('📊 Stats:');
    console.log('   Attributes:', Object.keys(results.stats.attributes).join(', '));
    console.log('   Racial Mods:', Object.keys(results.stats.racialMods).join(', '));
    console.log('');
    
    // Dependencies
    console.log('🔗 Dependencies:');
    console.log(`   Total asset references: ${results.dependencies.summary.totalCharacters + results.dependencies.summary.totalEffects}`);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Next Steps');
    console.log('═══════════════════════════════════════════════════════');
    console.log('1. Review the generated manifest file');
    console.log('2. Extract .iff models using SWG Model Viewer/Extractor');
    console.log('3. Convert models to GLTF format');
    console.log('4. Extract and convert textures from .dds to .png');
    console.log('5. Create Three.js compatible shaders based on .eft files');
    console.log('6. Implement character creation system with professions/stats');
    console.log('═══════════════════════════════════════════════════════\n');
}

// Run the parser
main();
