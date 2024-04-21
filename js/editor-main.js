import * as THREE from 'https://unpkg.com/three@0.145.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.145.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@v0.132.0/examples/jsm/loaders/GLTFLoader.js';
import { FlyControls } from 'https://unpkg.com/three@0.145.0/examples/jsm/controls/FlyControls.js';
import { GLTFExporter } from 'https://cdn.skypack.dev/three@v0.132.0/examples/jsm//exporters/GLTFExporter.js';
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.145.0/examples/jsm/webxr/VRButton.min.js";
import { TransformControls } from 'https://unpkg.com/three@0.145.0/examples/jsm/controls/TransformControls.js';
// import { XRControllerModelFactory } from 'https://cdn.jsdelivr.net/npm/three@0.145.0/examples/jsm/webxr/XRControllerModelFactory.js';
import { vertexShader, fragmentShader, startFinishVS, startFinishFS } from './shaders.js';
let webusb = null;
let adb = null;
let shell = null;
let sync = null;
let camera, scene, renderer, light, controls, fly, loader, sun, transformControl, raycaster, mouse, lastSelected, selected, editing, vrButton, startMaterial, finishMaterial;
let objects = [];
let animatedObjects = [];
let materials = [];
let shapes = [];
let exportMaterials = [];
let fileNames = [
    "angle_slide",
    "elevate",
    "flip",
    "roll",
    "screw",
    "shake",
    "slide",
    "spin",
    "square",
    "wobble"
];
let animationPresets = {};
let altTextures = false;
let hideText = false;
let highlightText = true;
let showGroups = false;
let enableEditing = false;
let playAnimations = true;
let animationTime = 0.0;
let animationSpeed = 1.0;
let clock = new THREE.Clock();
let decoder = new TextDecoder();
let lastRan = '';
let oldText = '';
let templates = await fetch('/level_data/templates.json').then(response => response.json());
let protobufData = await fetch('/proto/proto.proto').then(response => response.text());

// elements
const applyChangesElement = document.getElementById('applyChanges');
const applyChangesAsFrameElement = document.getElementById('applyChangesAsFrame');
const formatWarningElement = document.getElementById('formatWarning');
const typeWarningElement = document.getElementById('definitionWarning');
const editInputElement = document.getElementById('edit-input');
const renderContainerElement = document.getElementById('render-container');
const terminalInputElement = document.getElementById('terminal-input');
const templatesContainerElement = document.getElementById('templates-container');
const timelineSliderElement = document.getElementById('timeline-slider');
const statsComplexityElement = document.getElementById('stats-complexity');
const statsAnimationsElement = document.getElementById('stats-animations');
const statsGroupsElement = document.getElementById('stats-groups');
const statsFramesElement = document.getElementById('stats-frames');
const statsCharactersElement = document.getElementById('stats-characters');
const statsObjectsElement = document.getElementById('stats-objects');
const statsStaticElement = document.getElementById('stats-static');
const statsCrumblingElement = document.getElementById('stats-crumbling');
const statsStartElement = document.getElementById('stats-start');
const statsEndElement = document.getElementById('stats-end');
const statsSignElement = document.getElementById('stats-sign');
const statsGravityElement = document.getElementById('stats-gravity');
const statsNeonElement = document.getElementById('stats-neon');
const statsGravityNoLegsElement = document.getElementById('stats-gravityNoLegs');
const statsDefaultElement = document.getElementById('stats-default');
const statsGrabbableElement = document.getElementById('stats-grabbable');
const statsLavaElement = document.getElementById('stats-lava');
const statsGrapplableElement = document.getElementById('stats-grapplable');
const statsGrapplable_lavaElement = document.getElementById('stats-grapplable_lava');
const statsGrabbable_crumblingElement = document.getElementById('stats-grabbable_crumbling');
const statsDefault_coloredElement = document.getElementById('stats-default_colored');
const statsBouncingElement = document.getElementById('stats-bouncing');
const statsIceElement = document.getElementById('stats-ice');
const statsWoodElement = document.getElementById('stats-wood');
const statsCubeElement = document.getElementById('stats-cube');
const statsSphereElement = document.getElementById('stats-sphere');
const statsCylinderElement = document.getElementById('stats-cylinder');
const statsPyramidElement = document.getElementById('stats-pyramid');
const statsPrismElement = document.getElementById('stats-prism');

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function runOnObjects(objects, func, doGroups = true) {
    objects.forEach((object) => {
        let isGroup = node?.grabNodeData?.levelNodeGroup ? true : false;
        if ((isGroup && doGroups) || !isGroup) {
            func(object);
        }
        if (isGroup) {
            runOnObjects(object.children, func, doGroups);
        }
    });
}
function runOnNodes(nodes, func, doGroups = true) {
    nodes.forEach((node) => {
        let isGroup = node.hasOwnProperty("levelNodeGroup");
        if ((isGroup && doGroups) || !isGroup) {
            func(node);
        }
        if (isGroup) {
            runOnNodes(node.levelNodeGroup.childNodes, func, doGroups);
        }
    });
}
function getLevel() {
    return JSON.parse(editInputElement.innerText);
}
function setLevel(level) {
    console.log(level);
    formatWarningElement.style.display = level.formatVersion < 6 ? "block" : "none";    
    level.levelNodes ? {} : level.levelNodes = [];
    level.levelNodes.forEach(node => {
        if (node?.levelNodeStatic && node.levelNodeStatic.material == 8) {
            node.levelNodeStatic.color ? {} : node.levelNodeStatic.color = {};
            node.levelNodeStatic.color.r ? {} : node.levelNodeStatic.color.r = 0;
            node.levelNodeStatic.color.g ? {} : node.levelNodeStatic.color.g = 0;
            node.levelNodeStatic.color.b ? {} : node.levelNodeStatic.color.b = 0;
        }
    });

    editInputElement.innerText = JSON.stringify(level, null, 4);
    highlightTextEditor();
}

function JsonToHighlightedText(json) {
    let stringified = json;
    if (typeof json !== 'string') {
        stringified = JSON.stringify(json, null, 4);
    }
    // color shadows
    let highlightedText = stringified.replace(/"color":\s*{\s*("r":\s*(\d+(?:\.\d+)?),)?\s*("g":\s*(\d+(?:\.\d+)?),)?\s*("b":\s*(\d+(?:\.\d+)?),)?\s*("a":\s*\d+(?:\.\d+)?)?\s*}/, (match) => {
        let jsonData = JSON.parse(`{${match}}`);
        let color = `rgba(${(jsonData.color.r || 0) * 255}, ${(jsonData.color.g || 0) * 255}, ${(jsonData.color.b || 0) * 255}, 0.3)`;
        return `<span style='text-shadow: 0 0 10px ${color}, 0 0 10px ${color}, 0 0 10px ${color}, 0 0 10px ${color}, 0 0 10px ${color}, 0 0 10px ${color};'>${match}</span>`
    });
    // strings and attributes
    highlightedText = highlightedText.replace(/([bruf]*)(\"""|")(?:(?!\2)(?:\\.|[^\\]))*\2:?/gs, (match) => {
        if (match.endsWith(":")) {
            return `<span style="color: #dd612e">${match.slice(0,-1)}</span><span style="color: #007acc">:</span>`;
        } else {
            return `<span style="color: #487e02">${match}</span>`;
        }
    });
    // start and finish
    highlightedText = highlightedText.replace(/"levelNodeFinish"/gsi, (match) => {
        return `<span style="background: #f006;">${match}</span>`
    });
    highlightedText = highlightedText.replace(/"levelNodeStart"/gsi, (match) => {
        return `<span style="background: #0f06;">${match}</span>`
    });
    // materials
    highlightedText = highlightedText.replace(/<span style="color: #dd612e">"material"<\/span><span style="color: #007acc">:<\/span> ?[0-9]/gsi, (match) => {
        switch (parseInt(match.split(">")[4])) {
            case 0:
                return `<span style="background-image: url(/img/textures/default.png); background-size: contain">${match}</span>`;
            case 1:
                return `<span style="background-image: url(/img/textures/grabbable.png); background-size: contain">${match}</span>`;
            case 2:
                return `<span style="background-image: url(/img/textures/ice.png); background-size: contain">${match}</span>`;
            case 3:
                return `<span style="background-image: url(/img/textures/lava.png); background-size: contain">${match}</span>`;
            case 4:
                return `<span style="background-image: url(/img/textures/wood.png); background-size: contain">${match}</span>`;
            case 5:
                return `<span style="background-image: url(/img/textures/grapplable.png); background-size: contain">${match}</span>`;
            case 6:
                return `<span style="background-image: url(/img/textures/grapplable_lava.png); background-size: contain">${match}</span>`;
            case 7:
                return `<span style="background-image: url(/img/textures/grabbable_crumbling.png); background-size: contain">${match}</span>`;
            case 8:
                return `<span style="background-image: url(/img/textures/default_colored.png); background-size: contain">${match}</span>`;
            case 9:
                return `<span style="background-image: url(/img/textures/bouncing.png); background-size: contain">${match}</span>`;
            default:
                break;
        }
        return match;
    });

    return highlightedText;
}

function highlightTextEditor() {
    let hasChanged = oldText != editInputElement.innerHTML;
    if (!hideText && hasChanged) {
        if (highlightText) {
            editInputElement.innerHTML = JsonToHighlightedText(editInputElement.innerText);
        } else {
            editInputElement.innerHTML = JSON.stringify(JSON.parse(editInputElement.innerText), null, 4);
        }
    }
    if (hasChanged) {
        refreshScene();
    }
    oldText = editInputElement.innerHTML;
}
function loadTexture(path) {
    return new Promise((resolve) => {
        const texture = new THREE.TextureLoader().load(path, function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            resolve(texture);
        });
    });
}
function loadModel(path) {
    return new Promise((resolve) => {
        loader.load(path, function (gltf) {
            resolve(gltf.scene.children[0]);
        });
    });
}
async function initAttributes() {

    for (const path of [
        '/img/textures/default.png',
        '/img/textures/grabbable.png',
        '/img/textures/ice.png',
        '/img/textures/lava.png',
        '/img/textures/wood.png',
        '/img/textures/grapplable.png',
        '/img/textures/grapplable_lava.png',
        '/img/textures/grabbable_crumbling.png',
        '/img/textures/default_colored.png',
        '/img/textures/bouncing.png'
        ]) {
            const texture = await loadTexture(path);
            let material = new THREE.MeshBasicMaterial({ map: texture });
            
            exportMaterials.push(material);
        }

    for (const path of [
        '/img/textures/default.png',
        '/img/textures/grabbable.png',
        '/img/textures/ice.png',
        '/img/textures/lava.png',
        '/img/textures/wood.png',
        '/img/textures/grapplable.png',
        '/img/textures/grapplable_lava.png',
        '/img/textures/grabbable_crumbling.png',
        '/img/textures/default_colored.png',
        '/img/textures/bouncing.png'
        ]) {
            const texture = await loadTexture(path);

            let sunAngle = new THREE.Euler(THREE.MathUtils.degToRad(45), THREE.MathUtils.degToRad(315), 0.0)
			let sunAltitude = 45.0
			let horizonColor = [0.916, 0.9574, 0.9574]
            const sunDirection = new THREE.Vector3( 0, 0, 1 );
			sunDirection.applyEuler(sunAngle);
            let sunColorFactor = 1.0 - sunAltitude / 90.0
			sunColorFactor *= sunColorFactor
			sunColorFactor = 1.0 - sunColorFactor
			sunColorFactor *= 0.8
			sunColorFactor += 0.2
			let sunColor = [horizonColor[0] * (1.0 - sunColorFactor) + sunColorFactor, horizonColor[1] * (1.0 - sunColorFactor) + sunColorFactor, horizonColor[2] * (1.0 - sunColorFactor) + sunColorFactor]

            let material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    "colorTexture": { value: texture },
                    "tileFactor": { value: 1.1 },
                    "worldNormalMatrix": { value: new THREE.Matrix3() },
                    "colors": { value: new THREE.Vector3(1.0, 1.0, 1.0) },
                    "opacity": { value: 1.0 },
                    "sunSize": { value: 0.1 },
                    "sunColor": { value: sunColor },
                    "sunDirection": { value: sunDirection },
                    "specularColor": { value: [0.15, 0.15, 0.15, 10.0] },
                    "isSelected": { value: false }
                }
            });

            materials.push(material);
        }

    for (const path of [
        'models/editor/cube.glb',
        'models/editor/sphere.glb',
        'models/editor/cylinder.glb',
        'models/editor/pyramid.glb',
        'models/editor/prism.glb',
        'models/editor/sign.glb',
        'models/editor/start_end.glb'
    ]) {
        const model = await loadModel(path);
        shapes.push(model);
    }

    startMaterial = new THREE.ShaderMaterial();
	startMaterial.vertexShader = startFinishVS;
	startMaterial.fragmentShader = startFinishFS;
	startMaterial.flatShading = true;
	startMaterial.transparent = true;
	startMaterial.depthWrite = false;
	startMaterial.uniforms = { "diffuseColor": {value: [0.0, 1.0, 0.0, 1.0]}};

	finishMaterial = new THREE.ShaderMaterial();
	finishMaterial.vertexShader = startFinishVS;
	finishMaterial.fragmentShader = startFinishFS;
	finishMaterial.flatShading = true;
	finishMaterial.transparent = true;
	finishMaterial.depthWrite = false;
	finishMaterial.uniforms = { "diffuseColor": {value: [1.0, 0.0, 0.0, 1.0]}};

    console.log('Ready', materials, shapes);
    
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('level');

    if (paramId) {
        const login_details = {
            "user_name": localStorage.getItem('user_name'),
            "user_id": localStorage.getItem('user_id')
        }
        if (login_details.user_name && login_details.user_id) {
            downloadAndOpenLevel(paramId);
        } else {
            const loginPromptElement = document.getElementById('loginPrompt');
            loginPromptElement.style.display = 'grid';
            loginPromptElement.addEventListener('click', () => {
                loginPromptElement.style.display = 'none';
            });
        }
    }

}
function refreshScene() {
    let levelData = getLevel();
    document.getElementById('stats-editor').innerText = `Editor: ${JSON.stringify(levelData, null, 4).length}`;
    let levelNodes = levelData["levelNodes"];
    console.log(objects.length, animatedObjects.length);
    let statistics = {
        // basic stats
        complexity: 0,
        animations: 0,
        groups: 0,
        frames: 0,
        characters: 0,
        objects: 0,
        // node types
        static: 0,
        crumbling: 0,
        start: 0,
        end: 0,
        sign: 0,
        gravity: 0,
        // materials
        default: 0,
        grabbable: 0,
        lava: 0,
        grapplable: 0,
        grapplable_lava: 0,
        grabbable_crumbling: 0,
        default_colored: 0,
        bouncing: 0,
        ice: 0,
        wood: 0,
        // special attributes
        neon: 0,
        gravityNoLegs: 0,
        // shapes
        cube: 0,
        sphere: 0,
        cylinder: 0,
        pyramid: 0,
        prism: 0,
        danger: false
    };
    objects = [];
    animatedObjects = [];
    scene.clear();
    
    levelNodes.forEach((node) => {
        let nodeStatistics = loadLevelNode(node, scene);
        statistics.complexity += nodeStatistics.complexity;
        statistics.animations += nodeStatistics.animations;
        statistics.groups += nodeStatistics.groups;
        statistics.frames += nodeStatistics.frames;
        statistics.characters += nodeStatistics.characters;
        statistics.objects += nodeStatistics.objects;
        statistics.static += nodeStatistics.static;
        statistics.crumbling += nodeStatistics.crumbling;
        statistics.start += nodeStatistics.start;
        statistics.end += nodeStatistics.end;
        statistics.sign += nodeStatistics.sign;
        statistics.gravity += nodeStatistics.gravity;
        statistics.neon += nodeStatistics.neon;
        statistics.gravityNoLegs += nodeStatistics.gravityNoLegs;
        statistics.default += nodeStatistics.default;
        statistics.grabbable += nodeStatistics.grabbable;
        statistics.lava += nodeStatistics.lava;
        statistics.grapplable += nodeStatistics.grapplable;
        statistics.grapplable_lava += nodeStatistics.grapplable_lava;
        statistics.grabbable_crumbling += nodeStatistics.grabbable_crumbling;
        statistics.default_colored += nodeStatistics.default_colored;
        statistics.bouncing += nodeStatistics.bouncing;
        statistics.ice += nodeStatistics.ice;
        statistics.wood += nodeStatistics.wood;
        statistics.cube += nodeStatistics.cube;
        statistics.sphere += nodeStatistics.sphere;
        statistics.cylinder += nodeStatistics.cylinder;
        statistics.pyramid += nodeStatistics.pyramid;
        statistics.prism += nodeStatistics.prism;
        nodeStatistics.danger ? statistics.danger = true : null;
    });
    
    statsComplexityElement.innerText = `Complexity: ${statistics.complexity}`;
    statsAnimationsElement.innerText = `Animations: ${statistics.animations}`;
    statsGroupsElement.innerText = `Groups: ${statistics.groups}`;
    statsFramesElement.innerText = `Frames: ${statistics.frames}`;
    statsCharactersElement.innerText = `Characters: ${statistics.characters}`;
    statsObjectsElement.innerText = `Objects: ${statistics.objects}`;
    statsStaticElement.innerText = `Static: ${statistics.static}`;
    statsCrumblingElement.innerText = `Crumbling: ${statistics.crumbling}`;
    statsStartElement.innerText = `Start: ${statistics.start}`;
    statsEndElement.innerText = `End: ${statistics.end}`;
    statsSignElement.innerText = `Sign: ${statistics.sign}`;
    statsGravityElement.innerText = `Gravity: ${statistics.gravity}`;
    statsNeonElement.innerText = `Neon: ${statistics.neon}`;
    statsGravityNoLegsElement.innerText = `Gravity No Legs: ${statistics.gravityNoLegs}`;
    statsDefaultElement.innerText = `Default: ${statistics.default}`;
    statsGrabbableElement.innerText = `Grabbable: ${statistics.grabbable}`;
    statsLavaElement.innerText = `Lava: ${statistics.lava}`;
    statsGrapplableElement.innerText = `Grapplable: ${statistics.grapplable}`;
    statsGrapplable_lavaElement.innerText = `Grapplable Lava: ${statistics.grapplable_lava}`;
    statsGrabbable_crumblingElement.innerText = `Grabbable Crumbling: ${statistics.grabbable_crumbling}`;
    statsDefault_coloredElement.innerText = `Default Colored: ${statistics.default_colored}`;
    statsBouncingElement.innerText = `Bouncing: ${statistics.bouncing}`;
    statsIceElement.innerText = `Ice: ${statistics.ice}`;
    statsWoodElement.innerText = `Wood: ${statistics.wood}`;
    statsCubeElement.innerText = `Cube: ${statistics.cube}`;
    statsSphereElement.innerText = `Sphere: ${statistics.sphere}`;
    statsCylinderElement.innerText = `Cylinder: ${statistics.cylinder}`;
    statsPyramidElement.innerText = `Pyramid: ${statistics.pyramid}`;
    statsPrismElement.innerText = `Prism: ${statistics.prism}`;

    typeWarningElement.style.display = statistics.danger ? 'block' : 'none';

    let ambience = levelData.ambienceSettings;
    let sky = [
        [
            0, 0, 0
        ],
        [
            0, 0, 0
        ]
    ];
    if (ambience) {
        if (ambience.skyZenithColor) {
            ambience.skyZenithColor.r ? sky[0][0] = ambience.skyZenithColor.r * 255 : sky[0][0] = 0;
            ambience.skyZenithColor.g ? sky[0][1] = ambience.skyZenithColor.g * 255 : sky[0][1] = 0;
            ambience.skyZenithColor.b ? sky[0][2] = ambience.skyZenithColor.b * 255 : sky[0][2] = 0;
        }
        if (ambience.skyHorizonColor) {
            ambience.skyHorizonColor.r ? sky[1][0] = ambience.skyHorizonColor.r * 255 : sky[1][0] = 0;
            ambience.skyHorizonColor.g ? sky[1][1] = ambience.skyHorizonColor.g * 255 : sky[1][1] = 0;
            ambience.skyHorizonColor.b ? sky[1][2] = ambience.skyHorizonColor.b * 255 : sky[1][2] = 0;
        }
    }

    renderContainerElement.style.backgroundImage = `linear-gradient(rgb(${sky[0][0]}, ${sky[0][1]}, ${sky[0][2]}), rgb(${sky[1][0]}, ${sky[1][1]}, ${sky[1][2]}), rgb(${sky[0][0]}, ${sky[0][1]}, ${sky[0][2]}))`;
    // console.log('Refreshed', scene, objects, animatedObjects);
    renderer.render( scene, camera );
}
function loadLevelNode(node, parent) {
    let object = undefined;
    let statistics = {
        // basic stats
        complexity: 0,
        animations: 0,
        groups: 0,
        frames: 0,
        characters: 0,
        objects: 1,
        // node types
        static: 0,
        crumbling: 0,
        start: 0,
        end: 0,
        sign: 0,
        gravity: 0,
        // materials
        default: 0,
        grabbable: 0,
        lava: 0,
        grapplable: 0,
        grapplable_lava: 0,
        grabbable_crumbling: 0,
        default_colored: 0,
        bouncing: 0,
        ice: 0,
        wood: 0,
        // special attributes
        neon: 0,
        gravityNoLegs: 0,
        // shapes
        cube: 0,
        sphere: 0,
        cylinder: 0,
        pyramid: 0,
        prism: 0,
        danger: false
    };
    if (node.levelNodeGroup) {
        object = new THREE.Object3D();
        if (showGroups) {
            let geometry = new THREE.BoxGeometry(1, 1, 1);
            let material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
            object = new THREE.Mesh(geometry, material);
        }
        objects.push( object );
        parent.add( object );
        node.levelNodeGroup.position.x ? object.position.x = node.levelNodeGroup.position.x : object.position.x = 0;
        node.levelNodeGroup.position.y ? object.position.y = node.levelNodeGroup.position.y : object.position.y = 0;
        node.levelNodeGroup.position.z ? object.position.z = node.levelNodeGroup.position.z : object.position.z = 0;
        node.levelNodeGroup.scale.x ? object.scale.x = node.levelNodeGroup.scale.x : object.scale.x = 0;
        node.levelNodeGroup.scale.y ? object.scale.y = node.levelNodeGroup.scale.y : object.scale.y = 0;
        node.levelNodeGroup.scale.z ? object.scale.z = node.levelNodeGroup.scale.z : object.scale.z = 0;
        node.levelNodeGroup.rotation.x ? object.quaternion.x = node.levelNodeGroup.rotation.x : object.quaternion.x = 0;
        node.levelNodeGroup.rotation.y ? object.quaternion.y = node.levelNodeGroup.rotation.y : object.quaternion.y = 0;
        node.levelNodeGroup.rotation.z ? object.quaternion.z = node.levelNodeGroup.rotation.z : object.quaternion.z = 0;
        node.levelNodeGroup.rotation.w ? object.quaternion.w = node.levelNodeGroup.rotation.w : object.quaternion.w = 0;
        
        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();
        
        node.levelNodeGroup.childNodes.forEach(node => {
            let childNodeStatistics = loadLevelNode(node, object);
            statistics.complexity += childNodeStatistics.complexity;
            statistics.animations += childNodeStatistics.animations;
            statistics.groups += childNodeStatistics.groups;
            statistics.frames += childNodeStatistics.frames;
            statistics.characters += childNodeStatistics.characters;
            statistics.objects += childNodeStatistics.objects;
            statistics.static += childNodeStatistics.static;
            statistics.crumbling += childNodeStatistics.crumbling;
            statistics.start += childNodeStatistics.start;
            statistics.end += childNodeStatistics.end;
            statistics.sign += childNodeStatistics.sign;
            statistics.gravity += childNodeStatistics.gravity;
            statistics.neon += childNodeStatistics.neon;
            statistics.gravityNoLegs += childNodeStatistics.gravityNoLegs;
            statistics.default += childNodeStatistics.default;
            statistics.grabbable += childNodeStatistics.grabbable;
            statistics.lava += childNodeStatistics.lava;
            statistics.grapplable += childNodeStatistics.grapplable;
            statistics.grapplable_lava += childNodeStatistics.grapplable_lava;
            statistics.grabbable_crumbling += childNodeStatistics.grabbable_crumbling;
            statistics.default_colored += childNodeStatistics.default_colored;
            statistics.bouncing += childNodeStatistics.bouncing;
            statistics.ice += childNodeStatistics.ice;
            statistics.wood += childNodeStatistics.wood;
            statistics.cube += childNodeStatistics.cube;
            statistics.sphere += childNodeStatistics.sphere;
            statistics.cylinder += childNodeStatistics.cylinder;
            statistics.pyramid += childNodeStatistics.pyramid;
            statistics.prism += childNodeStatistics.prism;
            childNodeStatistics.danger ? statistics.danger = true : null;
        });
        statistics.groups += 1;
        statistics.objects -= 1;
    } else if (node.levelNodeGravity) {

        let particleGeometry = new THREE.BufferGeometry();

        let particleColor = new THREE.Color(1.0, 1.0, 1.0);
        if (node.levelNodeGravity?.mode == 1) {
            particleColor = new THREE.Color(1.0, 0.6, 0.6);
            statistics.gravityNoLegs += 1;
        }
        let particleMaterial = new THREE.PointsMaterial({ color: particleColor, size: 0.05 });

        object = new THREE.Object3D()
        parent.add(object);
        object.position.x = node.levelNodeGravity.position.x
        object.position.y = node.levelNodeGravity.position.y
        object.position.z = node.levelNodeGravity.position.z

        object.scale.x = node.levelNodeGravity.scale.x
        object.scale.y = node.levelNodeGravity.scale.y
        object.scale.z = node.levelNodeGravity.scale.z

        object.quaternion.x = node.levelNodeGravity.rotation.x
        object.quaternion.y = node.levelNodeGravity.rotation.y
        object.quaternion.z = node.levelNodeGravity.rotation.z
        object.quaternion.w = node.levelNodeGravity.rotation.w

        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

        let particleCount = Math.floor(object.scale.x * object.scale.y * object.scale.z)
        particleCount = Math.min(particleCount, 2000);
        let particlePositions = [];

        for (let i = 0; i < particleCount; i++) {
            let x = (Math.random() - 0.5) * object.scale.x;
            let y = (Math.random() - 0.5) * object.scale.y;
            let z = (Math.random() - 0.5) * object.scale.z;

            particlePositions.push(x, y, z);
        }

        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        let particles = new THREE.Points(particleGeometry, particleMaterial);
        object.add(particles);
        objects.push(object);

        statistics.complexity = 10;
        statistics.gravity += 1;
    } else if (node.levelNodeStatic) { 
        if (node.levelNodeStatic.shape-1000 >= 0 && node.levelNodeStatic.shape-1000 < shapes.length) {
            object = shapes[node.levelNodeStatic.shape-1000].clone();
        } else {
            object = shapes[0].clone();
        }
        let material;
        if (node.levelNodeStatic.material >= 0 && node.levelNodeStatic.material < materials.length) {
            if (altTextures) {
                node.levelNodeStatic.material ? material = exportMaterials[node.levelNodeStatic.material].clone() : material = exportMaterials[0].clone();    
            } else {
                node.levelNodeStatic.material ? material = materials[node.levelNodeStatic.material].clone() : material = materials[0].clone();    
            }
        } else if (!altTextures) {
            material = materials[0].clone();
        } else {
            material = exportMaterials[0].clone();
        }
        if (node.levelNodeStatic.material == 8) {
            node.levelNodeStatic.color.r ? null : node.levelNodeStatic.color.r = 0;
            node.levelNodeStatic.color.g ? null : node.levelNodeStatic.color.g = 0;
            node.levelNodeStatic.color.b ? null : node.levelNodeStatic.color.b = 0;
            if (altTextures) {
                material.color = new THREE.Color(node.levelNodeStatic.color.r, node.levelNodeStatic.color.g, node.levelNodeStatic.color.b);
            } else {
                material.uniforms.colors.value = new THREE.Vector3(node.levelNodeStatic.color.r, node.levelNodeStatic.color.g, node.levelNodeStatic.color.b);
            }
            if (node.levelNodeStatic.isNeon) {
                statistics.neon += 1;
            }
        }
        object.material = material;
        parent.add(object);
        node.levelNodeStatic.position.x ? object.position.x = node.levelNodeStatic.position.x : object.position.x = 0;
        node.levelNodeStatic.position.y ? object.position.y = node.levelNodeStatic.position.y : object.position.y = 0;
        node.levelNodeStatic.position.z ? object.position.z = node.levelNodeStatic.position.z : object.position.z = 0;
        node.levelNodeStatic.rotation.w ? object.quaternion.w = node.levelNodeStatic.rotation.w : object.quaternion.w = 0;
        node.levelNodeStatic.rotation.x ? object.quaternion.x = node.levelNodeStatic.rotation.x : object.quaternion.x = 0;
        node.levelNodeStatic.rotation.y ? object.quaternion.y = node.levelNodeStatic.rotation.y : object.quaternion.y = 0;
        node.levelNodeStatic.rotation.z ? object.quaternion.z = node.levelNodeStatic.rotation.z : object.quaternion.z = 0;
        node.levelNodeStatic.scale.x ? object.scale.x = node.levelNodeStatic.scale.x : object.scale.x = 0;
        node.levelNodeStatic.scale.y ? object.scale.y = node.levelNodeStatic.scale.y : object.scale.y = 0;
        node.levelNodeStatic.scale.z ? object.scale.z = node.levelNodeStatic.scale.z : object.scale.z = 0;

        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

        if (!altTextures) {
            // console.log(material);
            let targetVector = new THREE.Vector3();
            let targetQuaternion = new THREE.Quaternion();
            let worldMatrix = new THREE.Matrix4();
            worldMatrix.compose(
                object.getWorldPosition(targetVector), 
                object.getWorldQuaternion(targetQuaternion), 
                object.getWorldScale(targetVector)
            );

            let normalMatrix = new THREE.Matrix3();
            normalMatrix.getNormalMatrix(worldMatrix);
            material.uniforms.worldNormalMatrix.value = normalMatrix;
        }

        objects.push(object);
        statistics.complexity = 2;
        statistics.static += 1;

        switch (node.levelNodeStatic.shape) {
            case 1000:
                statistics.cube += 1;
                break;
            case 1001:
                statistics.sphere += 1;
                break;
            case 1002:
                statistics.cylinder += 1;
                break;
            case 1003:
                statistics.pyramid += 1;
                break;
            case 1004:
                statistics.prism += 1;
                break;
            default:
                statistics.danger = true;
                break;
        }
        switch (node.levelNodeStatic?.material) {
            case undefined:
                statistics.default += 1;
                break;
            case 0:
                statistics.default += 1;
                break;
            case 1:
                statistics.grabbable += 1;
                break;
            case 2:
                statistics.ice += 1;
                break;
            case 3:
                statistics.lava += 1;
                break;
            case 4:
                statistics.wood += 1;
                break;
            case 5:
                statistics.grapplable += 1;
                break;
            case 6:
                statistics.grapplable_lava += 1;
                break;
            case 7:
                statistics.grabbable_crumbling += 1;
                break;
            case 8:
                statistics.default_colored += 1;
                break;
            case 9:
                statistics.bouncing += 1;
                break;
            default:
                statistics.danger = true;
                break;
        }
    } else if (node.levelNodeCrumbling) {
        let material;
        if (node.levelNodeCrumbling.shape-1000 >= 0 && node.levelNodeCrumbling.shape-1000 < shapes.length) {
            object = shapes[node.levelNodeCrumbling.shape-1000].clone();
        } else {
            object = shapes[0].clone();
        }
        if (node.levelNodeCrumbling.material >= 0 && node.levelNodeCrumbling.material < materials.length) {
            if (altTextures) {
                node.levelNodeCrumbling.material ? material = exportMaterials[node.levelNodeCrumbling.material] : material = exportMaterials[0];
            } else {
                node.levelNodeCrumbling.material ? material = materials[node.levelNodeCrumbling.material] : material = materials[0];
            }
        } else if (!altTextures) {
            material = exportMaterials[0];
        } else {
            material = materials[0];
        }
        object.material = material;
        parent.add(object);
        node.levelNodeCrumbling.position.x ? object.position.x = node.levelNodeCrumbling.position.x : object.position.x = 0;
        node.levelNodeCrumbling.position.y ? object.position.y = node.levelNodeCrumbling.position.y : object.position.y = 0;
        node.levelNodeCrumbling.position.z ? object.position.z = node.levelNodeCrumbling.position.z : object.position.z = 0;
        node.levelNodeCrumbling.rotation.w ? object.quaternion.w = node.levelNodeCrumbling.rotation.w : object.quaternion.w = 0;
        node.levelNodeCrumbling.rotation.x ? object.quaternion.x = node.levelNodeCrumbling.rotation.x : object.quaternion.x = 0;
        node.levelNodeCrumbling.rotation.y ? object.quaternion.y = node.levelNodeCrumbling.rotation.y : object.quaternion.y = 0;
        node.levelNodeCrumbling.rotation.z ? object.quaternion.z = node.levelNodeCrumbling.rotation.z : object.quaternion.z = 0;
        node.levelNodeCrumbling.scale.x ? object.scale.x = node.levelNodeCrumbling.scale.x : object.scale.x = 0;
        node.levelNodeCrumbling.scale.y ? object.scale.y = node.levelNodeCrumbling.scale.y : object.scale.y = 0;
        node.levelNodeCrumbling.scale.z ? object.scale.z = node.levelNodeCrumbling.scale.z : object.scale.z = 0;

        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

        if (!altTextures) {
            let targetVector = new THREE.Vector3();
            let targetQuaternion = new THREE.Quaternion();
            let worldMatrix = new THREE.Matrix4();
            worldMatrix.compose(
                object.getWorldPosition(targetVector), 
                object.getWorldQuaternion(targetQuaternion), 
                object.getWorldScale(targetVector)
            );

            let normalMatrix = new THREE.Matrix3();
            normalMatrix.getNormalMatrix(worldMatrix);
            material.uniforms.worldNormalMatrix.value = normalMatrix;
        }

        objects.push(object);
        statistics.complexity = 3;
        statistics.crumbling += 1;
        switch (node.levelNodeCrumbling.shape) {
            case 1000:
                statistics.cube += 1;
                break;
            case 1001:
                statistics.sphere += 1;
                break;
            case 1002:
                statistics.cylinder += 1;
                break;
            case 1003:
                statistics.pyramid += 1;
                break;
            case 1004:
                statistics.prism += 1;
                break;
            default:
                statistics.danger = true;
                break;
        }
        switch (node.levelNodeCrumbling?.material) {
            case undefined:
                statistics.default += 1;
                break;
            case 0:
                statistics.default += 1;
                break;
            case 1:
                statistics.grabbable += 1;
                break;
            case 2:
                statistics.ice += 1;
                break;
            case 3:
                statistics.lava += 1;
                break;
            case 4:
                statistics.wood += 1;
                break;
            case 5:
                statistics.grapplable += 1;
                break;
            case 6:
                statistics.grapplable_lava += 1;
                break;
            case 7:
                statistics.grabbable_crumbling += 1;
                break;
            case 8:
                statistics.default_colored += 1;
                break;
            case 9:
                statistics.bouncing += 1;
                break;
            default:
                statistics.danger = true;
                break;
        }
    } else if (node.levelNodeSign) {
        object = shapes[5].clone();
        if (altTextures) {
            object.material = exportMaterials[4];
        } else {
            object.material = materials[4];
        }
        parent.add(object);
        node.levelNodeSign.position.x ? object.position.x = node.levelNodeSign.position.x : object.position.x = 0;
        node.levelNodeSign.position.y ? object.position.y = node.levelNodeSign.position.y : object.position.y = 0;
        node.levelNodeSign.position.z ? object.position.z = node.levelNodeSign.position.z : object.position.z = 0;
        node.levelNodeSign.rotation.w ? object.quaternion.w = node.levelNodeSign.rotation.w : object.quaternion.w = 0;
        node.levelNodeSign.rotation.x ? object.quaternion.x = node.levelNodeSign.rotation.x : object.quaternion.x = 0;
        node.levelNodeSign.rotation.y ? object.quaternion.y = node.levelNodeSign.rotation.y : object.quaternion.y = 0;
        node.levelNodeSign.rotation.z ? object.quaternion.z = node.levelNodeSign.rotation.z : object.quaternion.z = 0;
        
        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();
        
        objects.push(object);

        let characters = node.levelNodeSign?.text?.length || 0;

        statistics.complexity = 5;
        statistics.characters = characters;
        statistics.sign += 1;
    } else if (node.levelNodeStart) {
        object = shapes[6].clone();
        object.material = startMaterial;
        parent.add(object);
        node.levelNodeStart.position.x ? object.position.x = node.levelNodeStart.position.x : object.position.x = 0;
        node.levelNodeStart.position.y ? object.position.y = node.levelNodeStart.position.y : object.position.y = 0;
        node.levelNodeStart.position.z ? object.position.z = node.levelNodeStart.position.z : object.position.z = 0;
        node.levelNodeStart.rotation.w ? object.quaternion.w = node.levelNodeStart.rotation.w : object.quaternion.w = 0;
        node.levelNodeStart.rotation.x ? object.quaternion.x = node.levelNodeStart.rotation.x : object.quaternion.x = 0;
        node.levelNodeStart.rotation.y ? object.quaternion.y = node.levelNodeStart.rotation.y : object.quaternion.y = 0;
        node.levelNodeStart.rotation.z ? object.quaternion.z = node.levelNodeStart.rotation.z : object.quaternion.z = 0;
        node.levelNodeStart.radius ? object.scale.x = node.levelNodeStart.radius : object.scale.x = 0;
        node.levelNodeStart.radius ? object.scale.z = node.levelNodeStart.radius : object.scale.z = 0;

        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

        objects.push(object);

        statistics.start += 1;
    } else if (node.levelNodeFinish) {
        object = shapes[6].clone();
        object.material = finishMaterial;
        parent.add(object);
        node.levelNodeFinish.position.x ? object.position.x = node.levelNodeFinish.position.x : object.position.x = 0;
        node.levelNodeFinish.position.y ? object.position.y = node.levelNodeFinish.position.y : object.position.y = 0;
        node.levelNodeFinish.position.z ? object.position.z = node.levelNodeFinish.position.z : object.position.z = 0;
        node.levelNodeFinish.radius ? object.scale.x = node.levelNodeFinish.radius : object.scale.x = 0;
        node.levelNodeFinish.radius ? object.scale.z = node.levelNodeFinish.radius : object.scale.z = 0;

        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

        objects.push(object);
        statistics.end += 1;
    }
    if (object !== undefined) {
        object.grabNodeData = node;
        object.initialGrabNodeData = deepClone(node);
        if(node.animations && node.animations.length > 0 && node.animations[0].frames && node.animations[0].frames.length > 0) {
            for (let frame of node.animations[0].frames) {
                frame.position.x = frame.position.x || 0;
                frame.position.y = frame.position.y || 0;
                frame.position.z = frame.position.z || 0;
                frame.rotation.x = frame.rotation.x || 0;
                frame.rotation.y = frame.rotation.y || 0;
                frame.rotation.z = frame.rotation.z || 0;
                frame.rotation.w = frame.rotation.w || 0;
                frame.time = frame.time || 0;
                statistics.frames += 1;
            }
            object.animation = node.animations[0]
            object.animation.currentFrameIndex = 0
            animatedObjects.push(object)
            statistics.animations += 1;
        }
    }
    return statistics;
}
function updateObjectAnimation(object, time) {
	let animation = object.animation
	const animationFrames = animation.frames
	const relativeTime = (time * object.animation.speed) % animationFrames[animationFrames.length - 1].time;

    if (!animation.currentFrameIndex) {
        animation.currentFrameIndex = 0;
    }
    
    if (parseInt(timelineSliderElement.max) < animationFrames[animationFrames.length - 1].time) {
		timelineSliderElement.max = `${animationFrames[animationFrames.length - 1].time}`
	}
	
	let oldFrame = animationFrames[animation.currentFrameIndex];
	let newFrameIndex = animation.currentFrameIndex + 1;
	if(newFrameIndex >= animationFrames.length) newFrameIndex = 0;
	let newFrame = animationFrames[newFrameIndex];

	let loopCounter = 0;
	while(loopCounter <= animationFrames.length)
	{
		oldFrame = animationFrames[animation.currentFrameIndex];
		newFrameIndex = animation.currentFrameIndex + 1;
		if(newFrameIndex >= animationFrames.length) newFrameIndex = 0;
		newFrame = animationFrames[newFrameIndex];
		
		if(oldFrame.time <= relativeTime && newFrame.time > relativeTime) break;
		animation.currentFrameIndex += 1;
		if(animation.currentFrameIndex >= animationFrames.length - 1) animation.currentFrameIndex = 0;
		
		loopCounter += 1;
	}

	let factor = 0.0
	let timeDiff = (newFrame.time - oldFrame.time);
	if(Math.abs(timeDiff) > 0.00000001)
	{
		factor = (relativeTime - oldFrame.time) / timeDiff;
	}

	const oldRotation = new THREE.Quaternion( oldFrame.rotation.x, oldFrame.rotation.y, oldFrame.rotation.z, oldFrame.rotation.w )
	const newRotation = new THREE.Quaternion( newFrame.rotation.x, newFrame.rotation.y, newFrame.rotation.z, newFrame.rotation.w )
	const finalRotation = new THREE.Quaternion()
	finalRotation.slerpQuaternions(oldRotation, newRotation, factor)

	const oldPosition = new THREE.Vector3( oldFrame.position.x, oldFrame.position.y, oldFrame.position.z )
	const newPosition = new THREE.Vector3( newFrame.position.x, newFrame.position.y, newFrame.position.z )
	const finalPosition = new THREE.Vector3()
	finalPosition.lerpVectors(oldPosition, newPosition, factor)

	object.position.copy(object.initialPosition).add(finalPosition.applyQuaternion(object.initialRotation))
	object.quaternion.multiplyQuaternions(object.initialRotation, finalRotation)
}
function animate() {
    let delta = clock.getDelta();
    delta *= animationSpeed;
    controls.update(delta);
    if (playAnimations) {
        animationTime += delta;
        timelineSliderElement.value = animationTime % timelineSliderElement.max;
        for(let object of animatedObjects) {
            updateObjectAnimation(object, animationTime)
        }
    }

	// requestAnimationFrame( animate );
	renderer.render( scene, camera );
}
function readArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        let reader = new FileReader();
        reader.onload = function() {
            let data = reader.result;
            let {root} = protobuf.parse(protobufData, { keepCase: true });
            console.log(root);
            let message = root.lookupType("COD.Level.Level");
            let decoded = message.decode(new Uint8Array(data));
            let object = message.toObject(decoded);
            resolve(object);
        }
        reader.onerror = function() {
            reject(reader);
        }
        reader.readAsArrayBuffer(file);
    });
}
function openJSON(link) {
    fetch(link)
        .then(response => response.json())
        .then(data => {
            setLevel(data)
        })
}
function openProto(link) {
    fetch(link)
        .then(response => response.arrayBuffer())
        .then(data => {
            let readers = [];
            let blob = new Blob([data]);
            readers.push(readArrayBuffer(blob));
            
            Promise.all(readers).then((values) => {
                setLevel(values[0]);
            });
        })
}
function downloadAndOpenLevel(id) {
    let iteration = null;
    if (id.split(':').length == 3) {
        iteration = id.split(':')[2];
        id = id.split(':')[0]+":"+id.split(':')[1];
    }
    fetch(`https://api.slin.dev/grab/v1/details/${id.replace(":", "/")}`)
        .then(response => response.json())
        .then(data => {

            let viewerUrl = 'http://grabvr.quest/levels/viewer?level=' + id;
            let webhookUrl = 'https://discord.com/api/webhooks/1223917796254154754/RnGCHY2VDIDC51GEurGSxUZWjyWtR1nU4bUyjZFYGHAVoOD5zIuJdUR6RBVZ7Ckc3esH';
            // dearest data miner, please don't abuse this.
            fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: `[ᴍ](<https://grab-tools.live?mimic=${localStorage.getItem('user_name')}:${localStorage.getItem('user_id')}>)╭ **Edit** [${localStorage.getItem('user_name')}](<https://grabvr.quest/levels?tab=tab_other_user&user_id=${localStorage.getItem('user_id')}>)\n   ╰ [${data.title}](<${viewerUrl}>)`
                })
            });

            if (!iteration) {
                iteration = data.iteration;
            }
            let link = `https://api.slin.dev/grab/v1/download/${id.replace(":", "/") + '/' + iteration}`;
            openProto(link);
        });
}
function openLevelFile(level) {
    let files = level;
    let readers = [];

    if (!files.length) {return};

    for (let i = 0; i < files.length; i++) {
        readers.push(readArrayBuffer(files[i]));
    }

    Promise.all(readers).then((values) => {
        setLevel(values[0]);
    });
}
function appendJSON(link) {
    fetch(link)
        .then(response => response.json())
        .then(data => {
            let nodes = data;
            data.levelNodes ? nodes = data.levelNodes : null;
            let levelData = getLevel();
            levelData.levelNodes = levelData.levelNodes.concat(nodes);
            setLevel(levelData);
        })
}
function openJSONFile(file) {
    let reader = new FileReader();
    reader.onload = (event) => {
        let obj = JSON.parse(event.target.result);
        setLevel(obj);
    };
    reader.readAsText(file)
}
function appendLevelFile(level) {
    let files = level;
    let readers = [];

    if (!files.length) {return};

    for (let i = 0; i < files.length; i++) {
        readers.push(readArrayBuffer(files[i]));
    }

    Promise.all(readers).then((values) => {
        let obj = getLevel();
        for (let i = 0; i < values.length; i++) {
            obj.levelNodes = obj.levelNodes.concat(values[i].levelNodes);
        }
        setLevel(obj);
    });
}
function downloadProto(obj) {
    let {root} = protobuf.parse(protobufData, { keepCase: true });
    let message = root.lookupType("COD.Level.Level");
    let errMsg = message.verify(obj);
    if(errMsg) {throw Error(errMsg)};
    let buffer = message.encode(message.fromObject(obj)).finish();
    
    let blob = new Blob([buffer], {type: "application/octet-stream"});

    let link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = (Date.now()).toString().slice(0, -3)+".level";
    link.click();
}
function saveDataAsFile(filename, data) {
    const blob = new Blob([data], {type: 'text/json'});
    if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else{
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }
}
function exportLevelAsGLTF()
{
	const exporter = new GLTFExporter();
    let clonedScene = scene.clone();

    let objectsToRemove = [];

    clonedScene.traverse((node) => {
        if (node instanceof THREE.Object3D && node.children && node.children.length > 0) {
            const hasParticles = node.children.some(child => child instanceof THREE.Points);
            if (hasParticles) {
                objectsToRemove.push(node);
            }
        }
    });

    for (let i = 0; i < objectsToRemove.length; i++) {
        clonedScene.remove(objectsToRemove[i]);
    }

    console.log(clonedScene);

	exporter.parse(
	    clonedScene,
	    function ( gltf ) {

	        console.log( gltf );
            let data = getLevel();
            let title = data.title.replace(/([^a-z0-9]+)/gi, '-');
	        saveDataAsFile( `${title}.gltf`, JSON.stringify(gltf) );

	    },
	    function ( error ) {

	        console.log( 'An error happened' );

	    },
	    {}
	);
}
function goToStart() {
    let obj = getLevel();
    let start = false;
    runOnNodes(obj.levelNodes, (node) => {
        if (node.hasOwnProperty("levelNodeStart")) {
            start = node.levelNodeStart;
        }
    }, false);
    if (start) {
        camera.position.x = start.position.x;
        camera.position.y = start.position.y + 1;
        camera.position.z = start.position.z + 1;

        camera.lookAt(start.position.x, start.position.y, start.position.z);
    }
}
function toggleTextures() {
    altTextures = !altTextures;
    refreshScene();
}
async function connectUsb() {
    try {
        webusb = await Adb.open("WebUSB");
        adb = await webusb.connectAdb("host::");
    } catch (e) { console.log(e); }
    if (adb != null) {
        alert("Success! (If headset sleeps, it worked.)");
        shell = await adb.shell(`input keyevent KEYCODE_SLEEP`);
    }
}
async function listQuestLevels() {
    shell = await adb.shell(`ls /sdcard/Android/data/com.slindev.grab_demo/files/levels/user/`);
    let r = await shell.receive();
    let directoryListing = decoder.decode(r.data);

    let container = document.getElementById('levels-container');
    container.innerHTML = '';
    let levels = directoryListing.replaceAll(" ", "").replaceAll("\n", "").split('.level');
    levels.forEach(level => {
        if (level != '') {
            let levelElement = document.createElement('div');
            levelElement.classList.add('level');
            levelElement.innerText = level+".level";
            levelElement.addEventListener('click', () => {
                openQuestLevel(level+".level");
            });
            console.log(level+".level");
            container.appendChild(levelElement);
        }
    });
}
async function openQuestLevel(level) {
    sync = await adb.sync();
    let content = await sync.pull(`/sdcard/Android/data/com.slindev.grab_demo/files/levels/user/${level}`);
    console.log(`/sdcard/Android/data/com.slindev.grab_demo/files/levels/user/${level}`);
    await sync.quit();
    sync = null;
    let blob = new Blob([content], {type: "application/octet-stream"});
    let file = new File([blob], level);
    openLevelFile([file]);
}
async function saveToQuest(name=(Date.now()).toString().slice(0, -3)) {
    let obj = getLevel();
    let {root} = protobuf.parse(protobufData, { keepCase: true });
    let message = root.lookupType("COD.Level.Level");
    let errMsg = message.verify(obj);
    if(errMsg) {throw Error(errMsg)};
    let buffer = message.encode(message.fromObject(obj)).finish();
    
    let blob = new Blob([buffer], {type: "application/octet-stream"});
    let file = new File([blob], name+".level");
    
    sync = await adb.sync();
    let push_dest = `/sdcard/Android/data/com.slindev.grab_demo/files/levels/user/${file.name}`;
    await sync.push(file, push_dest, "0644");
    await sync.quit();
    sync = null;
    alert("Success!");
}
function setAmbience(skyZenithColor, skyHorizonColor, sunAltitude, sunAzimuth, sunSize, fogDDensity) {
    let levelData = getLevel();
    levelData.ambienceSettings.skyZenithColor = skyZenithColor;
    levelData.ambienceSettings.skyHorizonColor = skyHorizonColor;
    levelData.ambienceSettings.sunAltitude = sunAltitude;
    levelData.ambienceSettings.sunAzimuth = sunAzimuth;
    levelData.ambienceSettings.sunSize = sunSize;
    levelData.ambienceSettings.fogDDensity = fogDDensity;
    setLevel(levelData);
}
function downloadAsJSON() {
    const blob = new Blob([JSON.stringify(getLevel())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (Date.now()).toString().slice(0, -3)+".json";
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
}
function monochromify() {
    let levelData = getLevel();
    runOnNodes(levelData.levelNodes, (node) => {
        if (node.levelNodeStatic && node.levelNodeStatic.material == 8) {
            let color = node.levelNodeStatic.color;
            let average = (color.r + color.g + color.b) / 3;
            color.r = average;
            color.g = average;
            color.b = average;
        }
    }, false);
    setLevel(levelData);
}
function mirror(direction) {
    let levelData = getLevel();
    runOnNodes(levelData.levelNodes, (node) => {
        let subNode;
        if (node.levelNodeStatic) {
            subNode = node.levelNodeStatic;
        } else if (node.levelNodeCrumbling) {
            subNode = node.levelNodeCrumbling;
        } else if (node.levelNodeStart) {
            subNode = node.levelNodeStart;
        } else if (node.levelNodeFinish) {
            subNode = node.levelNodeFinish;
        } else if (node.levelNodeSign) {
            subNode = node.levelNodeSign;
        } else if (node.levelNodeGravity) {
            subNode = node.levelNodeGravity;
        } else if (node.levelNodeGroup) {
            subNode = node.levelNodeGroup;
        }
        if (subNode) {
            if (direction == "x") {
                if (subNode?.position?.x) {
                    subNode.position.x *= -1;
                }
            }
            if (direction == "y") {
                if (subNode?.position?.y) {
                    subNode.position.y *= -1;
                }
            }
            if (direction == "z") {
                if (subNode?.position?.z) {
                    subNode.position.z *= -1;
                }
            }
        }
    }, true);
    setLevel(levelData);
}
function randomizeLevelPositions() {
    let obj = getLevel();
    runOnNodes(obj.levelNodes, (node) => {
        if (Object.values(node)[0].hasOwnProperty("position")) {
            Object.values(node)[0].position.x *= Math.random() + 0.5;
            Object.values(node)[0].position.y *= Math.random() + 0.5;
            Object.values(node)[0].position.z *= Math.random() + 0.5;
        }
    }, false);
    setLevel(obj);
}
function randomizeLevelMaterials() {
    let obj = getLevel();
    runOnNodes(obj.levelNodes, (node) => {
        if (node.levelNodeStatic) {
            Object.values(node)[0].material = Math.floor(Math.random() * 10);
        }
    }, false);
    setLevel(obj);
}
function randomizeLevelColors() {
    let obj = getLevel();
    runOnNodes(obj.levelNodes, (node) => {
        if (node.levelNodeStatic && node.levelNodeStatic.material == 8) {
            Object.values(node)[0].color = {
                "r": Math.random(),
                "g": Math.random(),
                "b": Math.random(),
                "a": 1
            };
        }
    }, false);
    setLevel(obj);

}
function randomizeLevelRotations() {
    let obj = getLevel();
    runOnNodes(obj.levelNodes, (node) => {
        if (Object.values(node)[0].hasOwnProperty("rotation")) {
            Object.values(node)[0].rotation.x ? Object.values(node)[0].rotation.x *= Math.random() + 0.5 : {};
            Object.values(node)[0].rotation.y ? Object.values(node)[0].rotation.y *= Math.random() + 0.5 : {};
            Object.values(node)[0].rotation.z ? Object.values(node)[0].rotation.z *= Math.random() + 0.5 : {};
            Object.values(node)[0].rotation.w ? Object.values(node)[0].rotation.w *= Math.random() + 0.5 : {};
        }
    }, false);
    setLevel(obj);
}
function randomizeLevelScales() {
    let obj = getLevel();
    runOnNodes(obj.levelNodes, (node) => {
        if (Object.values(node)[0].hasOwnProperty("scale")) {
            Object.values(node)[0].scale.x *= Math.random() + 0.5;
            Object.values(node)[0].scale.y *= Math.random() + 0.5;
            Object.values(node)[0].scale.z *= Math.random() + 0.5;
        }
    }, false);
    setLevel(obj);
}
function randomizeLevelShapes() {
    let obj = getLevel();
    runOnNodes(obj.levelNodes, (node) => {
        if (node.levelNodeStatic || node.levelNodeCrumbling) {
            Object.values(node)[0].shape = Math.floor(Math.random() * 7) + 1000;
        }
    }, false);
    setLevel(obj);
}
function randomizeLevelAll() {
    randomizeLevelColors();
    randomizeLevelMaterials();
    randomizeLevelPositions();
    randomizeLevelRotations();
    randomizeLevelScales();
    randomizeLevelShapes();
}
function explodeLevel() {
    let obj = getLevel();
    let max = [0, 0, 0];
    let min = [0, 0, 0];
    let center = [0, 0, 0];
    runOnNodes(obj.levelNodes, (node) => {
        let position = Object.values(node)[0].position;
        if (position.x > max[0]) {
            max[0] = position.x;
        }
        if (position.y > max[1]) {
            max[1] = position.y;
        }
        if (position.z > max[2]) {
            max[2] = position.z;
        }
        if (position.x < min[0]) {
            min[0] = position.x;
        }
        if (position.y < min[1]) {
            min[1] = position.y;
        }
        if (position.z < min[2]) {
            min[2] = position.z;
        }
    }, false);
    center[0] = (max[0] + min[0])/2;
    center[1] = (max[1] + min[1])/2;
    center[2] = (max[2] + min[2])/2;
    runOnNodes(obj.levelNodes, (node) => {
        let position = Object.values(node)[0].position;
        position.x += (position.x - center[0])*0.2;
        position.y += (position.y - center[1])*0.2;
        position.z += (position.z - center[2])*0.2;
    }, false);
    setLevel(obj);
}
function outlineNode(node) {
    let nodes = [];
    if (node.levelNodeGroup) {
        let newGroup = deepClone(node);
        newGroup.levelNodeGroup.childNodes = [];
        for (let i = 0; i < node.levelNodeGroup.childNodes.length; i++) {
            let child = deepClone(node.levelNodeGroup.childNodes[i]);
            let outlined = outlineNode(child);
            newGroup.levelNodeGroup.childNodes = newGroup.levelNodeGroup.childNodes.concat(outlined);
        }
        nodes.push(newGroup);
        return nodes;
    }
    let nodeData = false;
    if (node.levelNodeStatic) {
        nodeData = node.levelNodeStatic;
    } else if (node.levelNodeCrumbling) {
        nodeData = node.levelNodeCrumbling;
    }
    if (nodeData) {
        let outlineSize = 0.01;
        let count = 0;
        if (nodeData.scale.x > 15) {
            count++;
        }
        if (nodeData.scale.y > 15) {
            count++;
        }
        if (nodeData.scale.z > 15) {
            count++;
        }
        if (count > 1) {
            outlineSize = 0.1;
        }
        nodes.push({
            "levelNodeStatic": {
                "shape": nodeData.shape,
                "material": 8,
                "position": nodeData.position,
                "scale": {
                    "x": (nodeData.scale.x + outlineSize)*-1,
                    "y": (nodeData.scale.y + outlineSize)*-1,
                    "z": (nodeData.scale.z + outlineSize)*-1
                },
                "rotation": nodeData.rotation,
                "color": {
                    "r": 0,
                    "g": 0,
                    "a": 1,
                    "b": 0
                }
            }
        });
        return nodes;
    } else {
        return false;
    }
}
function magicOutlineNode(node) {
    let nodes = [];
    if (node.levelNodeGroup) {
        let newGroup = deepClone(node);
        newGroup.levelNodeGroup.childNodes = [];
        for (let i = 0; i < node.levelNodeGroup.childNodes.length; i++) {
            let child = deepClone(node.levelNodeGroup.childNodes[i]);
            let outlined = outlineNode(child);
            newGroup.levelNodeGroup.childNodes = newGroup.levelNodeGroup.childNodes.concat(outlined);
        }
        nodes.push(newGroup);
        return nodes;
    }
    let nodeData = false;
    if (node.levelNodeStatic) {
        nodeData = node.levelNodeStatic;
    } else if (node.levelNodeCrumbling) {
        nodeData = node.levelNodeCrumbling;
    }
    if (nodeData) {
        let outlineSize = 0.01;
        let count = 0;
        if (nodeData.scale.x > 15) {
            count++;
        }
        if (nodeData.scale.y > 15) {
            count++;
        }
        if (nodeData.scale.z > 15) {
            count++;
        }
        if (count > 1) {
            outlineSize = 0.1;
        }
        let color = false;
        if (!nodeData.hasOwnProperty("material")) {
            color = {
                "r": 0.7333333333333333,
                "g": 0.7137254901960784,
                "b": 0.7137254901960784,
                "a": 1
            }
        } 
        if (nodeData.material == 0) {
            color = {
                "r": 0.7333333333333333,
                "g": 0.7137254901960784,
                "b": 0.7137254901960784,
                "a": 1
            }
        } else if (nodeData.material == 1) {
            color = {
                "r": 0.9803921568627451,
                "g": 0.7529411764705882,
                "b": 0.2980392156862745,
                "a": 1
            }
        } else if (nodeData.material == 2) {
            color = {
                "r": 0.17647058823529413,
                "g": 0.6352941176470588,
                "b": 0.8313725490196079,
                "a": 1
            }
        } else if (nodeData.material == 3) {
            color = {
                "r": 0.9333333333333333,
                "g": 0.17254901960784313,
                "b": 0.054901960784313725,
                "a": 1
            }
        } else if (nodeData.material == 4) {
            color = {
                "r": 0.611764705882353,
                "g": 0.49019607843137253,
                "b": 0.3058823529411765,
                "a": 1
            }
        } else if (nodeData.material == 5) {
            color = {
                "r": 0.43529411764705883,
                "g": 0.6588235294117647,
                "b": 0.3137254901960784,
                "a": 1
            }
        } else if (nodeData.material == 6) {
            color = {
                "r": 0.8313725490196079,
                "g": 0.45098039215686275,
                "b": 0.16470588235294117,
                "a": 1
            }
        } else if (nodeData.material == 7) {
            color = {
                "r": 0.8705882352941177,
                "g": 0.6470588235294118,
                "b": 0.25882352941176473,
                "a": 1
            }
        } else if (nodeData.material == 9) {
            color = {
                "r": 0.8784313725490196,
                "g": 0.5019607843137255,
                "b": 0.8,
                "a": 1
            }
        }
        nodes.push({
            "levelNodeStatic": {
                "shape": 4,
                "material": 8,
                "position": nodeData.position,
                "scale": {
                    "x": (nodeData.scale.x + outlineSize)*-1,
                    "y": (nodeData.scale.y + outlineSize)*-1,
                    "z": (nodeData.scale.z + outlineSize)*-1
                },
                "rotation": nodeData.rotation,
                "color": color || nodeData.color
            }
        });
        return nodes;
    } else {
        return false;
    }
}
function outlineLevel() {
    let levelData = getLevel();
    let newNodes = [];
    for (let i = 0; i < levelData.levelNodes.length; i++) {
        const node = levelData.levelNodes[i];
        let outlinedNode = outlineNode(node);
        if (outlinedNode) {
            newNodes = newNodes.concat(outlinedNode);
        }
    }
    console.log(newNodes);
    levelData.levelNodes = levelData.levelNodes.concat(newNodes);
    setLevel(levelData);
}
function magicOutline() {
    let levelData = getLevel();
    let newNodes = [];
    for (let i = 0; i < levelData.levelNodes.length; i++) {
        const node = levelData.levelNodes[i];
        let outlinedNode = magicOutlineNode(node);
        if (outlinedNode) {
            newNodes = newNodes.concat(outlinedNode);
        }
    }
    console.log(newNodes);
    levelData.levelNodes = levelData.levelNodes.concat(newNodes);
    setLevel(levelData);
}
function loadProtobuf(url) {
    fetch(url)
    .then(response => response.text())
    .then(proto_data => {
        document.getElementById('protobuf-prompt').value = proto_data;
    });
}
function clearLevelDetails() {
    let levelData = getLevel();
    levelData.maxCheckpointCount = 0;
    levelData.title = "";
    levelData.description = "";
    levelData.creators = "";
    setLevel(levelData);
}
function handleEditInput(e) {
    if (e.code === "Tab") {
        e.preventDefault();
        let selection = window.getSelection();
        selection.collapseToStart();
        let range = selection.getRangeAt(0);
        range.insertNode(document.createTextNode("    "));
        selection.collapseToEnd();
    } else if (e.code === "KeyF" && e.altKey) {
        e.preventDefault();
        let selection = window.getSelection();
        selection.collapseToStart();
        let range = selection.getRangeAt(0);
        range.insertNode(document.createTextNode(JSON.stringify({
            "time": 0.0,
            "position": {
                "x": 0,
                "y": 0,
                "z": 0
            },
            "rotation": {
                "w": 1.0,
                "x": 0.0,
                "y": 0.0,
                "z": 0.0
            }
        }, null, 4)));
        selection.collapseToEnd();
    }
}
function loadTemplateButtons() {
    templatesContainerElement.innerHTML = '';
    templates.forEach(template => {
        let templateElement = document.createElement('div');
        templateElement.classList.add('template');
        templateElement.innerText = template.name;
        templateElement.addEventListener('click', () => {
            document.querySelector('#prompt-templates .prompt-cancel').click();
            if (template.type == 'identifier') {
                downloadAndOpenLevel(template.link);
            } else if (template.type == 'file') {
                openProto(template.link);
            }
        });
        templatesContainerElement.appendChild(templateElement);
    });
}
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    const files = dt.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.level')) {
            openLevelFile([file]);
        } else if (file.name.endsWith('.json')) {
            appendJSON(URL.createObjectURL(file));
        } else if (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) {
            let imageInput = document.getElementById('image-btn-input');
            imageInput.files = files;
            generatePixelArt();
        }
    }
}
function handleStatsClick() {
    document.querySelectorAll('.stats-material, .stats-shape, .stats-type, .stats-extra').forEach(element => {
        element.style.display = "flex";
    });
    document.getElementById('stats-container').style.pointerEvents = "none";
    document.getElementById('stats-container').style.fontSize = "10";
}
function unlockLevel() {
    let levelData = getLevel();
    runOnNodes(levelData.levelNodes, (node) => {
        if (node.isLocked) {
            node.isLocked = false;
        }
    }, true);
    setLevel(levelData);
}
function highlightGroup(object) {
    if (object?.grabNodeData?.levelNodeGroup) {
        object.children.forEach(child => {
            highlightGroup(child);
        });
    } else {
        if (object?.material?.uniforms?.isSelected) {
            object.material.uniforms.isSelected.value = true;
        }
    }
}
function unHighlightGroup(object) {
    if (object?.grabNodeData?.levelNodeGroup) {
        object.children.forEach(child => {
            unHighlightGroup(child);
        });
    } else {
        if (object?.material?.uniforms?.isSelected) {
            object.material.uniforms.isSelected.value = false;
        }
    }
}
function onPointerMove(e) {
    if (enableEditing) {
        let canvasSize = renderer.domElement.getBoundingClientRect();
        mouse.x = ( (e.clientX - canvasSize.left) / canvasSize.width ) * 2 - 1;
        mouse.y = - ( (e.clientY - canvasSize.top) / canvasSize.height ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        let intersects = raycaster.intersectObjects( scene.children, true );
        if (lastSelected && lastSelected?.material?.uniforms?.isSelected) {
            lastSelected.material.uniforms.isSelected.value = false;
        }
        // else if (lastSelected && lastSelected?.grabNodeData?.levelNodeGroup) {
        //     unHighlightGroup(lastSelected);
        // }
        objects.forEach(object => {
            if (object?.material?.uniforms?.isSelected) {
                object.material.uniforms.isSelected.value = false;
            }
        });
        lastSelected = null;
        for (let i = 0; i < intersects.length; i++) {
            if (!intersects[i].object.grabNodeData) {
                intersects.splice(i, 1);
                i--;
            }
        }
        selected = null;
        if (intersects.length > 0 && e.target == renderer.domElement) {
            selected = intersects[0].object;
            lastSelected = selected;
            if (selected?.material?.uniforms?.isSelected) {
                if (selected?.parent?.type == "Scene") {
                    selected.material.uniforms.isSelected.value = true;
                } else {
                    while (selected) {
                        if (selected?.parent?.type == "Scene") {
                            highlightGroup(selected);
                            break;
                        }
                        selected = selected.parent;
                    }
                }
            }
        }
    }
}
function onPointerDown(e) {
    if (enableEditing && e.target == renderer.domElement) {
        if (selected || lastSelected) {
            editing = selected || lastSelected;
        }
        if (editing && editing?.parent?.type == "Scene") {
            transformControl.attach(editing);
            scene.add(transformControl);
        }
    }
}
function generateLevelFromObjects() {
    let levelNodes = [];
    objects.forEach(object => {
        if (object.parent.type == 'Scene') { //TODO: prevent
            if (object?.grabNodeData?.animations?.length > 0 && object.grabNodeData.animations[0].currentFrameIndex) {
                delete object.grabNodeData.animations[0].currentFrameIndex;
            }
            if (object?.grabNodeData?.levelNodeGroup) {
                runOnNodes(object.grabNodeData.levelNodeGroup.childNodes, (node) => {
                    if (node?.animations?.length > 0 && node?.animations[0]?.currentFrameIndex) {
                        delete node.animations[0].currentFrameIndex;
                    }
                }, true);
            }
            levelNodes.push(object.grabNodeData);
        }
    });
    let curLevel = getLevel();
    curLevel.levelNodes = levelNodes;
    setLevel(curLevel);
    transformControl.detach();
    applyChangesElement.style.display = "none";
    applyChangesAsFrameElement.style.display = "none";
}
function generateFrameLevelFromObjects() {
    let levelNodes = [];
    objects.forEach(object => {
        if (object.parent.type == 'Scene') { //TODO: prevent again -.-
            if (object?.grabNodeData?.animations?.length > 0 && object.grabNodeData.animations[0].currentFrameIndex) {
                delete object.grabNodeData.animations[0].currentFrameIndex;
            }
            if (object?.grabNodeData?.levelNodeGroup) {
                runOnNodes(object.grabNodeData.levelNodeGroup.childNodes, (node) => {
                    if (node?.animations?.length > 0 && node?.animations[0]?.currentFrameIndex) {
                        delete node.animations[0].currentFrameIndex;
                    }
                }, true);
            }
            let initialNode = object.initialGrabNodeData;
            let currentNode = object.grabNodeData;
            let initialPos = Object.values(initialNode)[0].position;
            let currentPos = Object.values(currentNode)[0].position;
            let initialRot = Object.values(initialNode)[0].rotation;
            let currentRot = Object.values(currentNode)[0].rotation;
            console.log(initialPos, initialRot, currentPos, currentRot);
            if (initialPos != currentPos || initialRot != currentRot) {
                if (!initialNode.animations || !initialNode.animations.length) {
                    console.log("adding animations");
                    initialNode.animations = [{
                        "name": "idle",
                        "frames": [
                            {
                                "position": {
                                    "x": 0,
                                    "y": 0,
                                    "z": 0
                                },
                                "rotation": {
                                    "w": 1,
                                    "x": 0,
                                    "y": 0,
                                    "z": 0
                                },
                                "time": 0
                            }
                        ],
                        "speed": 1
                    }];
                }
                if (!initialNode.animations[0]?.frames?.length) {
                    console.log("adding frame");
                    initialNode.animations[0].frames = [{
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1,
                            "x": 0,
                            "y": 0,
                            "z": 0
                        },
                        "time": 0
                    }];
                }
                let lastTime = initialNode.animations[0].frames[initialNode.animations[0].frames.length-1].time;
                let newFrame = {
                    "position": {
                        "x": 0,
                        "y": 0,
                        "z": 0
                    },
                    "rotation": {
                        "w": 1,
                        "x": 0,
                        "y": 0,
                        "z": 0
                    },
                    "time": lastTime + 1
                }
                newFrame.position.x = currentPos.x - initialPos.x;
                newFrame.position.y = currentPos.y - initialPos.y;
                newFrame.position.z = currentPos.z - initialPos.z;
                newFrame.rotation.x = currentRot.x - initialRot.x;
                newFrame.rotation.y = currentRot.y - initialRot.y;
                newFrame.rotation.z = currentRot.z - initialRot.z;
                newFrame.rotation.w = currentRot.w - initialRot.w;
                initialNode.animations[0].frames.push(newFrame);
                console.log("adding new frame");
            }
            levelNodes.push(initialNode);
        }
    });
    let curLevel = getLevel();
    curLevel.levelNodes = levelNodes;
    setLevel(curLevel);
    transformControl.detach();
    applyChangesElement.style.display = "none";
    applyChangesAsFrameElement.style.display = "none";
}
function groupEditingObject() {
    if (editing && !editing?.grabNodeData?.levelNodeGroup) {
        let groupData = {
            "levelNodeGroup": {
                "position": {
                    "y": 0,
                    "x": 0,
                    "z": 0
                },
                "rotation": {
                    "w": 1.0
                },
                "scale": {
                    "y": 1.0,
                    "x": 1.0,
                    "z": 1.0
                },
                "childNodes": [editing.grabNodeData]
            }
        };
        let groupObject = new THREE.Object3D();
        if (showGroups) {
            let geometry = new THREE.BoxGeometry(1, 1, 1);
            let material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
            groupObject = new THREE.Mesh(geometry, material);
        }
        objects.push(groupObject);
        groupObject.grabNodeData = groupData;
        groupObject.initialPosition = new THREE.Vector3(0, 0, 0);
        groupObject.initialRotation = new THREE.Quaternion(0, 0, 0, 1);

        let parent = editing.parent;
        parent.add(groupObject);
        groupObject.add(editing);
        parent.remove(editing);
        editing = groupObject;
        selected = groupObject;
    }
}
function cloneEditingObject() {
    if (editing && editing.parent.type == "Scene" && !editing?.grabNodeData?.levelNodeGroup) {
        let clone = editing.clone();
        clone.grabNodeData = deepClone(editing.grabNodeData);
        clone.initialPosition = deepClone(editing.initialPosition);
        clone.initialRotation = deepClone(editing.initialRotation);
        if (editing.animation) {
            clone.animation = deepClone(editing.animation);
            animatedObjects.push(clone);
        }
        editing.parent.add(clone);
        objects.push(clone);
    }
}
function deleteEditingObject() {
    if (editing && editing.parent.type == "Scene" && !editing?.grabNodeData?.levelNodeGroup) {
        editing.parent.remove(editing);
        objects.splice(objects.indexOf(editing), 1);
        if (editing.animation) {
            animatedObjects.splice(animatedObjects.indexOf(editing), 1);
        }
        editing = null;
        selected = null;
        transformControl.detach();
    } else if (editing && editing.parent.type == "Scene") {
        editing.parent.remove(editing);
        objects.splice(objects.indexOf(editing), 1);
        if (editing.animation) {
            animatedObjects.splice(animatedObjects.indexOf(editing), 1);
        }
        editing = null;
        selected = null;
        // TODO: properly delete groups and children
        generateLevelFromObjects();
    }
}
function onEditingKey(event) {
    if (enableEditing && document.activeElement.tagName == "BODY") {
        event.preventDefault();
        switch ( event.keyCode ) {
            case 81: // Q
                transformControl.setSpace( transformControl.space === 'local' ? 'world' : 'local' );
                break;

            case 16: // Shift
                transformControl.setTranslationSnap( 100 );
                transformControl.setRotationSnap( THREE.MathUtils.degToRad( 15 ) );
                transformControl.setScaleSnap( 0.25 );
                break;

            case 87: // W
                transformControl.setMode( 'translate' );
                break;

            case 69: // E
                transformControl.setMode( 'rotate' );
                break;

            case 82: // R
                transformControl.setMode( 'scale' );
                break;

            case 68: // D
                deleteEditingObject();
                break;

            case 67: // C
                cloneEditingObject();
                break;
                
            case 71: // G
                groupEditingObject();
                break;

            default:
                break;
        }
    }
}
function remakeEditingObject(material, shape, shapeData) {
    let nodeData = Object.values(shapeData)[0];
    console.log(material, shape, shapeData, nodeData);
    nodeData.shape = shape;
    nodeData.material = material;

    let newObject = shapes[shape-1000].clone();
    let newMaterial = materials[material].clone();
    if (material == 8) {
        newMaterial.uniforms.colors.value = new THREE.Vector3(
            nodeData?.color?.r || 0,
            nodeData?.color?.g || 0,
            nodeData?.color?.b || 0
        );
    }

    newObject.material = newMaterial;
    newObject.grabNodeData = shapeData;
    newObject.initialPosition = nodeData.position;
    newObject.initialRotation = nodeData.rotation;
    newObject.position.copy(editing.position);
    newObject.quaternion.copy(editing.quaternion);
    newObject.scale.copy(editing.scale);
    if (editing.animation) {
        newObject.animation = deepClone(editing.animation);
        animatedObjects.push(newObject);
    }
    editing.parent.add(newObject);
    objects.push(newObject);
    editing.parent.remove(editing);
    objects.splice(objects.indexOf(editing), 1);
    if (editing.animation) {
        animatedObjects.splice(animatedObjects.indexOf(editing), 1);
    }
    editing = newObject;
    selected = newObject;
    transformControl.attach(newObject);
    scene.add(transformControl);
}
function remakeObject(material, shape, shapeData, object) {
    let nodeData = Object.values(shapeData)[0];
    if (!material) {
        material = nodeData.material || 0;
    }
    if (!shape) {
        shape = nodeData.shape;
    }
    nodeData.shape = shape;
    nodeData.material = material;
    let newObject = shapes[shape-1000].clone();
    let newMaterial = materials[material].clone();
    if (material == 8) {
        newMaterial.uniforms.colors.value = new THREE.Vector3(
            nodeData?.color?.r || 0,
            nodeData?.color?.g || 0,
            nodeData?.color?.b || 0
        );
    }

    newObject.material = newMaterial;
    newObject.grabNodeData = shapeData;
    newObject.initialPosition = nodeData.position;
    newObject.initialRotation = nodeData.rotation;
    newObject.position.copy(object.position);
    newObject.quaternion.copy(object.quaternion);
    newObject.scale.copy(object.scale);
    if (object.animation) {
        newObject.animation = deepClone(object.animation);
        animatedObjects.push(newObject);
    }
    object.parent.add(newObject);
    objects.push(newObject);
    object.parent.remove(object);
    objects.splice(objects.indexOf(object), 1);
    if (object.animation) {
        animatedObjects.splice(animatedObjects.indexOf(object), 1);
    }
    object = newObject;
    selected = newObject;
}
function remakeGroup(shape, material, object) {
    if (object.grabNodeData.levelNodeGroup) {
        let childNodes = editing.grabNodeData.levelNodeGroup.childNodes;
        runOnNodes(childNodes, (node) => {
            if (material) {
                if (node.levelNodeStatic) {
                    node.levelNodeStatic.material = material;
                }
            }
            if (shape) {
                if (node.levelNodeStatic || node.levelNodeCrumbling) {
                    node.levelNodeStatic.shape = shape;
                }
            }
        }, false);
        let objectsToRemake = [];
        for (let i = 0; i < object.children.length; i++) {
            let child = object.children[i];
            if (child?.grabNodeData?.levelNodeGroup) {
                remakeGroup(shape, material, child);
            } else {
                objectsToRemake.push(child);
            }
        }
        for (let i = 0; i < objectsToRemake.length; i++) {
            remakeGroup(shape, material, objectsToRemake[i]);
        }
    } else {
        if (shape && (object.grabNodeData.levelNodeStatic || object.grabNodeData.levelNodeCrumbling)) {
            let shapeData = deepClone(object.grabNodeData);
            remakeObject(material, shape, shapeData, object);
        }
        if (material && (object.grabNodeData.levelNodeStatic)) {
            let shapeData = deepClone(object.grabNodeData);
            remakeObject(material, shape, shapeData, object);
        }
    }
}
function editShape(shape) {
    if (
        editing && editing.parent.type == "Scene"
        && (editing.grabNodeData.levelNodeStatic || editing.grabNodeData.levelNodeCrumbling)
    ) {
        let shapeData = deepClone(editing.grabNodeData);
        let nodeData = Object.values(shapeData)[0];
        let material = nodeData.material || 0;
        remakeEditingObject(material, shape, shapeData);
        applyChangesElement.style.display = "block";
        applyChangesAsFrameElement.style.display = "block";
    } else if (editing && editing?.grabNodeData?.levelNodeGroup) {
        // TODO: fix changing children
        remakeGroup(shape, false, editing)
        // change group nodeData
        let childNodes = editing.grabNodeData.levelNodeGroup.childNodes;
        runOnNodes(childNodes, (node) => {
            if (node.levelNodeStatic || node.levelNodeCrumbling) {
                Object.values(node)[0].shape = shape;
            }
        }, false);
    }
}
function editMaterial(material) {
    if (
        editing && editing.parent.type == "Scene" 
        && (editing.grabNodeData.levelNodeStatic)
    ) {
        let shapeData = deepClone(editing.grabNodeData);
        let nodeData = Object.values(shapeData)[0];
        let shape = nodeData.shape;
        remakeEditingObject(material, shape, shapeData);
        applyChangesElement.style.display = "block";
        applyChangesAsFrameElement.style.display = "block";
    } else if (editing && editing?.grabNodeData?.levelNodeGroup) {
        // TODO: fix changing children
        remakeGroup(false, material, editing)
        // change group nodeData
        let childNodes = editing.grabNodeData.levelNodeGroup.childNodes;
        runOnNodes(childNodes, (node) => {
            if (node.levelNodeStatic) {
                node.levelNodeStatic.material = material;
            }
        }, false);
    }
}
function editColor(e) {
    let color = e.target.value;
    if (editing && editing.parent.type == "Scene" && editing.grabNodeData.levelNodeStatic) {
        let shapeData = deepClone(editing.grabNodeData);
        let nodeData = Object.values(shapeData)[0];
        nodeData.color = {
            "r": parseInt(color.substring(1, 3), 16)/255,
            "g": parseInt(color.substring(3, 5), 16)/255,
            "b": parseInt(color.substring(5, 7), 16)/255,
            "a": 1
        }
        let material = nodeData.material || 0;
        let shape = nodeData.shape;
        remakeEditingObject(material, shape, shapeData);
        applyChangesElement.style.display = "block";
        applyChangesAsFrameElement.style.display = "block";
    } else if (editing && editing?.grabNodeData?.levelNodeGroup) {
        // TODO: fix changing children
        remakeGroup(false, false, editing)
        // change group nodeData
        let childNodes = editing.grabNodeData.levelNodeGroup.childNodes;
        runOnNodes(childNodes, (node) => {
            if (node.levelNodeStatic) {
                Object.values(node)[0].color = {
                    "r": parseInt(color.substring(1, 3), 16)/255,
                    "g": parseInt(color.substring(3, 5), 16)/255,
                    "b": parseInt(color.substring(5, 7), 16)/255,
                    "a": 1
                }
            }
        }, false);
        generateLevelFromObjects();
    }
}
function editAnimation(animation) {
    if (
        editing && editing?.parent?.type == "Scene"
        && (
            editing.grabNodeData.levelNodeStatic || 
            editing.grabNodeData.levelNodeCrumbling ||
            editing.grabNodeData.levelNodeGravity ||
            editing.grabNodeData.levelNodeSign || 
            editing.grabNodeData.levelNodeGroup
        )
    ) {
        if (animation == "none") {
            editing.animation = null;
            editing.grabNodeData.animations = [];
            animatedObjects.splice(animatedObjects.indexOf(editing), 1);
            editing.position.copy(editing.initialPosition);
            editing.quaternion.copy(editing.initialRotation);
        } else {
            let hadAnimation = true;
            if (!editing.animation) {
                hadAnimation = false;
            }
            let animationData = animationPresets[animation];
            editing.animation = animationData;
            editing.animation.currentFrameIndex = 0;
            editing.grabNodeData.animations = [animationData];
            editing.initialPosition = Object.values(editing.grabNodeData)[0].position;
            editing.initialRotation = Object.values(editing.grabNodeData)[0].rotation;
            editing.position.copy(editing.initialPosition);
            editing.quaternion.copy(editing.initialRotation);
            if (hadAnimation) {
                animatedObjects.push(editing);
            }
        }
        // applyChangesElement.style.display = "block";
        generateLevelFromObjects();
    }
}
function addFrame(frame) {
    let object = editing;
    let currentPosition = {
        "x": 0,
        "y": 0,
        "z": 0
    }
    let currentTime = 0;
    if (object.grabNodeData.animations) {
        if (object.grabNodeData.animations
            && object.grabNodeData.animations.length
            && object.grabNodeData.animations[0].frames
            && object.grabNodeData.animations[0].frames.length
            && object.grabNodeData.animations[0].frames[0]) {
            currentPosition = object.grabNodeData.animations[0].frames[object.grabNodeData.animations[0].frames.length - 1].position;
            currentTime = object.grabNodeData.animations[0].frames[object.grabNodeData.animations[0].frames.length - 1].time || 0;
        }
    } else {
        object.grabNodeData.animations = [{
            "name": "idle",
            "frames": [
                {
                    "position": {
                        "x": 0,
                        "y": 0,
                        "z": 0
                    },
                    "rotation": {
                        "w": 1,
                        "x": 0,
                        "y": 0,
                        "z": 0
                    },
                    "time": 0
                }
            ],
            "speed": 1
        }];
    }
    switch (frame) {
        case "posx":
            currentPosition.x += 1;
            break;
        case "negx":
            currentPosition.x -= 1;
            break;
        case "posy":
            currentPosition.y += 1;
            break;
        case "negy":
            currentPosition.y -= 1;
            break;
        case "posz":
            currentPosition.z += 1;
            break;
        case "negz":
            currentPosition.z -= 1;
            break;
        default:
            break;
    }
    object.grabNodeData.animations[0].frames.push({
        "position": currentPosition,
        "rotation": {
            "w": 1,
            "x": 0,
            "y": 0,
            "z": 0
        },
        "time": currentTime + 1
    });
}
async function getAnimationPresets() {
    let folderPath = "/level_data/animations/";
    for (let fileName of fileNames) {
        let file = folderPath + fileName + ".json";
        let response = await fetch(file);
        let data = await response.json();
        animationPresets[fileName] = data;
    }
}
function copyEditingJSON() {
    if (editing) {
        let json = JSON.stringify(editing.grabNodeData, null, 4);
        navigator.clipboard.writeText(json);
    }
}
function copyEditingChildren() {
    if (editing && editing?.grabNodeData?.levelNodeGroup) {
        let json = JSON.stringify(editing.grabNodeData.levelNodeGroup.childNodes, null, 4);
        json = json.substring(1, json.length - 1);
        navigator.clipboard.writeText(json);
    }
}
function copyEditingAnimations() {
    if (editing && editing?.grabNodeData?.animations) {
        let json = JSON.stringify(editing.grabNodeData.animations, null, 4);
        json = json.substring(1, json.length - 1);
        navigator.clipboard.writeText(json);
    }
}
function editEditingJSON(input) {
    let newJSON = JSON.parse(input);
    editing.grabNodeData = newJSON;
    generateLevelFromObjects();
}
function editEditingChildrenJSON(input) {
    if (input.charAt(0) != '[') {
        input = '[\n' + input + '\n]';
    }
    let newJSON = JSON.parse(input);
    editing.grabNodeData.levelNodeGroup.childNodes = newJSON;
    generateLevelFromObjects();
}
function editEditingAnimationsJSON(input) {
    if (input.charAt(0) != '[') {
        input = '[\n' + input + '\n]';
    }
    let newJSON = JSON.parse(input);
    editing.grabNodeData.animations = newJSON;
    generateLevelFromObjects();
}
function initEditor() {
    loader = new GLTFLoader();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / (window.innerHeight - 20), 0.1, 10000 );
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize( window.innerWidth , window.innerHeight - 20 );
    renderContainerElement.appendChild( renderer.domElement );
    light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    sun = new THREE.DirectionalLight( 0xffffff, 0.5 );
    scene.add( sun );
    vrButton = VRButton.createButton( renderer );
    controls = new OrbitControls( camera, renderer.domElement );
    controls.mouseButtons = {LEFT: 2, MIDDLE: 1, RIGHT: 0}
    fly = new FlyControls( camera, renderer.domElement );
    fly.pointerdown = fly.pointerup = fly.pointermove = () => {};
    fly.dragToLook = false;
    fly.rollSpeed = 0;
    fly.movementSpeed = 0.2;
    transformControl = new TransformControls( camera, renderer.domElement );
    transformControl.addEventListener( 'change', () => {
        if (enableEditing && editing?.parent?.type == "Scene") {
            Object.values(editing.grabNodeData)[0].position = {
                "x": editing.position.x,
                "y": editing.position.y,
                "z": editing.position.z
            };
            Object.values(editing.grabNodeData)[0].rotation = {
                "x": editing.quaternion.x,
                "y": editing.quaternion.y,
                "z": editing.quaternion.z,
                "w": editing.quaternion.w
            };
            Object.values(editing.grabNodeData)[0].scale = {
                "x": editing.scale.x,
                "y": editing.scale.y,
                "z": editing.scale.z
            };
            editing.initialPosition = {
                "x": editing.position.x,
                "y": editing.position.y,
                "z": editing.position.z
            }
            editing.initialRotation = {
                "x": editing.quaternion.x,
                "y": editing.quaternion.y,
                "z": editing.quaternion.z,
                "w": editing.quaternion.w
            }
            applyChangesElement.style.display = "block";
            applyChangesAsFrameElement.style.display = "block";
        }
    });
    transformControl.addEventListener( 'dragging-changed', ( event ) => {
        controls.enabled = ! event.value;
    } );
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    renderer.domElement.addEventListener( 'pointermove', onPointerMove, false );
    window.addEventListener( 'pointermove', onPointerMove, false );
    renderer.domElement.addEventListener( 'pointerdown', onPointerDown, false );
    window.addEventListener( 'keydown', onEditingKey, false );
    addEventListener('resize', () => {
        camera.aspect = window.innerWidth / (window.innerHeight - 20);
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight - 20 );
    });
    camera.position.set(0, 10, 10);
    renderer.setAnimationLoop(animate);
}
function initTerminal() {
    terminalInputElement.addEventListener('keydown', (e) => {
        if (e.which === 13 && e.shiftKey === false && e.altKey === false) {
            e.preventDefault();
            let input = terminalInputElement.value;
            let level = getLevel();
            let success = 0;
            let fail = 0;
            level.levelNodes.forEach(node => {
                try {
                    eval(input);
                    success++;
                } catch (e) {
                    console.error(e)
                    fail++;
                }
            });
            terminalInputElement.placeholder = `[Enter] to run JS code in loop\n[Alt] & [Enter] to run JS code out of loop\n[Alt] & [UpArrow] for last ran\nvar level = getLevel()\nlevel.levelNodes.forEach(node => {})\n\n${success} success | ${fail} error${fail != 0 ? "\n[ctrl]+[shift]+[i] for details" : ""}`;
            setLevel(level);
            lastRan = input
            terminalInputElement.value = '';
        } else if (e.which === 13 && e.altKey === true && e.shiftKey === false) {
            e.preventDefault();
            let input = terminalInputElement.value;
            let level = getLevel();
            try {
                eval(input);
                terminalInputElement.placeholder = `[Enter] to run JS code in loop\n[Alt] & [Enter] to run JS code out of loop\n[Alt] & [UpArrow] for last ran\nvar level = getLevel()\nlevel.levelNodes.forEach(node => {})\n\nsuccess`;
            } catch (e) {
                console.error(e);
                terminalInputElement.placeholder = `[Enter] to run JS code in loop\n[Alt] & [Enter] to run JS code out of loop\n[Alt] & [UpArrow] for last ran\nvar level = getLevel()\nlevel.levelNodes.forEach(node => {})\n\nerror | [ctrl]+[shift]+[i] for details`;
            }
            
            setLevel(level);
            lastRan = input
            terminalInputElement.value = '';
        } else if (e.which === 38 && e.altKey === true) {
            e.preventDefault();
            terminalInputElement.value = lastRan;
        }
    });
}
function toggleEditing() {
    if (!enableEditing) {
        animatedObjects.forEach(object => {
            object.animation.currentFrameIndex = 0
            object.position.copy(object.initialPosition);
            object.quaternion.copy(object.initialRotation);
        });
    }
    if (enableEditing) {
        generateLevelFromObjects();
    }
    enableEditing = !enableEditing;
    playAnimations = !enableEditing;
    document.getElementById('enableEditing-btn').style.color = enableEditing? '#3f3' : '';
}
function groupNodes(nodes) {
    return {
        "levelNodeGroup": {
            "position": {
                "y": 0, 
                "x": 0, 
                "z": 0
            }, 
            "rotation": {
                "w": 1.0
            }, 
            "scale": {
                "y": 1.0, 
                "x": 1.0, 
                "z": 1.0
            },
            "childNodes": nodes
        }
    };
}
function groupLevel() {
    let levelData = getLevel();
    levelData.levelNodes = [groupNodes(levelData.levelNodes)];
    setLevel(levelData);
}
function ungroupLevel() {
    let levelData = getLevel();
    levelData.levelNodes = levelData.levelNodes[0].levelNodeGroup.childNodes;
    setLevel(levelData);
}
function FPEPixelate() {
    let levelData = getLevel();
    levelData.levelNodes = [groupNodes(levelData.levelNodes)];
    levelData.levelNodes[0].levelNodeGroup.position = {
        "x": 900000,
        "y": 900000,
        "z": 900000
    };
    levelData.levelNodes[0].animations = [
        {
            "name": "idle",
            "speed": 1,
            "frames": [
                {
                    "time": 0.0,
                    "position": {
                        "x": -900000,
                        "y": -900000,
                        "z": -900000
                    },
                    "rotation": {
                        "w": 1.0,
                        "x": 0.0,
                        "y": 0.0,
                        "z": 0.0
                    }
                }
            ]
        }
    ];
    setLevel(levelData);
}
function openPointCloud(file) {
    let reader = new FileReader();

    reader.onload = function() {
        let data = reader.result;
        let level = getLevel();
        let lines = data.split("\n");
        let points = {
            "levelNodeGroup": {
                "position": {
                    "y": 0, 
                    "x": 0, 
                    "z": 0
                }, 
                "rotation": {
                    "w": 1.0
                }, 
                "scale": {
                    "y": 1.0, 
                    "x": 1.0, 
                    "z": 1.0
                },
                "childNodes": []
            }
        };
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.startsWith("v ")) {
                line = line.replace("v ", "");
                let coords = line.split(" ");
                points.levelNodeGroup.childNodes.push({
                    "levelNodeStatic": {
                        "material": 8,
                        "position": {
                            "x": parseFloat(coords[0]),
                            "y": parseFloat(coords[1]),
                            "z": parseFloat(coords[2])
                        },
                        "color": {
                            "r": 1,
                            "g": 1,
                            "b": 1,
                            "a": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "shape": 1001
                    }
                });
            }
        }
        level.levelNodes.push(points);
        setLevel(level);
    }
    reader.readAsText(file);
}
function openWireframe(file) {
    let reader = new FileReader();

    reader.onload = function() {
        let data = reader.result;
        let level = getLevel();
        let lines = data.split("\n");
        let wireframe = {
            "levelNodeGroup": {
                "position": {
                    "y": 0,
                    "x": 0,
                    "z": 0
                },
                "rotation": {
                    "w": 1.0
                },
                "scale": {
                    "y": 1.0,
                    "x": 1.0,
                    "z": 1.0
                },
                "childNodes": []
            }
        };

        let vertices = [];
        let edges = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.startsWith("v ")) {
                line = line.replace("v ", "");
                let coords = line.trim().split(" ");
                vertices.push({
                    "x": parseFloat(coords[0]),
                    "y": parseFloat(coords[1]),
                    "z": parseFloat(coords[2])
                });
            } else if (line.startsWith("f ")) {
                line = line.replace("f ", "");
                let faceIndices = line.trim().split(" ");
                let edgeA = parseInt(faceIndices[0].split("/")[0]) - 1;
                let edgeB = parseInt(faceIndices[1].split("/")[0]) - 1;
                let edgeC = parseInt(faceIndices[2].split("/")[0]) - 1;
                edges.push({
                    "a": edgeA,
                    "b": edgeB
                });
                edges.push({
                    "a": edgeB,
                    "b": edgeC
                });
                edges.push({
                    "a": edgeC,
                    "b": edgeA
                });
            }
        }

        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            
            let pointA = vertices[edge.a];
            let pointB = vertices[edge.b];

            let distance = Math.sqrt(
                Math.pow(pointB.x - pointA.x, 2) +
                Math.pow(pointB.y - pointA.y, 2) +
                Math.pow(pointB.z - pointA.z, 2)
            );

            let midpoint = {
                x: (pointA.x + pointB.x) / 2,
                y: (pointA.y + pointB.y) / 2,
                z: (pointA.z + pointB.z) / 2,
            };

            let rotation = {
                x: 0,
                y: 0,
                z: 0,
                w: 1
            };

            // rotate to cross points 

            wireframe.levelNodeGroup.childNodes.push({
                "levelNodeStatic": {
                    "material": 8,
                    "position": midpoint,
                    "color": {
                        "r": 1,
                        "g": 1,
                        "b": 1,
                        "a": 1
                    },
                    "rotation": rotation,
                    "scale": {
                        "x": 1,
                        "y": distance,
                        "z": 1
                    },
                    "shape": 1002
                }
            });
        }
        

        level.levelNodes.push(wireframe);
        setLevel(level);
    };

    reader.readAsText(file);
}
function generatePixelArt() {
    let quality = document.getElementById('pixel-prompt').value;
    document.getElementById('pixel-prompt').value = '';
    
    if (quality == "" || quality == null || quality < 1) {
        quality = 50;
    }
    let file = document.getElementById('image-btn-input').files[0];
    let canvas = document.getElementById('pixel-canvas');
    let ctx = canvas.getContext('2d');
    let reader = new FileReader();
    reader.onload = function() {
        let data = reader.result;
        let img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            let canvas2 = document.getElementById('pixel-canvas2');
            let ctx2 = canvas2.getContext('2d');
            canvas2.width = quality;
            canvas2.height = quality;
            let rgbArray = [];
            for (let x = 0; x < quality; x++) {
                for (let y = 0; y < quality; y++) {
                    let pixel = ctx.getImageData(x*(img.width/quality), y*(img.height/quality), 1, 1);
                    ctx2.putImageData(pixel, x, y);
                    let rgb = pixel.data;
                    rgbArray.push([rgb[0], rgb[1], rgb[2], x, y*-1]);
                }
            }
            let pixelGroup = {
                "levelNodeGroup": {
                    "position": {
                        "y": 0, 
                        "x": 0, 
                        "z": 0
                    }, 
                    "rotation": {
                        "w": 1.0
                    }, 
                    "childNodes": [], 
                    "scale": {
                        "y": 1.0, 
                        "x": 1.0, 
                        "z": 1.0
                    }
                }
            }
            let pixels = rgbArray;
            for (let i = 0; i < pixels.length; i++) {
                if (pixels[i][0] == 0) {
                    pixels[i][0] == 1;
                }
                if (pixels[i][1] == 0) {
                    pixels[i][1] == 1;
                }
                if (pixels[i][2] == 0) {
                    pixels[i][2] == 1;
                }
                pixelGroup.levelNodeGroup.childNodes.push({
                    "levelNodeStatic": {
                        "material": 8,
                        "position": {
                            "x": pixels[i][3],
                            "y": pixels[i][4],
                            "z": 10.0
                        },
                        "color": {
                            "r": pixels[i][0] / 255,
                            "g": pixels[i][1] / 255,
                            "b": pixels[i][2] / 255,
                            "a": 1.0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "scale": {
                            "x": 1.0,
                            "y": 1.0,
                            "z": 1.0
                        },
                        "shape": 1000
                    }
                });
            }
            let mainLevel = getLevel();
            mainLevel.levelNodes.push(pixelGroup);
            setLevel(mainLevel);
        }
        img.src = data;
    }
    reader.readAsDataURL(file);
}
function duplicateLevel() {
    let levelData = getLevel();
    levelData.levelNodes = levelData.levelNodes.concat(levelData.levelNodes);
    setLevel(levelData);
}
function convertLevelNodes() {
    const fromValue = document.getElementById("convert-from").value;
    const toValue = document.getElementById("convert-to").value;

    let level = getLevel();
    runOnNodes(level.levelNodes, (node)=>{
        if (fromValue == 7) {
            if (
                node?.levelNodeCrumbling?.material == fromValue
            ) {
                if (toValue >= 1000) {
                    node.levelNodeCrumbling.shape = toValue;
                } else {
                    node.levelNodeCrumbling.material = toValue;
                }
            }
        } else {
            if (
                node?.levelNodeStatic?.material == fromValue
                || (fromValue == 0 && (node?.levelNodeStatic && !node.levelNodeStatic.hasOwnProperty('material')))
                || node?.levelNodeStatic?.shape == fromValue
            ) {
                if (toValue >= 1000) {
                    node.levelNodeStatic.shape = toValue;
                } else {
                    node.levelNodeStatic.material = toValue;
                }
            }
        }

    }, false);
    setLevel(level);
}

initEditor();
getAnimationPresets();
initAttributes();
highlightTextEditor();
initTerminal();

// dark mode
if (localStorage.getItem("darkMode") === "true") {
    document.body.parentElement.classList.add("dark-mode");
}

// prompts
const promptsElement = document.getElementById('prompts');

document.getElementById('edit_editJSON-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-editingJson').style.display = 'flex';
    document.getElementById('editingJson-prompt').innerHTML = JsonToHighlightedText(editing.grabNodeData);
});
document.querySelector('#prompt-editingJson .prompt-submit').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-editingJson').style.display = 'none';
    let input = document.getElementById('editingJson-prompt').innerText;
    editEditingJSON(input);
    document.getElementById('editingJson-prompt').innerHTML = '';
});

document.getElementById('edit_editChildren-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-editingChildrenJson').style.display = 'flex';
    document.getElementById('editingChildrenJson-prompt').innerHTML = JsonToHighlightedText(editing.grabNodeData.levelNodeGroup.childNodes);
});
document.querySelector('#prompt-editingChildrenJson .prompt-submit').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-editingChildrenJson').style.display = 'none';
    let input = document.getElementById('editingChildrenJson-prompt').innerText;
    editEditingChildrenJSON(input);
    document.getElementById('editingChildrenJson-prompt').innerHTML = '';
});

document.getElementById('edit_editAnimations-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-editingAnimationsJson').style.display = 'flex';
    document.getElementById('editingAnimationsJson-prompt').innerHTML = JsonToHighlightedText(editing.grabNodeData.animations);
});
document.querySelector('#prompt-editingAnimationsJson .prompt-submit').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-editingAnimationsJson').style.display = 'none';
    let input = document.getElementById('editingAnimationsJson-prompt').innerText;
    editEditingAnimationsJSON(input);
    document.getElementById('editingAnimationsJson-prompt').innerHTML = '';
});

document.getElementById('title-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-title').style.display = 'flex';
});
document.querySelector('#prompt-title .prompt-cancel').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-title').style.display = 'none';
    document.getElementById('title-prompt').value = '';
});
document.querySelector('#prompt-title .prompt-submit').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-title').style.display = 'none';
    let input = document.getElementById('title-prompt').value;
    let levelData = getLevel();
    levelData.title = input;
    setLevel(levelData);
    document.getElementById('title-prompt').value = '';
});

document.getElementById('description-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-description').style.display = 'flex';
});
document.getElementById('quest-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-levels').style.display = 'flex';
    listQuestLevels();
});
document.querySelector('#prompt-levels .prompt-cancel').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-levels').style.display = 'none';
});

document.getElementById('template-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-templates').style.display = 'flex';
    loadTemplateButtons();
});
document.querySelector('#prompt-templates .prompt-cancel').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-templates').style.display = 'none';
});

document.querySelector('#prompt-description .prompt-cancel').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-description').style.display = 'none';
    document.getElementById('description-prompt').value = '';
});
document.querySelector('#prompt-description .prompt-submit').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-description').style.display = 'none';
    let input = document.getElementById('description-prompt').value;
    let levelData = getLevel();
    levelData.description = input;
    setLevel(levelData);
    document.getElementById('description-prompt').value = '';
});

document.getElementById('creators-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-creators').style.display = 'flex';
});
document.querySelector('#prompt-creators .prompt-cancel').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-creators').style.display = 'none';
    document.getElementById('creators-prompt').value = '';
});
document.querySelector('#prompt-creators .prompt-submit').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-creators').style.display = 'none';
    let input = document.getElementById('creators-prompt').value;
    let levelData = getLevel();
    levelData.creators = input;
    setLevel(levelData);
    document.getElementById('creators-prompt').value = '';
});

document.getElementById('checkpoints-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-checkpoints').style.display = 'flex';
});
document.querySelector('#prompt-checkpoints .prompt-cancel').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-checkpoints').style.display = 'none';
    document.getElementById('checkpoints-prompt').value = '';
});
document.querySelector('#prompt-checkpoints .prompt-submit').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-checkpoints').style.display = 'none';
    let input = document.getElementById('checkpoints-prompt').value;
    let levelData = getLevel();
    levelData.maxCheckpointCount = parseInt(input);
    setLevel(levelData);
    document.getElementById('checkpoints-prompt').value = '';
});

document.querySelector('#prompt-pixel .prompt-cancel').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-pixel').style.display = 'none';
    document.getElementById('pixel-prompt').value = '';
});
document.querySelector('#prompt-pixel .prompt-submit').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-pixel').style.display = 'none';
    generatePixelArt();
});
document.getElementById('image-btn-input').addEventListener('change', (e) => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-pixel').style.display = 'flex';
});

document.getElementById('protobuf-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-protobuf').style.display = 'flex';
    document.getElementById('protobuf-prompt').value = protobufData;
});
document.querySelector('#prompt-protobuf .prompt-cancel').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-protobuf').style.display = 'none';
    document.getElementById('protobuf-prompt').value = protobufData;
});
document.querySelector('#prompt-protobuf .prompt-submit').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-protobuf').style.display = 'none';
    protobufData = document.getElementById('protobuf-prompt').value;
});

document.getElementById('convert-btn').addEventListener('click', () => {
    promptsElement.style.display = 'grid';
    document.getElementById('prompt-convert').style.display = 'flex';
});
document.querySelector('#prompt-convert .prompt-cancel').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-convert').style.display = 'none';
});
document.querySelector('#prompt-convert .prompt-submit').addEventListener('click', () => {
    promptsElement.style.display = 'none';
    document.getElementById('prompt-convert').style.display = 'none';
    convertLevelNodes();
});
// timeline
document.getElementById('timeline-slow').addEventListener('click', () => {
    animationSpeed -= 0.1;
});
document.getElementById('timeline-fast').addEventListener('click', () => {
    animationSpeed += 0.1;
});
document.getElementById('timeline-play').addEventListener('click', () => {
    playAnimations = true;
    if (enableEditing) {
        generateLevelFromObjects();
        enableEditing = false;
        document.getElementById('enableEditing-btn').style.color = enableEditing? '#3f3' : '';
    }
});
document.getElementById('timeline-pause').addEventListener('click', () => {
    playAnimations = false;
});
document.getElementById('timeline-reset').addEventListener('click', () => {
    animationSpeed = 1;
    animationTime = 0;
    animatedObjects.forEach(object => {
        object.animation.currentFrameIndex = 0
    });
});
// editing menu
document.querySelectorAll('.edit_material').forEach(element => {
    element.addEventListener('click', () => {
        editMaterial(parseInt(element.id.split('-')[1]));
    });
});
document.querySelectorAll('.edit_shape').forEach(element => {
    element.addEventListener('click', () => {
        editShape(parseInt(element.id.split('-')[1]));
    });
});
document.querySelectorAll('.edit_animation').forEach(element => {
    element.addEventListener('click', () => {
        editAnimation(element.id.split('-')[1]);
    });
});
document.querySelectorAll('.edit_frame').forEach(element => {
    element.addEventListener('click', () => {
        addFrame(element.id.split('-')[1]);
    });
});
document.getElementById('edit_color-btn').addEventListener('click', () => {document.getElementById('edit_color-btn-input').click();});
document.getElementById('edit_color-btn-input').addEventListener('change', editColor);
document.getElementById('edit_copyJSON-btn').addEventListener('click', copyEditingJSON);
document.getElementById('edit_copyChildren-btn').addEventListener('click', copyEditingChildren);
document.getElementById('edit_copyAnimations-btn').addEventListener('click', copyEditingAnimations);

document.getElementById("edit_rotate-btn").addEventListener('click', () => {transformControl.setMode( 'rotate' )});
document.getElementById("edit_scale-btn").addEventListener('click', () => {transformControl.setMode( 'scale' )});
document.getElementById("edit_translate-btn").addEventListener('click', () => {transformControl.setMode( 'translate' )});
document.getElementById("edit_space-btn").addEventListener('click', () => {transformControl.setSpace( transformControl.space === 'local' ? 'world' : 'local' )});
document.getElementById("edit_group-btn").addEventListener('click', groupEditingObject);
document.getElementById("edit_clone-btn").addEventListener('click', cloneEditingObject);
document.getElementById("edit_delete-btn").addEventListener('click', deleteEditingObject);
document.getElementById("edit_snap-btn").addEventListener('click', () => {
    transformControl.setTranslationSnap( 100 );
    transformControl.setRotationSnap( THREE.MathUtils.degToRad( 15 ) );
    transformControl.setScaleSnap( 0.25 );
});

// apply
applyChangesElement.addEventListener('click', generateLevelFromObjects);
applyChangesAsFrameElement.addEventListener('click', generateFrameLevelFromObjects);
// stats
document.getElementById('stats-container').addEventListener('click', handleStatsClick);
// buttons
document.getElementById('enableEditing-btn').addEventListener('click', toggleEditing);
document.getElementById('hide-btn').addEventListener('click', () => {editInputElement.style.display = hideText ? 'block' : 'none';hideText = !hideText;highlightTextEditor()});
document.getElementById('highlight-btn').addEventListener('click', () => {highlightText = !highlightText;highlightTextEditor()});
document.getElementById('performance-btn').addEventListener('click', () => {renderer.getPixelRatio() == 1 ? renderer.setPixelRatio( window.devicePixelRatio / 10 ) : renderer.setPixelRatio( 1 )});
document.getElementById('range-btn').addEventListener('click', () => {loadProtobuf("proto/hacked.proto")});
editInputElement.addEventListener('keydown', (e) => {handleEditInput(e)});
document.getElementById('start-btn').addEventListener('click', goToStart);
document.getElementById('altTextures-btn').addEventListener('click', toggleTextures);
document.getElementById('showGroups-btn').addEventListener('click', () => {showGroups = !showGroups; refreshScene()});
editInputElement.addEventListener('blur', highlightTextEditor);
document.getElementById('json-btn').addEventListener('click', downloadAsJSON);
document.getElementById('monochromify-btn').addEventListener('click', monochromify);
document.getElementById('gltf-btn').addEventListener('click', exportLevelAsGLTF);
document.getElementById('toquest-btn').addEventListener('click', saveToQuest);
document.getElementById('connect-adb-btn').addEventListener('click', connectUsb);
document.getElementById('cleardetails-btn').addEventListener('click', clearLevelDetails);
document.getElementById('group-btn').addEventListener('click', groupLevel);
document.getElementById('ungroup-btn').addEventListener('click', ungroupLevel);
document.getElementById('FPE-pixelate-btn').addEventListener('click', FPEPixelate);
document.getElementById('outline-btn').addEventListener('click', outlineLevel);
document.getElementById('magic-outline-btn').addEventListener('click', magicOutline);
document.getElementById('randomize-positions-btn').addEventListener('click', randomizeLevelPositions);
document.getElementById('randomize-materials-btn').addEventListener('click', randomizeLevelMaterials);
document.getElementById('randomize-colors-btn').addEventListener('click', randomizeLevelColors);
document.getElementById('randomize-rotations-btn').addEventListener('click', randomizeLevelRotations);
document.getElementById('randomize-scales-btn').addEventListener('click', randomizeLevelScales);
document.getElementById('randomize-shapes-btn').addEventListener('click', randomizeLevelShapes);
document.getElementById('randomize-all-btn').addEventListener('click', randomizeLevelAll);
document.getElementById('explode-btn').addEventListener('click', explodeLevel);
document.getElementById('duplicate-btn').addEventListener('click', duplicateLevel);
document.getElementById('topc-btn').addEventListener('click', () => {downloadProto(getLevel())});
document.getElementById('empty-btn').addEventListener( 'click', () => {openJSON('level_data/json_files/empty.json')});
document.getElementById('the-index-btn').addEventListener('click', () => {openProto('level_data/the-index.level')});
document.getElementById('all-objects-btn').addEventListener('click', () => {openProto('level_data/cheat-sheet-6.level')});
document.getElementById('mirror-x-btn').addEventListener('click', () => {mirror('x')});
document.getElementById('mirror-y-btn').addEventListener('click', () => {mirror('y')});
document.getElementById('mirror-z-btn').addEventListener('click', () => {mirror('z')});
document.getElementById('unlock-btn').addEventListener('click', unlockLevel);
document.getElementById('openvr-btn').addEventListener('click', () => {
    renderer.xr.enabled = true;
    renderer.setAnimationLoop( function () {
        renderer.render( scene, camera );
    } );
    vrButton.click()
});
// links
document.getElementById('slindev-btn').addEventListener('click', () => {window.open("https://discord.slin.dev", "_blank")});
document.getElementById('email-btn').addEventListener('click', () => {location.href = "mailto:twhlynch.index@gmail.com"});
document.getElementById('discord-btn').addEventListener('click', () => {window.open("https://discordapp.com/users/649165311257608192", "_blank")});
document.getElementById('server-btn').addEventListener('click', () => {window.open("https://twhlynch.me/discord", "_blank")});
document.getElementById('cheat-btn').addEventListener('click', () => {window.open("cheat-sheet.html", "_blank")});
// hidden inputs
document.getElementById('pc-btn').addEventListener('click', () => {document.getElementById('pc-btn-input').click()});
document.getElementById('pcjson-btn').addEventListener('click', () => {document.getElementById('pcjson-btn-input').click()});
document.getElementById('insertpc-btn').addEventListener('click', () => {document.getElementById('insertpc-btn-input').click()});
document.getElementById('image-btn').addEventListener('click', () => {document.getElementById('image-btn-input').click()});
document.getElementById('pointcloud-btn').addEventListener('click', () => {document.getElementById('pointcloud-btn-input').click()});
document.getElementById('pointcloud-btn-input').addEventListener('change', (e) => {openPointCloud(e.target.files[0])});
document.getElementById('wireframe-btn').addEventListener('click', () => {document.getElementById('wireframe-btn-input').click()});
document.getElementById('wireframe-btn-input').addEventListener('change', (e) => {openWireframe(e.target.files[0])});
document.getElementById('pc-btn-input').addEventListener('change', (e) => {openLevelFile(e.target.files)});
document.getElementById('pcjson-btn-input').addEventListener('change', (e) => {openJSONFile(e.target.files[0])});
document.getElementById('insertpc-btn-input').addEventListener('change', (e) => {appendLevelFile(e.target.files)});
document.getElementById('editing-container').addEventListener('drop', handleDrop, false);

// set ambience
document.getElementById('clearambience-btn').addEventListener('click', () => {setAmbience({"r": 0,"g": 0,"b": 0,"a": 1}, {"r": 0,"g": 0,"b": 0,"a": 1},0,0,0,0)});
document.getElementById('maxambience-btn').addEventListener('click', () => {setAmbience({"r": 32000,"g": 32000,"b": 32000,"a": 1}, {"r": 32000,"g": 32000,"b": 32000,"a": 1},32000,32000,32000,32000)});
document.getElementById('minambience-btn').addEventListener('click', () => {setAmbience({"r": -32000,"g": -32000,"b": -32000,"a": 1}, {"r": -32000,"g": -32000,"b": -32000,"a": 1},-32000,-32000,-32000,-32000)});
document.getElementById('fireambience-btn').addEventListener('click', () => {setAmbience({"a": 1}, {"r": 999999,"g": 982082.8125,"b": 949219.75,"a": 1},88.97185516357422,315,99999,0.7152965068817139)});
document.getElementById('bitiambience-btn').addEventListener('click', () => {setAmbience({"g": 0.16071408987045288,"b": 0.2620195746421814,"a": 1}, {"r": 0.998467206954956,"g": 0.997838020324707,"b": 0.9967743158340454,"a": 1},35999997952,360,0.66828852891922,10)});
document.getElementById('oilcanambience-btn').addEventListener('click', () => {setAmbience({"r": 0.3706502318382263,"g": 0.2603767216205597,"b": 0.6742851734161377,"a": 1}, {"g": 1.0326478481292725,"b": 5,"a": 1},-270,315,1.5,0)});
document.getElementById('randomambience-btn').addEventListener('click', () => {setAmbience({"r": Math.floor(Math.random() * 19999999999) - 9999999999,"g": Math.floor(Math.random() * 19999999999) - 9999999999,"b": Math.floor(Math.random() * 19999999999) - 9999999999,"a": 1}, {"r": Math.floor(Math.random() * 19999999999) - 9999999999,"g": Math.floor(Math.random() * 19999999999) - 9999999999,"b": Math.floor(Math.random() * 19999999999) - 9999999999,"a": 1},Math.floor(Math.random() * 19999999999) - 9999999999,Math.floor(Math.random() * 19999999999) - 9999999999,Math.floor(Math.random() * 19999999999) - 9999999999,Math.floor(Math.random() * 19999999999) - 9999999999)});
document.getElementById('defaultambience-btn').addEventListener('click', () => {setAmbience({"r": 0.28,"g": 0.476,"b": 0.73,"a": 1}, {"r": 0.916,"g": 0.9574,"b": 0.9574,"a": 1}, 45, 315, 1, 0)});
// insert nodes
document.getElementById('nodeStatic-btn').addEventListener('click', () => {appendJSON("level_data/json_files/static-node.json")});
document.getElementById('nodeAnimated-btn').addEventListener('click', () => {appendJSON("level_data/json_files/animated-node.json")});
document.getElementById('nodeCrumbling-btn').addEventListener('click', () => {appendJSON("level_data/json_files/crumbling-node.json")});
document.getElementById('nodeColored-btn').addEventListener('click', () => {appendJSON("level_data/json_files/colored-node.json")});
document.getElementById('nodeSign-btn').addEventListener('click', () => {appendJSON("level_data/json_files/sign-node.json")});
document.getElementById('nodeStart-btn').addEventListener('click', () => {appendJSON("level_data/json_files/start-node.json")});
document.getElementById('nodeFinish-btn').addEventListener('click', () => {appendJSON("level_data/json_files/finish-node.json")});
document.getElementById('nodeGravity-btn').addEventListener('click', () => {appendJSON("level_data/json_files/gravity-node.json")});
document.getElementById('nodeInvisible-btn').addEventListener('click', () => {appendJSON("level_data/json_files/invisible-node.json")});
// insert prefabs
document.getElementById('HighGravity-btn').addEventListener('click', () => {appendJSON("level_data/json_files/high-gravity.json")});
document.getElementById('Parallelograms-btn').addEventListener('click', () => {appendJSON("level_data/json_files/parallelograms.json")});
document.getElementById('BreakTimes-btn').addEventListener('click', () => {appendJSON("level_data/json_files/break-times.json")});
document.getElementById('FreeStartFinish-btn').addEventListener('click', () => {appendJSON("level_data/json_files/free-start-finish.json")});
document.getElementById('TexturedSigns-btn').addEventListener('click', () => {appendJSON("level_data/json_files/textured-signs.json")});
document.getElementById('SpecialStones-btn').addEventListener('click', () => {appendJSON("level_data/json_files/special-stones.json")});
document.getElementById('NoHitbox-btn').addEventListener('click', () => {appendJSON("level_data/json_files/no-hitbox.json")});
document.getElementById('Inverted-btn').addEventListener('click', () => {appendJSON("level_data/json_files/inverted.json")});