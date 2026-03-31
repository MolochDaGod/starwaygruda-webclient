/**
 * Grudge Web Engine — Scene Editor
 * 
 * Visual scene editor powered by Babylon 9 with:
 *   - Move/Rotate/Scale gizmos (W/E/R keys)
 *   - Scene hierarchy panel (live scene graph)
 *   - Add primitives (box, sphere, cylinder, point light)
 *   - Load glTF models from file picker
 *   - Save/Load scene as JSON
 *   - Babylon Inspector toggle
 * 
 * Created by Racalvin The Pirate King — Grudge Studio
 */

import { GrudgeEngine } from './core/GrudgeEngine.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { GizmoManager } from '@babylonjs/core/Gizmos/gizmoManager';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import '@babylonjs/loaders/glTF';

let grudge;
let gizmoManager;
let selectedMesh = null;
let meshCounter = 0;

async function boot() {
    grudge = new GrudgeEngine('renderCanvas', {
        enableWebGPU: true,
        enableInspector: true,
        enableShadows: true,
    });
    await grudge.init();

    const scene = grudge.getScene();

    // ── Gizmo Manager ────────────────────────────────────────────
    gizmoManager = new GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = false;
    gizmoManager.scaleGizmoEnabled = false;
    gizmoManager.boundingBoxGizmoEnabled = false;
    gizmoManager.usePointerToAttachGizmos = true;

    // Track selected mesh from gizmo
    gizmoManager.onAttachedToMeshObservable.add((mesh) => {
        selectedMesh = mesh;
        updateSceneTree();
    });

    // ── Keyboard shortcuts for gizmo modes ───────────────────────
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === 'w' || e.key === 'W') setGizmoMode('move');
        if (e.key === 'e' || e.key === 'E') setGizmoMode('rotate');
        if (e.key === 'r' || e.key === 'R') setGizmoMode('scale');
        if (e.key === 'Delete' && selectedMesh) {
            selectedMesh.dispose();
            selectedMesh = null;
            updateSceneTree();
        }
    });

    // ── Sidebar buttons ──────────────────────────────────────────
    document.getElementById('addBox').onclick = () => addPrimitive('box');
    document.getElementById('addSphere').onclick = () => addPrimitive('sphere');
    document.getElementById('addCylinder').onclick = () => addPrimitive('cylinder');
    document.getElementById('addLight').onclick = () => addPointLight();
    document.getElementById('loadModel').onclick = () => loadGLTFModel();
    document.getElementById('saveScene').onclick = () => saveScene();
    document.getElementById('loadScene').onclick = () => loadSceneFromFile();
    document.getElementById('toggleInspector').onclick = () => toggleInspector();

    // Gizmo toolbar
    document.getElementById('gizmoMove').onclick = () => setGizmoMode('move');
    document.getElementById('gizmoRotate').onclick = () => setGizmoMode('rotate');
    document.getElementById('gizmoScale').onclick = () => setGizmoMode('scale');

    // ── Start ────────────────────────────────────────────────────
    grudge.run();
    updateSceneTree();

    window.grudgeEngine = grudge;
    console.log('[GrudgeEditor] Ready — Babylon 9.0 Scene Editor');
}

// ═══════════════════════════════════════════════════════════════
// GIZMO MODE
// ═══════════════════════════════════════════════════════════════

function setGizmoMode(mode) {
    gizmoManager.positionGizmoEnabled = mode === 'move';
    gizmoManager.rotationGizmoEnabled = mode === 'rotate';
    gizmoManager.scaleGizmoEnabled = mode === 'scale';

    document.querySelectorAll('.viewport-toolbar button').forEach(b => b.classList.remove('active'));
    const map = { move: 'gizmoMove', rotate: 'gizmoRotate', scale: 'gizmoScale' };
    document.getElementById(map[mode])?.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════
// ADD PRIMITIVES
// ═══════════════════════════════════════════════════════════════

function addPrimitive(type) {
    const scene = grudge.getScene();
    meshCounter++;
    const name = `${type}_${meshCounter}`;
    let mesh;

    switch (type) {
        case 'box':
            mesh = MeshBuilder.CreateBox(name, { size: 2 }, scene);
            break;
        case 'sphere':
            mesh = MeshBuilder.CreateSphere(name, { diameter: 2, segments: 24 }, scene);
            break;
        case 'cylinder':
            mesh = MeshBuilder.CreateCylinder(name, { height: 3, diameter: 1.5 }, scene);
            break;
    }

    if (mesh) {
        mesh.position.y = 1;
        // Random color PBR material
        const mat = new PBRMaterial(`${name}_mat`, scene);
        mat.albedoColor = new Color3(Math.random() * 0.5 + 0.3, Math.random() * 0.5 + 0.2, Math.random() * 0.5 + 0.1);
        mat.metallic = 0.2;
        mat.roughness = 0.6;
        mesh.material = mat;
        grudge.addShadowCaster(mesh);

        gizmoManager.attachToMesh(mesh);
        selectedMesh = mesh;
        updateSceneTree();
    }
}

function addPointLight() {
    const scene = grudge.getScene();
    meshCounter++;
    const light = new PointLight(`pointLight_${meshCounter}`, new Vector3(0, 5, 0), scene);
    light.intensity = 2;
    light.diffuse = new Color3(1, 0.9, 0.7);
    updateSceneTree();
}

// ═══════════════════════════════════════════════════════════════
// LOAD GLTF MODEL
// ═══════════════════════════════════════════════════════════════

function loadGLTFModel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.glb,.gltf';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        try {
            const result = await SceneLoader.ImportMeshAsync('', url, '', grudge.getScene());
            result.meshes.forEach(m => {
                if (m.name === '__root__') m.name = file.name.replace(/\.\w+$/, '');
                grudge.addShadowCaster(m);
            });
            updateSceneTree();
            console.log(`[GrudgeEditor] Loaded model: ${file.name} (${result.meshes.length} meshes)`);
        } catch (err) {
            console.error('[GrudgeEditor] Failed to load model:', err);
            alert(`Failed to load model: ${err.message}`);
        }
    };
    input.click();
}

// ═══════════════════════════════════════════════════════════════
// SCENE TREE
// ═══════════════════════════════════════════════════════════════

function updateSceneTree() {
    const tree = document.getElementById('sceneTree');
    if (!tree) return;
    const scene = grudge.getScene();
    const meshes = scene.meshes.filter(m => m.name !== 'ground' && m.name !== 'skybox' && !m.name.startsWith('_'));

    tree.innerHTML = meshes.length === 0
        ? '<div style="color:rgba(255,255,255,0.3);padding:8px;">No objects in scene</div>'
        : meshes.map(m => `
            <div class="node${selectedMesh === m ? ' style="color:#FAAC47;background:rgba(250,172,71,0.15);"' : ''}" 
                 data-id="${m.uniqueId}">
                ${m.name || 'unnamed'}
            </div>
        `).join('');

    tree.querySelectorAll('.node').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.dataset.id);
            const mesh = scene.meshes.find(m => m.uniqueId === id);
            if (mesh) {
                gizmoManager.attachToMesh(mesh);
                selectedMesh = mesh;
                updateSceneTree();
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// SAVE / LOAD SCENE
// ═══════════════════════════════════════════════════════════════

function saveScene() {
    const data = grudge.serializeScene();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grudge-scene-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('[GrudgeEditor] Scene saved');
}

function loadSceneFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text);
        await grudge.loadSceneFromJSON(data);
        updateSceneTree();
        console.log('[GrudgeEditor] Scene loaded from file');
    };
    input.click();
}

// ═══════════════════════════════════════════════════════════════
// INSPECTOR
// ═══════════════════════════════════════════════════════════════

let inspectorVisible = false;
async function toggleInspector() {
    const scene = grudge.getScene();
    if (inspectorVisible) {
        scene.debugLayer.hide();
    } else {
        await import('@babylonjs/inspector');
        scene.debugLayer.show({ embedMode: true, overlay: true });
    }
    inspectorVisible = !inspectorVisible;
}

// ═══════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════

boot().catch(err => {
    console.error('[GrudgeEditor] Boot failed:', err);
});
