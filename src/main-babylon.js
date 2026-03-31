/**
 * Grudge Web Engine — Babylon 9 Entry Point
 * 
 * Replaces the Three.js main.js with a Babylon 9 powered scene.
 * Boots GrudgeEngine and sets up a basic world with:
 *   - PBR ground, hemisphere + directional lighting, shadows
 *   - Test meshes (sphere, box) as placeholders for character prefabs
 *   - glTF model loading support
 *   - Shift+F12 to open Babylon Inspector
 * 
 * Created by Racalvin The Pirate King — Grudge Studio
 */

import { GrudgeEngine } from './core/GrudgeEngine.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';

async function boot() {
    // Create and init engine
    const grudge = new GrudgeEngine('renderCanvas', {
        enableWebGPU: true,
        enableInspector: true,
        enableShadows: true,
    });
    await grudge.init();

    const scene = grudge.getScene();

    // ── Demo objects ──────────────────────────────────────────────

    // Glowing sphere (placeholder for player character)
    const playerSphere = MeshBuilder.CreateSphere('player', { diameter: 1.5, segments: 32 }, scene);
    playerSphere.position.y = 0.75;
    const playerMat = new PBRMaterial('playerMat', scene);
    playerMat.albedoColor = new Color3(0.9, 0.7, 0.2); // Grudge gold
    playerMat.metallic = 0.3;
    playerMat.roughness = 0.4;
    playerMat.emissiveColor = new Color3(0.3, 0.2, 0.05);
    playerSphere.material = playerMat;
    grudge.addShadowCaster(playerSphere);

    // Camera follows the player sphere
    grudge.followTarget(playerSphere);

    // Some environment boxes
    const createPillar = (name, x, z, height, color) => {
        const box = MeshBuilder.CreateBox(name, { width: 1.5, height, depth: 1.5 }, scene);
        box.position.set(x, height / 2, z);
        const mat = new PBRMaterial(`${name}Mat`, scene);
        mat.albedoColor = color;
        mat.metallic = 0.1;
        mat.roughness = 0.7;
        box.material = mat;
        grudge.addShadowCaster(box);
        return box;
    };

    createPillar('pillar1', -5, 5, 3, new Color3(0.6, 0.2, 0.2));
    createPillar('pillar2', 5, 5, 4, new Color3(0.2, 0.6, 0.3));
    createPillar('pillar3', 0, 8, 5, new Color3(0.2, 0.3, 0.7));
    createPillar('pillar4', -8, -3, 2, new Color3(0.5, 0.3, 0.6));
    createPillar('pillar5', 7, -4, 6, new Color3(0.3, 0.5, 0.2));

    // ── Start render loop ────────────────────────────────────────
    grudge.run();

    // ── HUD ──────────────────────────────────────────────────────
    const hud = document.createElement('div');
    hud.style.cssText = 'position:fixed;top:12px;left:12px;color:#fbbf24;font:13px/1.4 monospace;background:rgba(0,0,0,0.6);padding:8px 12px;border-radius:8px;pointer-events:none;z-index:100;';
    hud.innerHTML = `
        <div style="font-size:16px;font-weight:bold;margin-bottom:4px;">GRUDGE WEB ENGINE</div>
        <div style="color:#94a3b8;font-size:11px;">Babylon.js 9.0 | Shift+F12 = Inspector</div>
        <div style="color:#94a3b8;font-size:11px;">Scroll = Zoom | LMB Drag = Orbit</div>
    `;
    document.body.appendChild(hud);

    // Expose globally for debugging
    window.grudgeEngine = grudge;
    console.log('[GrudgeWebEngine] Ready — Babylon 9.0 | Shift+F12 for Inspector');
}

boot().catch(err => {
    console.error('[GrudgeWebEngine] Boot failed:', err);
    document.body.innerHTML = `<div style="color:red;padding:40px;font:16px monospace;">Engine boot failed: ${err.message}</div>`;
});
