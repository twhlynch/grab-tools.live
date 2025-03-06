import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.145.0/examples/jsm/webxr/VRButton.min.js";
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import * as SHADERS from './shaders.js';
let templatesFile = await fetch('/level_data/templates.json').then(response => response.json());
let templates = await templatesFile.templates;
let inserts = templatesFile.inserts;
let protobufData = await fetch('/proto/proto.proto').then(response => response.text());
let animationPresets = templates.animations;
// editor
let renderer, scene;
let raycaster, mouse, lastSelected, selected, editing, vrButton;
let decoder = new TextDecoder();
//adb
let webusb, adb, shell, sync = null;
// objects
let camera, light, sun;
//nodes
let objects = [];
let animatedObjects = [];
let shapes = [];
// materials
let startMaterial, finishMaterial, skyMaterial, signMaterial, neonMaterial, triggerMaterial;
let materials = [];
let objectMaterials = [];
let exportMaterials = [];
//text
let textMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
const fontLoader = new FontLoader();
let font;
// controls
let controls, fly, transformControl;
// development modes
let devModes = {
    objects: [],
    active: undefined,
    placeLobbyMenu: false,
    placeCollectible: false,
};
let devRaycaster, devTransform;
// loaders
let loader = new GLTFLoader();
let loadedPercentage = 0;
// ambience
let sunAngle, sunAltitude, horizonColor, sky;
let editAmbienceSettings;
let fogEnabled = 1.0;
// paths
let materialList = [
    '/img/textures/default.png',
    '/img/textures/grabbable.png',
    '/img/textures/ice.png',
    '/img/textures/lava.png',
    '/img/textures/wood.png',
    '/img/textures/grapplable.png',
    '/img/textures/grapplable_lava.png',
    '/img/textures/grabbable_crumbling.png',
    '/img/textures/default_colored.png',
    '/img/textures/bouncing.png',
    '/img/textures/snow.png',
    '/img/textures/default.png'
];
let shapeList = [
    'models/editor/cube.glb',
    'models/editor/sphere.glb',
    'models/editor/cylinder.glb',
    'models/editor/pyramid.glb',
    'models/editor/prism.glb',
    'models/editor/cone.glb',
    'models/editor/sign.glb',
    'models/editor/start_end.glb'
];
// toggles
let hideText = false;
let highlightText = true;
let showGroups = false;
let showAnimations = false;
let showTriggerPaths = false;
let enableEditing = false;
let playAnimations = true;
// animations
let animationTime = 0.0;
let animationSpeed = 1.0;
let clock = new THREE.Clock();
// terminal
let lastRan = '';
let oldText = '';

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
const statsSnowElement = document.getElementById('stats-snow');
const statsIceElement = document.getElementById('stats-ice');
const statsWoodElement = document.getElementById('stats-wood');
const statsCubeElement = document.getElementById('stats-cube');
const statsConeElement = document.getElementById('stats-cone');
const statsSphereElement = document.getElementById('stats-sphere');
const statsCylinderElement = document.getElementById('stats-cylinder');
const statsPyramidElement = document.getElementById('stats-pyramid');
const statsPrismElement = document.getElementById('stats-prism');
const loaderText = document.getElementById('loader-text');
const loaderContainer = document.getElementById('loader');
incrementLoader(10);

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function runOnObjects(objects, func, doGroups = true) {
    objects.forEach((object) => {
        let isGroup = node?.userData?.grabNodeData?.levelNodeGroup ? true : false;
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
            node.levelNodeStatic.color1 ? {} : node.levelNodeStatic.color1 = {};
            node.levelNodeStatic.color1.r ? {} : node.levelNodeStatic.color1.r = 0;
            node.levelNodeStatic.color1.g ? {} : node.levelNodeStatic.color1.g = 0;
            node.levelNodeStatic.color1.b ? {} : node.levelNodeStatic.color1.b = 0;
        }
    });

    let tempNodes = level.levelNodes;
    delete level.levelNodes;
    level.levelNodes = tempNodes;

    editInputElement.innerText = JSON.stringify(level, null, 4);
    highlightTextEditor();
}
function JsonToHighlightedText(json) {
    let stringified = json;
    if (typeof json !== 'string') {
        stringified = JSON.stringify(json, null, 4);
    }
    // color shadows
    let highlightedText = stringified.replace(/"color(1|2)":\s*{\s*("r":\s*(\d+(?:\.\d+)?),)?\s*("g":\s*(\d+(?:\.\d+)?),)?\s*("b":\s*(\d+(?:\.\d+)?),)?\s*("a":\s*\d+(?:\.\d+)?)?\s*}/, (match) => {
        let jsonData = JSON.parse(`{${match}}`);
        let color = `rgba(${(jsonData.color1.r || 0) * 255}, ${(jsonData.color1.g || 0) * 255}, ${(jsonData.color1.b || 0) * 255}, 0.3)`;
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
            case 10:
                return `<span style="background-image: url(/img/textures/snow.png); background-size: contain">${match}</span>`;
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
    incrementLoader(10);
}
function loadTexture(path) {
    return new Promise((resolve) => {
        const texture = new THREE.TextureLoader().load(path, function (texture) {
            resolve(texture);
        });
    });
}
function loadModel(path) {
    return new Promise((resolve) => {
        loader.load(path, function (gltf) {
            let object = gltf.scene.children[0];
            object.geometry.scale(-1, 1, -1);
            resolve(object);
        });
    });
}
function refreshScene() {
    console.log('Refreshing');
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
        snow: 0,
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
        cone: 0,
        danger: false
    };
    objects = [];
    animatedObjects = [];
    scene.clear();


    let ambience = levelData.ambienceSettings;
    if (ambience) {
        if (ambience.skyHorizonColor) {
            ambience.skyHorizonColor?.r ? null : ambience.skyHorizonColor.r = 0;
            ambience.skyHorizonColor?.g ? null : ambience.skyHorizonColor.g = 0;
            ambience.skyHorizonColor?.b ? null : ambience.skyHorizonColor.b = 0;
        } else {
            ambience.skyHorizonColor = { r: 0, g: 0, b: 0 };
        }
        if (ambience.skyZenithColor) {
            ambience.skyZenithColor?.r ? null : ambience.skyZenithColor.r = 0;
            ambience.skyZenithColor?.g ? null : ambience.skyZenithColor.g = 0;
            ambience.skyZenithColor?.b ? null : ambience.skyZenithColor.b = 0;
        } else {
            ambience.skyZenithColor = { r: 0, g: 0, b: 0 };
        }
        ambience.sunAltitude ? null : ambience.sunAltitude = 0;
        ambience.sunAzimuth ? null : ambience.sunAzimuth = 0;
        ambience.sunSize ? null : ambience.sunSize = 0;
        ambience.fogDensity ? null : ambience.fogDensity = 0;
        
        if (!skyMaterial) {
            skyMaterial = new THREE.ShaderMaterial();
            skyMaterial.vertexShader = SHADERS.skyVS;
            skyMaterial.fragmentShader = SHADERS.skyFS;
            skyMaterial.flatShading = false;
            skyMaterial.depthWrite = false;
            skyMaterial.side = THREE.BackSide;
        }

        sunAngle = new THREE.Euler(THREE.MathUtils.degToRad(ambience.sunAltitude), THREE.MathUtils.degToRad(ambience.sunAzimuth + 180), 0.0);
        
        skyMaterial.uniforms["cameraFogColor0"] = { value: [ambience.skyHorizonColor.r, ambience.skyHorizonColor.g, ambience.skyHorizonColor.b] }
        skyMaterial.uniforms["cameraFogColor1"] = { value: [ambience.skyZenithColor.r, ambience.skyZenithColor.g, ambience.skyZenithColor.b] }
        skyMaterial.uniforms["sunSize"] = { value: ambience.sunSize }
        
        sunAltitude = ambience.sunAltitude
        horizonColor = [ambience.skyHorizonColor.r, ambience.skyHorizonColor.g, ambience.skyHorizonColor.b]
    } else {
        ambience = {
            "skyZenithColor": {
                "r": 0,
                "g": 0,
                "b": 0,
                "a": 1
            },
            "skyHorizonColor": {
                "r": 0,
                "g": 0,
                "b": 0,
                "a": 1
            },
            "sunAltitude": 0,
            "sunAzimuth": 0,
            "sunSize": 0,
            "fogDensity": 0
        }
        skyMaterial.uniforms["cameraFogColor0"] = { value: [0.916, 0.9574, 0.9574] }
        skyMaterial.uniforms["cameraFogColor1"] = { value: [0.28, 0.476, 0.73] }
        skyMaterial.uniforms["sunSize"] = { value: 1.0 }
    }

    const sunDirection = new THREE.Vector3( 0, 0, 1 );
    sunDirection.applyEuler(sunAngle);

    const skySunDirection = sunDirection.clone()
    skySunDirection.x = skySunDirection.x;
    skySunDirection.y = skySunDirection.y;
    skySunDirection.z = skySunDirection.z;

    let sunColorFactor = 1.0 - sunAltitude / 90.0
    sunColorFactor *= sunColorFactor
    sunColorFactor = 1.0 - sunColorFactor
    sunColorFactor *= 0.8
    sunColorFactor += 0.2
    let sunColor = [horizonColor[0] * (1.0 - sunColorFactor) + sunColorFactor, horizonColor[1] * (1.0 - sunColorFactor) + sunColorFactor, horizonColor[2] * (1.0 - sunColorFactor) + sunColorFactor]

    skyMaterial.uniforms["sunDirection"] = { value: skySunDirection }
    skyMaterial.uniforms["sunColor"] = { value: sunColor }

    sky = new THREE.Mesh(shapes[1].geometry, skyMaterial);
    
    sky.frustumCulled = false
    sky.renderOrder = 1000
    scene.add(sky);

    function updateMaterial(material) {
        let density = 0.0
        if(ambience)
        {
            material.uniforms["cameraFogColor0"] = { value: [ambience.skyHorizonColor.r, ambience.skyHorizonColor.g, ambience.skyHorizonColor.b] }
            material.uniforms["cameraFogColor1"] = { value: [ambience.skyZenithColor.r, ambience.skyZenithColor.g, ambience.skyZenithColor.b] }
            material.uniforms["sunSize"] = { value: ambience.sunSize }
            density = ambience.fogDensity;
        }
        else
        {
            material.uniforms["cameraFogColor0"] = { value: [0.916, 0.9574, 0.9574] }
            material.uniforms["cameraFogColor1"] = { value: [0.28, 0.476, 0.73] }
            material.uniforms["sunSize"] = { value: 1.0 }
        }

        material.uniforms["sunDirection"] = { value: skySunDirection }
        material.uniforms["sunColor"] = { value: sunColor }

        let densityFactor = density * density * density * density
        let fogDensityX = 0.5 * densityFactor + 0.000001 * (1.0 - densityFactor)
        let fogDensityY = 1.0/(1.0 - Math.exp(-1500.0 * fogDensityX))

        material.uniforms["cameraFogDistance"] = { value: [fogDensityX, fogDensityY] }
			
    }

    for (let material of materials) {
        updateMaterial(material);
    }
    for (let material of objectMaterials) {
        updateMaterial(material);
    }

    editAmbienceSettings = {
        skyZenithColorR: ambience.skyZenithColor.r,
        skyZenithColorG: ambience.skyZenithColor.g,
        skyZenithColorB: ambience.skyZenithColor.b,
        skyHorizonColorR: ambience.skyHorizonColor.r,
        skyHorizonColorG: ambience.skyHorizonColor.g,
        skyHorizonColorB: ambience.skyHorizonColor.b,
        sunAltitude: ambience.sunAltitude,
        sunAzimuth: ambience.sunAzimuth,
        sunSize: ambience.sunSize,
        fogDensity: ambience.fogDensity,
    };
    
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
        statistics.snow += nodeStatistics.snow;
        statistics.ice += nodeStatistics.ice;
        statistics.wood += nodeStatistics.wood;
        statistics.cube += nodeStatistics.cube;
        statistics.sphere += nodeStatistics.sphere;
        statistics.cylinder += nodeStatistics.cylinder;
        statistics.pyramid += nodeStatistics.pyramid;
        statistics.prism += nodeStatistics.prism;
        statistics.cone += nodeStatistics.cone;
        nodeStatistics.danger ? statistics.danger = true : null;
    });

    if (showTriggerPaths) {
        addTriggerPaths();
    }
    
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
    statsSnowElement.innerText = `Snow: ${statistics.snow}`;
    statsIceElement.innerText = `Ice: ${statistics.ice}`;
    statsWoodElement.innerText = `Wood: ${statistics.wood}`;
    statsCubeElement.innerText = `Cube: ${statistics.cube}`;
    statsSphereElement.innerText = `Sphere: ${statistics.sphere}`;
    statsCylinderElement.innerText = `Cylinder: ${statistics.cylinder}`;
    statsPyramidElement.innerText = `Pyramid: ${statistics.pyramid}`;
    statsPrismElement.innerText = `Prism: ${statistics.prism}`;
    statsConeElement.innerText = `Cone: ${statistics.cone}`;

    typeWarningElement.style.display = statistics.danger ? 'block' : 'none';

    // renderContainerElement.style.backgroundImage = `linear-gradient(rgb(${sky[0][0]}, ${sky[0][1]}, ${sky[0][2]}), rgb(${sky[1][0]}, ${sky[1][1]}, ${sky[1][2]}), rgb(${sky[0][0]}, ${sky[0][1]}, ${sky[0][2]}))`;
    console.log('Refreshed', scene, objects, animatedObjects);
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
        snow: 0,
        // special attributes
        neon: 0,
        gravityNoLegs: 0,
        // shapes
        cube: 0,
        sphere: 0,
        cylinder: 0,
        pyramid: 0,
        prism: 0,
        cone: 0,
        danger: false
    };
    if (node.levelNodeGroup) {
        object = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0 })
        );
        objects.push( object );
        parent.add( object );
        object.position.x = node.levelNodeGroup.position.x || 0;
        object.position.y = node.levelNodeGroup.position.y || 0;
        object.position.z = node.levelNodeGroup.position.z || 0;
        object.scale.x = node.levelNodeGroup.scale.x || 0;
        object.scale.y = node.levelNodeGroup.scale.y || 0;
        object.scale.z = node.levelNodeGroup.scale.z || 0;
        object.quaternion.x = node.levelNodeGroup.rotation.x || 0;
        object.quaternion.y = node.levelNodeGroup.rotation.y || 0;
        object.quaternion.z = node.levelNodeGroup.rotation.z || 0;
        object.quaternion.w = node.levelNodeGroup.rotation.w || 0;
        
        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

        if (node.levelNodeGroup.childNodes) {
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
                statistics.snow += childNodeStatistics.snow;
                statistics.ice += childNodeStatistics.ice;
                statistics.wood += childNodeStatistics.wood;
                statistics.cube += childNodeStatistics.cube;
                statistics.sphere += childNodeStatistics.sphere;
                statistics.cylinder += childNodeStatistics.cylinder;
                statistics.pyramid += childNodeStatistics.pyramid;
                statistics.prism += childNodeStatistics.prism;
                statistics.cone += childNodeStatistics.cone;
                childNodeStatistics.danger ? statistics.danger = true : null;
            });
        }

        statistics.groups += 1;
        statistics.objects -= 1;

        if (showGroups) {
            object.material.transparent = false;
            let groupBoundingBox = new THREE.Box3().setFromObject(object);
            let geometry = new THREE.BoxGeometry(
                groupBoundingBox.max.z - groupBoundingBox.min.z,
                groupBoundingBox.max.y - groupBoundingBox.min.y,
                groupBoundingBox.max.x - groupBoundingBox.min.x
            );
            object.geometry = geometry;
        }

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
        object = shapes[Math.max(0, Math.min((node.levelNodeStatic.shape || 1000) - 1000, shapes.length - 1))].clone();
        let material = materials[Math.max(0, Math.min(node.levelNodeStatic.material || 0, materials.length - 1))].clone();
        if (node.levelNodeStatic.material == 8) {
            node.levelNodeStatic.color1 ? {} : node.levelNodeStatic.color1 = {};
            node.levelNodeStatic.color1.r ? null : node.levelNodeStatic.color1.r = 0;
            node.levelNodeStatic.color1.g ? null : node.levelNodeStatic.color1.g = 0;
            node.levelNodeStatic.color1.b ? null : node.levelNodeStatic.color1.b = 0;
            
            material.uniforms.diffuseColor.value = [node.levelNodeStatic.color1.r, node.levelNodeStatic.color1.g, node.levelNodeStatic.color1.b];
            
            let specularFactor = Math.sqrt(node.levelNodeStatic.color1.r * node.levelNodeStatic.color1.r + node.levelNodeStatic.color1.g * node.levelNodeStatic.color1.g + node.levelNodeStatic.color1.b * node.levelNodeStatic.color1.b) * 0.15;
            let specularColor = [specularFactor, specularFactor, specularFactor, 16.0];
            if (node.levelNodeStatic.color2) {
                specularColor = [
                    node.levelNodeStatic.color2.r || specularFactor, 
                    node.levelNodeStatic.color2.g || specularFactor, 
                    node.levelNodeStatic.color2.b || specularFactor, 
                    node.levelNodeStatic.color2.a
                ];
            }
            material.uniforms.specularColor.value = specularColor;
            
            if (node.levelNodeStatic.isNeon) {
                statistics.neon += 1;
                material.uniforms.neonEnabled.value = 1.0;
            }
            if (node.levelNodeStatic.isTransparent) {
                material.uniforms.isTransparent.value = 1.0
                material.transparent = true;
            }
        } else if (node.levelNodeStatic.material == 3) {
            
            material.uniforms.isLava.value = 1.0;
            if (node.levelNodeStatic.color1 && node.levelNodeStatic.color2) {
                material.uniforms.diffuseColor.value = [node.levelNodeStatic.color1?.r || 0, node.levelNodeStatic.color1?.g || 0, node.levelNodeStatic.color1?.b || 0]
                let specularFactor = Math.sqrt(node.levelNodeStatic.color1?.r || 0 * node.levelNodeStatic.color1?.r || 0 + node.levelNodeStatic.color1?.g || 0 * node.levelNodeStatic.color1?.g || 0 + node.levelNodeStatic.color1?.b || 0 * node.levelNodeStatic.color1?.b || 0) * 0.15;
                let specularColor = [specularFactor, specularFactor, specularFactor, 16.0];
                if (node.levelNodeStatic.color2) {
                    specularColor = [
                        node.levelNodeStatic.color2.r || 0,
                        node.levelNodeStatic.color2.g || 0, 
                        node.levelNodeStatic.color2.b || 0, 
                        node.levelNodeStatic.color2.a || 0
                    ];
                    material.uniforms.isColoredLava.value = 1.0;
                }
                material.uniforms.specularColor.value = specularColor;
            }
            if (node.levelNodeStatic.isTransparent) {
                material.uniforms.isTransparent.value = 1.0
                material.transparent = true;
            }
            
        }
        object.material = material;
        parent.add(object);
        object.position.x = node.levelNodeStatic.position.x || 0;
        object.position.y = node.levelNodeStatic.position.y || 0;
        object.position.z = node.levelNodeStatic.position.z || 0;
        object.quaternion.w = node.levelNodeStatic.rotation.w || 0;
        object.quaternion.x = node.levelNodeStatic.rotation.x || 0;
        object.quaternion.y = node.levelNodeStatic.rotation.y || 0;
        object.quaternion.z = node.levelNodeStatic.rotation.z || 0;
        object.scale.x = node.levelNodeStatic.scale.x || 0;
        object.scale.y = node.levelNodeStatic.scale.y || 0;
        object.scale.z = node.levelNodeStatic.scale.z || 0;

        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

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
            case 1005:
                statistics.cone += 1;
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
            case 10:
                statistics.snow += 1;
                break;
            default:
                statistics.danger = true;
                break;
        }
    } else if (node.levelNodeCrumbling) {
        object = shapes[Math.max(0, Math.min((node.levelNodeCrumbling.shape || 1000) - 1000, shapes.length - 1))].clone();
        let material = materials[7].clone();
        object.material = material;
        parent.add(object);
        object.position.x = node.levelNodeCrumbling.position.x || 0;
        object.position.y = node.levelNodeCrumbling.position.y || 0;
        object.position.z = node.levelNodeCrumbling.position.z || 0;
        object.quaternion.w = node.levelNodeCrumbling.rotation.w || 0;
        object.quaternion.x = node.levelNodeCrumbling.rotation.x || 0;
        object.quaternion.y = node.levelNodeCrumbling.rotation.y || 0;
        object.quaternion.z = node.levelNodeCrumbling.rotation.z || 0;
        object.scale.x = node.levelNodeCrumbling.scale.x || 0;
        object.scale.y = node.levelNodeCrumbling.scale.y || 0;
        object.scale.z = node.levelNodeCrumbling.scale.z || 0;

        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

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
            case 1005:
                statistics.cone += 1;
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
            case 10:
                statistics.snow += 1;
                break;
            default:
                statistics.danger = true;
                break;
        }
    } else if (node.levelNodeSign) {
        object = shapes[shapes.length - 2].clone();
        object.material = materials[4];
        parent.add(object);
        object.position.x = node.levelNodeSign.position.x || 0;
        object.position.y = node.levelNodeSign.position.y || 0;
        object.position.z = node.levelNodeSign.position.z || 0;
        object.quaternion.w = node.levelNodeSign.rotation.w || 0;
        object.quaternion.x = node.levelNodeSign.rotation.x || 0;
        object.quaternion.y = node.levelNodeSign.rotation.y || 0;
        object.quaternion.z = node.levelNodeSign.rotation.z || 0;
        
        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();
        
        objects.push(object);

        const signText = node.levelNodeSign.text || "";
        const words = signText.split(" ");
        let text = "";
        for (let i = 0; i < words.length; i++) {
            if ((i + 1) % 3 == 0) {
                text += words[i] + "\n";
            } else {
                text += words[i] + " ";
            }
        }

        let textGeo = new TextGeometry(text, {
            font: font,
            size: 1,
            depth: -1,
            curveSegments: 4,
            bevelThickness: 0,
            bevelSize: 0,
            bevelEnabled: false
        });

        textGeo.scale(0.05, 0.05, 0.0000001);
        textGeo.computeBoundingBox();
        const centerOffsetX = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );
        const centerOffsetY = 0.5 * ( textGeo.boundingBox.max.y - textGeo.boundingBox.min.y );
        textGeo.translate( centerOffsetX, centerOffsetY, 0.03 );
        const textMesh = new THREE.Mesh( textGeo, textMaterial );

        object.add(textMesh);

        let characters = node.levelNodeSign?.text?.length || 0;

        statistics.complexity = 5;
        statistics.characters = characters;
        statistics.sign += 1;
    } else if (node.levelNodeStart) {
        object = shapes[shapes.length - 1].clone();
        object.material = startMaterial;
        parent.add(object);
        object.position.x = node.levelNodeStart.position.x || 0;
        object.position.y = node.levelNodeStart.position.y || 0;
        object.position.z = node.levelNodeStart.position.z || 0;
        object.quaternion.w = node.levelNodeStart.rotation.w || 0;
        object.quaternion.x = node.levelNodeStart.rotation.x || 0;
        object.quaternion.y = node.levelNodeStart.rotation.y || 0;
        object.quaternion.z = node.levelNodeStart.rotation.z || 0;
        object.scale.x = node.levelNodeStart.radius || 0;
        object.scale.z = node.levelNodeStart.radius || 0;

        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

        objects.push(object);

        statistics.start += 1;
    } else if (node.levelNodeFinish) {
        object = shapes[shapes.length - 1].clone();
        object.material = finishMaterial;
        parent.add(object);
        object.position.x = node.levelNodeFinish.position.x || 0;
        object.position.y = node.levelNodeFinish.position.y || 0;
        object.position.z = node.levelNodeFinish.position.z || 0;
        object.scale.x = node.levelNodeFinish.radius || 0;
        object.scale.z = node.levelNodeFinish.radius || 0;

        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

        objects.push(object);
        statistics.end += 1;
    } else if (node.levelNodeTrigger) {
        object = shapes[Math.max(0, Math.min((node.levelNodeTrigger.shape || 1000) - 1000, shapes.length - 1))].clone();
        let material = triggerMaterial.clone();
        object.material = material;
        parent.add(object);
        object.position.x = node.levelNodeTrigger.position.x || 0;
        object.position.y = node.levelNodeTrigger.position.y || 0;
        object.position.z = node.levelNodeTrigger.position.z || 0;
        object.quaternion.w = node.levelNodeTrigger.rotation.w || 0;
        object.quaternion.x = node.levelNodeTrigger.rotation.x || 0;
        object.quaternion.y = node.levelNodeTrigger.rotation.y || 0;
        object.quaternion.z = node.levelNodeTrigger.rotation.z || 0;
        object.scale.x = node.levelNodeTrigger.scale.x || 0;
        object.scale.y = node.levelNodeTrigger.scale.y || 0;
        object.scale.z = node.levelNodeTrigger.scale.z || 0;

        object.initialPosition = object.position.clone();
        object.initialRotation = object.quaternion.clone();

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

        objects.push(object);
        statistics.complexity = 3;
        statistics.crumbling += 1;
        switch (node.levelNodeTrigger.shape) {
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
            case 1005:
                statistics.cone += 1;
                break;
            default:
                statistics.danger = true;
                break;
        }
        switch (node.levelNodeTrigger?.material) {
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
            case 10:
                statistics.snow += 1;
                break;
            default:
                statistics.danger = true;
                break;
        }
    } 
    let animationPath = undefined;
    let animationPoints = [];
    if (object !== undefined) {
        object.userData.grabNodeData = node;
        object.userData.initialGrabNodeData = deepClone(node);
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
                
                if (showAnimations) {
                    animationPoints.push( new THREE.Vector3( 
                        frame.position.x,
                        frame.position.y,
                        frame.position.z
                    ) );
                }
            }
            if (showAnimations) {
                const pathMaterial = new THREE.LineBasicMaterial({
                    color: 0x0000ff
                });

                const pointsMaterial = new THREE.PointsMaterial({
                    color: 0x0000ff,
                    size: 3,
                    sizeAttenuation: false
                });
                
                const lineGeometry = new THREE.BufferGeometry().setFromPoints( animationPoints );
                const pointsGeometry = new THREE.BufferGeometry().setFromPoints(animationPoints);
                
                const line = new THREE.Line( lineGeometry, pathMaterial );
                line.rotation.copy(object.rotation);
                line.position.copy(object.position);
                parent.add( line );

                const points = new THREE.Points(pointsGeometry, pointsMaterial);
                points.rotation.copy(object.rotation);
                points.position.copy(object.position);
                parent.add(points);

                object.animationPath = {points, line};
            }
            object.animation = node.animations[0]
            object.animation.currentFrameIndex = 0
            animatedObjects.push(object)
            statistics.animations += 1;
        }
    }
    return statistics;
}
function addTriggerPaths() {
    for (const object of objects) {
        const objectData = object.userData?.grabNodeData;
        if (objectData?.levelNodeTrigger) {
            object.userData.triggerPaths = [];
            for (let target of objectData.levelNodeTrigger.triggerTargets || []) {
                let targetObject = objects[target.triggerTargetAnimation?.objectID || 0];
                let objectPosition = new THREE.Vector3();
                let targetPosition = new THREE.Vector3();
                object.getWorldPosition(objectPosition);
                targetObject.getWorldPosition(targetPosition);
                const triggerPoints = [
                    objectPosition,
                    targetPosition
                ];

                const pathMaterial = new THREE.LineBasicMaterial({
                    color: 0xff8800
                });

                const lineGeometry = new THREE.BufferGeometry().setFromPoints( triggerPoints );

                const line = new THREE.Line( lineGeometry, pathMaterial );
                scene.add( line );

                object.userData.triggerPaths.push(line);
            }
        }
    }
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
            let webhookUrl = 'https://grab-tools-logs.twhlynch.workers.dev';
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
function setExportMaterials(scene) {
    scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
            console.log(node);
            const grabNodeData = node.userData.grabNodeData;
            if (grabNodeData && (grabNodeData.levelNodeStatic || grabNodeData.levelNodeCrumbling)) {
                let type = Object.keys(grabNodeData)[0];
                let newMaterial = exportMaterials[Math.max(0, Math.min(grabNodeData[type].material || 0, exportMaterials.length - 1))].clone();

                let scale = Math.round(((node.scale?.x || 0) + (node.scale?.y || 0) + (node.scale?.z || 0)) / 3)
                newMaterial.map.wrapS = THREE.RepeatWrapping;
                newMaterial.map.wrapT = THREE.RepeatWrapping;
                newMaterial.map.repeat.set(scale, scale);

                if (grabNodeData[type].material == 8 || grabNodeData[type].material == 3) {
                    let color = new THREE.Color(
                        grabNodeData[type].color1?.r || 0,
                        grabNodeData[type].color1?.g || 0,
                        grabNodeData[type].color1?.b || 0
                    );
                    newMaterial.color = color;
                }

                node.material = newMaterial;
            }
        }
    });
}
function exportLevelAsGLTF()
{
	const exporter = new GLTFExporter();
    let clonedScene = scene.clone(true);

    setExportMaterials(clonedScene);

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
            console.log( error );

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
        camera.position.set(start.position.x, start.position.y + 1, start.position.z + 1);
        controls.target.set(start.position.x, start.position.y, start.position.z);
        camera.lookAt(start.position.x, start.position.y, start.position.z);
    }
}
function goToFinish() {
    let obj = getLevel();
    let finish = false;
    runOnNodes(obj.levelNodes, (node) => {
        if (node.hasOwnProperty("levelNodeFinish")) {
            finish = node.levelNodeFinish;
        }
    }, false);
    if (finish) {
        camera.position.set(finish.position.x, finish.position.y + 1, finish.position.z + 1);
        controls.target.set(finish.position.x, finish.position.y, finish.position.z);
        camera.lookAt(finish.position.x, finish.position.y, finish.position.z);
    }
}
function nullView() {
    camera.position.set(0, 1, 1);
    controls.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);
}
function mapView() {
    let obj = getLevel();
    let midpoint = new THREE.Vector3();
    let viewPosition = new THREE.Vector3();
    let min = new THREE.Vector3(Infinity, Infinity, Infinity);
    let max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    
    runOnNodes(obj.levelNodes, (node) => {

        let position = Object.values(node)[0]?.position || {x: 0, y: 0, z: 0};
        let positionVector = new THREE.Vector3((position.x || 0), (position.y || 0), (position.z || 0));

        max.max(positionVector);
        min.min(positionVector);

    }, false);

    midpoint.addVectors(max, min).divideScalar(2);
    viewPosition.addVectors(max, min).divideScalar(2);

    let size = new THREE.Vector3();
    size.subVectors(max, min);
    
    if (size.x > size.z) {
        viewPosition.z += size.x;
        viewPosition.y = size.x;
    } else {
        viewPosition.x += size.z;
        viewPosition.y = size.z;
    }

    camera.position.set(viewPosition.x, viewPosition.y, viewPosition.z);
    controls.target.set(midpoint.x, midpoint.y, midpoint.z);
    camera.lookAt(midpoint.x, midpoint.y, midpoint.z);

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
function setAmbience(skyZenithColor, skyHorizonColor, sunAltitude, sunAzimuth, sunSize, fogDensity) {
    let levelData = getLevel();
    levelData.ambienceSettings.skyZenithColor = skyZenithColor;
    levelData.ambienceSettings.skyHorizonColor = skyHorizonColor;
    levelData.ambienceSettings.sunAltitude = sunAltitude;
    levelData.ambienceSettings.sunAzimuth = sunAzimuth;
    levelData.ambienceSettings.sunSize = sunSize;
    levelData.ambienceSettings.fogDensity = fogDensity;
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
            let color = node.levelNodeStatic.color1;
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
            Object.values(node)[0].color1 = {
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
function unGroup(group) {
    let ungrouped = [];
    if (!group.levelNodeGroup) { return false; }
    for (let child of group.levelNodeGroup.childNodes) {
        let type = Object.keys(child)[0];
        if (child[type].position) {
            child[type].position.x = (child[type].position.x || 0) + (group.levelNodeGroup?.position?.x || 0);
            child[type].position.y = (child[type].position.y || 0) + (group.levelNodeGroup?.position?.y || 0);
            child[type].position.z = (child[type].position.z || 0) + (group.levelNodeGroup?.position?.z || 0);
        }
        let quaternion = new THREE.Quaternion();
        let groupQuaternion = new THREE.Quaternion();
        if (child[type].rotation) {
            quaternion.x = (child[type].rotation.x || 0);
            quaternion.y = (child[type].rotation.y || 0);
            quaternion.z = (child[type].rotation.z || 0);
            quaternion.w = (child[type].rotation.w || 0);
            groupQuaternion.x = (group.levelNodeGroup?.rotation?.x || 0);
            groupQuaternion.y = (group.levelNodeGroup?.rotation?.y || 0);
            groupQuaternion.z = (group.levelNodeGroup?.rotation?.z || 0);
            groupQuaternion.w = (group.levelNodeGroup?.rotation?.w || 0);
        }
        quaternion.multiplyQuaternions(quaternion, groupQuaternion);
        child[type].rotation = {
            x: quaternion.x,
            y: quaternion.y,
            z: quaternion.z,
            w: quaternion.w
        }
        if (child[type].scale) {
            child[type].scale.x = (child[type].scale.x || 0) * (group.levelNodeGroup?.scale?.x || 0);
            child[type].scale.y = (child[type].scale.y || 0) * (group.levelNodeGroup?.scale?.y || 0);
            child[type].scale.z = (child[type].scale.z || 0) * (group.levelNodeGroup?.scale?.z || 0);
        }
        if (child[type].radius) {
            child[type].radius = (child[type].radius || 0) * (group.levelNodeGroup?.scale?.x || 0);
        }
        ungrouped.push(deepClone(child));
    }
    return ungrouped;
}
function unGroupLevel() {
    let level = getLevel();
    if (level.levelNodes[0]?.levelNodeGroup) {
        let ungrouped = unGroup(level.levelNodes[0]);
        level.levelNodes = [...ungrouped];
    }
    setLevel(level);
}
function recursiveUnGroup(nodes) {
    let ungrouped = [...nodes];
    let done = [];
    let temps = [];
    while (true) {
        for (let node of ungrouped) {
            if (node.levelNodeGroup) {
                let ungroup = unGroup(node);
                for (let child of ungroup) {
                    temps.push(child);
                }
            } else {
                done.push(node);
            }
        }
        if (temps.length === 0) {
            break;
        }
        ungrouped = [...temps];
        temps = [];
    }
    return done;
}
function downgrade() {
 // TODO:
}
function outlineNode(node) {
    let size = document.getElementById('outline-prompt').value;
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
        outlineSize *= parseFloat(size);
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
                "color1": {
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
                "color1": color || nodeData.color1
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
function appendJSONNode(obj) {
    let level = getLevel();
    level.levelNodes.push(obj);
    setLevel(level);
}
function appendInsert(identifier) {
    appendJSONNode(inserts[identifier]);
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
    e.stopPropagation();
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
        e.preventDefault();
    }
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

    const text = dt.getData('text/plain');
    if (text && text.startsWith("https://grabvr.quest/levels")) {
        e.preventDefault();

        const urlParams = new URLSearchParams(text.split("?")[1]);
        const levelID = urlParams.get('level').replace('/', ':');

        const login_details = {
            "user_name": localStorage.getItem('user_name'),
            "user_id": localStorage.getItem('user_id')
        }
        if (login_details.user_name && login_details.user_id) {
            downloadAndOpenLevel(levelID);
        } else {
            const loginPromptElement = document.getElementById('loginPrompt');
            loginPromptElement.style.display = 'grid';
            loginPromptElement.addEventListener('click', () => {
                loginPromptElement.style.display = 'none';
            });
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
    if (object?.userData?.grabNodeData?.levelNodeGroup) {
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
    if (object?.userData?.grabNodeData?.levelNodeGroup) {
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
        let individualObjects = objects.filter(object=>{
            return object.userData.grabNodeData && !object.userData.grabNodeData.levelNodeGroup;
        });
        let intersects = raycaster.intersectObjects( individualObjects, true );
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
            if (!intersects[i].object.userData.grabNodeData) {
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
            console.log(editing);
            scene.add(transformControl);
        }
    }
    if (devModes.placeLobbyMenu) {
        if (e.which == 1) {
            let canvasSize = renderer.domElement.getBoundingClientRect();
            mouse.x = ( (e.clientX - canvasSize.left) / canvasSize.width ) * 2 - 1;
            mouse.y = - ( (e.clientY - canvasSize.top) / canvasSize.height ) * 2 + 1;
            devRaycaster.setFromCamera( mouse, camera );
            let individualObjects = objects.filter(object=>{
                return object.userData.grabNodeData && !object.userData.grabNodeData.levelNodeGroup;
            }).concat( devModes.objects );
            let intersects = devRaycaster.intersectObjects( individualObjects, true );
            if (intersects.length > 0) {
                let intersect = intersects[0];
                console.log(intersect);

                if (intersect.object.userData.isDevMode) {
                    devModes.active = intersect.object;
                    devTransform.attach( intersect.object );
                    scene.add(devTransform);
                    controls.enabled = false;
                } else {
                    let planeGeometry = new THREE.PlaneGeometry( 2.0, 2.0 );
                    let planeMaterial = new THREE.MeshBasicMaterial( { color: 0x719ec7 } );
                    let plane = new THREE.Mesh( planeGeometry, planeMaterial );
                    plane.userData.isDevMode = true;

                    let normal = intersect.face.normal;
                    let point = intersect.point;
                    let object = intersect.object;

                    plane.rotation.copy(object.rotation);
                    plane.position.copy(point).add( normal.multiplyScalar(0.01) );  
                    
                    plane.rotation.set(0, plane.rotation.y, 0);

                    scene.add( plane );
                    devModes.objects.push( plane );
                }
            }
        } else if (e.which == 3) {
            controls.enabled = true;
            devTransform.detach();
            devModes.active = undefined;
        }
    } else if (devModes.placeCollectible) {
        if (e.which == 1 && e.altKey) {
            let canvasSize = renderer.domElement.getBoundingClientRect();
            mouse.x = ( (e.clientX - canvasSize.left) / canvasSize.width ) * 2 - 1;
            mouse.y = - ( (e.clientY - canvasSize.top) / canvasSize.height ) * 2 + 1;
            devRaycaster.setFromCamera( mouse, camera );
            let individualObjects = objects.filter(object=>{
                return object.userData.grabNodeData && !object.userData.grabNodeData.levelNodeGroup;
            })
            let intersects = devRaycaster.intersectObjects( individualObjects, true );
            if (intersects.length > 0) {
                let intersect = intersects[0];
                console.log(intersect);

                let boxGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
                let boxMaterial = new THREE.MeshBasicMaterial( { color: 0xff7000 } );
                let box = new THREE.Mesh( boxGeometry, boxMaterial );
                box.userData.isDevMode = true;

                let point = intersect.point;
                point.y += 0.1;

                box.position.copy(point)

                scene.add( box );
                devModes.objects.push( box );
            
            }
        }
    }
}
function generateLevelFromObjects() {
    let levelNodes = [];
    objects.forEach(object => {
        if (object.parent.type == 'Scene') { //TODO: prevent
            if (object?.userData?.grabNodeData?.animations?.length > 0 && object.userData.grabNodeData.animations[0].currentFrameIndex) {
                delete object.userData.grabNodeData.animations[0].currentFrameIndex;
            }
            if (object?.userData?.grabNodeData?.levelNodeGroup) {
                runOnNodes(object.userData.grabNodeData.levelNodeGroup.childNodes, (node) => {
                    if (node?.animations?.length > 0 && node?.animations[0]?.currentFrameIndex) {
                        delete node.animations[0].currentFrameIndex;
                    }
                }, true);
            }
            levelNodes.push(object.userData.grabNodeData);
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
            if (object?.userData?.grabNodeData?.animations?.length > 0 && object.userData.grabNodeData.animations[0].currentFrameIndex) {
                delete object.userData.grabNodeData.animations[0].currentFrameIndex;
            }
            if (object?.userData?.grabNodeData?.levelNodeGroup) {
                runOnNodes(object.userData.grabNodeData.levelNodeGroup.childNodes, (node) => {
                    if (node?.animations?.length > 0 && node?.animations[0]?.currentFrameIndex) {
                        delete node.animations[0].currentFrameIndex;
                    }
                }, true);
            }
            let initialNode = object.userData.initialGrabNodeData;
            let currentNode = object.userData.grabNodeData;
            let initialPos = Object.values(initialNode)[0].position;
            let currentPos = Object.values(currentNode)[0].position;
            let initialRot = Object.values(initialNode)[0].rotation;
            let currentRot = Object.values(currentNode)[0].rotation;
            if (initialPos != currentPos || initialRot != currentRot) {
                if (!initialNode.animations || !initialNode.animations.length) {
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
                const changedRot = new THREE.Quaternion();
                const currentQuat = new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
                const initialQuat = new THREE.Quaternion(initialRot.x, initialRot.y, initialRot.z, initialRot.w);
                changedRot.multiply( 
                    currentQuat, 
                    initialQuat.invert() 
                );
                newFrame.rotation.x = changedRot.x;
                newFrame.rotation.y = changedRot.y;
                newFrame.rotation.z = changedRot.z;
                newFrame.rotation.w = changedRot.w;
                initialNode.animations[0].frames.push(newFrame);
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
    if (editing && !editing?.userData?.grabNodeData?.levelNodeGroup) {
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
                "childNodes": [editing.userData.grabNodeData]
            }
        };
        groupObject = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0})
        );
        if (showGroups) {
            groupObject.material.transparent = false;
            let groupBoundingBox = new THREE.Box3().setFromObject(groupObject);
            let geometry = new THREE.BoxGeometry(
                groupBoundingBox.max.z - groupBoundingBox.min.z,
                groupBoundingBox.max.y - groupBoundingBox.min.y,
                groupBoundingBox.max.x - groupBoundingBox.min.x
            );
            groupObject.geometry = geometry;
        }
        objects.push(groupObject);
        groupObject.userData.grabNodeData = groupData;
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
    if (editing && editing.parent.type == "Scene" && !editing?.userData?.grabNodeData?.levelNodeGroup) {
        let clone = editing.clone();
        clone.userData.grabNodeData = deepClone(editing.userData.grabNodeData);
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
    if (editing && editing.parent.type == "Scene" && !editing?.userData?.grabNodeData?.levelNodeGroup) {
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
        newMaterial.uniforms.diffuseColor.value = [nodeData?.color1?.r || 0, nodeData?.color1?.g || 0, nodeData?.color1?.b || 0];
        const specularFactor = Math.sqrt((nodeData?.color1?.r || 0) * (nodeData?.color1?.r || 0) + (nodeData?.color1?.g || 0) * (nodeData?.color1?.g || 0) + (nodeData?.color1?.b || 0) * (nodeData?.color1?.b || 0)) * 0.15
        newMaterial.uniforms.specularColor.value = [specularFactor, specularFactor, specularFactor, 16.0]   
    }

    newObject.material = newMaterial;
    newObject.userData.grabNodeData = shapeData;
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
        newMaterial.uniforms.diffuseColor.value = [nodeData?.color1?.r || 0, nodeData?.color1?.g || 0, nodeData?.color1?.b || 0];
        const specularFactor = Math.sqrt((nodeData?.color1?.r || 0) * (nodeData?.color1?.r || 0) + (nodeData?.color1?.g || 0) * (nodeData?.color1?.g || 0) + (nodeData?.color1?.b || 0) * (nodeData?.color1?.b || 0)) * 0.15
        newMaterial.uniforms.specularColor.value = [specularFactor, specularFactor, specularFactor, 16.0]    
    }

    newObject.material = newMaterial;
    newObject.userData.grabNodeData = shapeData;
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
    if (object.userData.grabNodeData.levelNodeGroup) {
        let childNodes = editing.userData.grabNodeData.levelNodeGroup.childNodes;
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
            if (child?.userData?.grabNodeData?.levelNodeGroup) {
                remakeGroup(shape, material, child);
            } else {
                objectsToRemake.push(child);
            }
        }
        for (let i = 0; i < objectsToRemake.length; i++) {
            remakeGroup(shape, material, objectsToRemake[i]);
        }
    } else {
        if (shape && (object.userData.grabNodeData.levelNodeStatic || object.userData.grabNodeData.levelNodeCrumbling)) {
            let shapeData = deepClone(object.userData.grabNodeData);
            remakeObject(material, shape, shapeData, object);
        }
        if (material && (object.userData.grabNodeData.levelNodeStatic)) {
            let shapeData = deepClone(object.userData.grabNodeData);
            remakeObject(material, shape, shapeData, object);
        }
    }
}
function editShape(shape) {
    if (
        editing && editing.parent.type == "Scene"
        && (editing.userDatagrabNodeData.levelNodeStatic || editing.userData.grabNodeData.levelNodeCrumbling)
    ) {
        let shapeData = deepClone(editing.userData.grabNodeData);
        let nodeData = Object.values(shapeData)[0];
        let material = nodeData.material || 0;
        remakeEditingObject(material, shape, shapeData);
        applyChangesElement.style.display = "block";
        applyChangesAsFrameElement.style.display = "block";
    } else if (editing && editing?.userData?.grabNodeData?.levelNodeGroup) {
        // TODO: fix changing children
        remakeGroup(shape, false, editing)
        // change group nodeData
        let childNodes = editing.userData.grabNodeData.levelNodeGroup.childNodes;
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
        && (editing.userData.grabNodeData.levelNodeStatic)
    ) {
        let shapeData = deepClone(editing.userData.grabNodeData);
        let nodeData = Object.values(shapeData)[0];
        let shape = nodeData.shape;
        remakeEditingObject(material, shape, shapeData);
        applyChangesElement.style.display = "block";
        applyChangesAsFrameElement.style.display = "block";
    } else if (editing && editing?.userData?.grabNodeData?.levelNodeGroup) {
        // TODO: fix changing children
        remakeGroup(false, material, editing)
        // change group nodeData
        let childNodes = editing.userData.grabNodeData.levelNodeGroup.childNodes;
        runOnNodes(childNodes, (node) => {
            if (node.levelNodeStatic) {
                node.levelNodeStatic.material = material;
            }
        }, false);
    }
}
function editColor(e) {
    let color = e.target.value;
    if (editing && editing.parent.type == "Scene" && editing.userData.grabNodeData.levelNodeStatic) {
        let shapeData = deepClone(editing.userData.grabNodeData);
        let nodeData = Object.values(shapeData)[0];
        nodeData.color1 = {
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
    } else if (editing && editing?.userData?.grabNodeData?.levelNodeGroup) {
        // TODO: fix changing children
        remakeGroup(false, false, editing)
        // change group nodeData
        let childNodes = editing.userData.grabNodeData.levelNodeGroup.childNodes;
        runOnNodes(childNodes, (node) => {
            if (node.levelNodeStatic) {
                Object.values(node)[0].color1 = {
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
function toggleFog() {
    fogEnabled = !fogEnabled;
    for (let material of materials) {
        material.uniforms.fogEnabled = { value: fogEnabled};
    }
    for (let object of objects) {
        if (object?.material?.uniforms?.fogEnabled) {
            object.material.uniforms.fogEnabled.value = fogEnabled;
        }
    }
}
function editAnimation(animation) {
    if (
        editing && editing?.parent?.type == "Scene"
        && (
            editing.userData.grabNodeData.levelNodeStatic || 
            editing.userData.grabNodeData.levelNodeCrumbling ||
            editing.userData.grabNodeData.levelNodeGravity ||
            editing.userData.grabNodeData.levelNodeSign || 
            editing.userData.grabNodeData.levelNodeGroup
        )
    ) {
        if (animation == "none") {
            editing.animation = null;
            editing.userData.grabNodeData.animations = [];
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
            editing.userData.grabNodeData.animations = [animationData];
            editing.initialPosition = Object.values(editing.userData.grabNodeData)[0].position;
            editing.initialRotation = Object.values(editing.userData.grabNodeData)[0].rotation;
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
    if (object.userData.grabNodeData.animations) {
        if (object.userData.grabNodeData.animations
            && object.userData.grabNodeData.animations.length
            && object.userData.grabNodeData.animations[0].frames
            && object.userData.grabNodeData.animations[0].frames.length
            && object.userData.grabNodeData.animations[0].frames[0]) {
            currentPosition = object.userData.grabNodeData.animations[0].frames[object.userData.grabNodeData.animations[0].frames.length - 1].position;
            currentTime = object.userData.grabNodeData.animations[0].frames[object.userData.grabNodeData.animations[0].frames.length - 1].time || 0;
        }
    } else {
        object.userData.grabNodeData.animations = [{
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
    object.userData.grabNodeData.animations[0].frames.push({
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
function copyEditingJSON() {
    if (editing) {
        let json = JSON.stringify(editing.userData.grabNodeData, null, 4);
        navigator.clipboard.writeText(json);
    }
}
function copyEditingChildren() {
    if (editing && editing?.userData?.grabNodeData?.levelNodeGroup) {
        let json = JSON.stringify(editing.userData.grabNodeData.levelNodeGroup.childNodes, null, 4);
        json = json.substring(1, json.length - 1);
        navigator.clipboard.writeText(json);
    }
}
function copyEditingAnimations() {
    if (editing && editing?.userData?.grabNodeData?.animations) {
        let json = JSON.stringify(editing.userData.grabNodeData.animations, null, 4);
        json = json.substring(1, json.length - 1);
        navigator.clipboard.writeText(json);
    }
}
function editEditingJSON(input) {
    let newJSON = JSON.parse(input);
    editing.userData.grabNodeData = newJSON;
    generateLevelFromObjects();
}
function editEditingChildrenJSON(input) {
    if (input.charAt(0) != '[') {
        input = '[\n' + input + '\n]';
    }
    let newJSON = JSON.parse(input);
    editing.userData.grabNodeData.levelNodeGroup.childNodes = newJSON;
    generateLevelFromObjects();
}
function editEditingAnimationsJSON(input) {
    if (input.charAt(0) != '[') {
        input = '[\n' + input + '\n]';
    }
    let newJSON = JSON.parse(input);
    editing.userData.grabNodeData.animations = newJSON;
    generateLevelFromObjects();
}
function initEditor() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / (window.innerHeight - 20), 0.1, 10000 );
    
    THREE.ColorManagement.enabled = true;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize( window.innerWidth , window.innerHeight - 20 );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(window.devicePixelRatio);

    renderContainerElement.appendChild( renderer.domElement );
    light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    sun = new THREE.DirectionalLight( 0xffffff, 0.5 );
    scene.add( sun );
    vrButton = VRButton.createButton( renderer );
    controls = new OrbitControls( camera, renderer.domElement );
    console.log(controls, "controls created");
    controls.mouseButtons = {LEFT: 2, MIDDLE: 1, RIGHT: 0}
    fly = new FlyControls( camera, renderer.domElement );
    fly.pointerdown = fly.pointerup = fly.pointermove = () => {};
    fly.dragToLook = false;
    fly.rollSpeed = 0;
    fly.movementSpeed = 0.2;
    transformControl = new TransformControls( camera, renderer.domElement );
    transformControl.addEventListener( 'change', () => {
        if (enableEditing && editing?.parent?.type == "Scene") {
            Object.values(editing.userData.grabNodeData)[0].position = {
                "x": editing.position.x,
                "y": editing.position.y,
                "z": editing.position.z
            };
            Object.values(editing.userData.grabNodeData)[0].rotation = {
                "x": editing.quaternion.x,
                "y": editing.quaternion.y,
                "z": editing.quaternion.z,
                "w": editing.quaternion.w
            };
            Object.values(editing.userData.grabNodeData)[0].scale = {
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
            if (editing.animationPath) {
                editing.animationPath.line.position.copy(editing.position);
                editing.animationPath.line.quaternion.copy(editing.quaternion);
                editing.animationPath.points.position.copy(editing.position);
                editing.animationPath.points.quaternion.copy(editing.quaternion);
            }
            applyChangesElement.style.display = "block";
            applyChangesAsFrameElement.style.display = "block";
        }
    });
    devTransform = new TransformControls( camera, renderer.domElement );
    devTransform.setSpace('local');
    devTransform.addEventListener( 'change', (e) => {
        if (devModes.active) {
            devModes.objects.forEach(object=>{
                object.position.setY(devModes.active.position.y);
            });
        }
    });
    transformControl.addEventListener( 'dragging-changed', ( event ) => {
        controls.enabled = ! event.value;
    } );
    raycaster = new THREE.Raycaster();
    devRaycaster = new THREE.Raycaster();
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
    incrementLoader(10);
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
    incrementLoader(10);
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
                        "color1": {
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
function generatePixelArt() {
    let rows = document.getElementById('pixel-prompt-rows').value;
    let cols = document.getElementById('pixel-prompt-cols').value;
    document.getElementById('pixel-prompt-rows').value = '';
    document.getElementById('pixel-prompt-cols').value = '';
    
    if (rows == "" || rows == null || rows < 1) {
        rows = parseInt(document.getElementById('pixel-prompt-rows').getAttribute('data-default')) || 50;
    }
    if (cols == "" || cols == null || cols < 1) {
        cols = parseInt(document.getElementById('pixel-prompt-cols').getAttribute('data-default')) || 50;
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
            canvas2.width = cols;
            canvas2.height = rows;
            let rgbArray = [];
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    let pixel = ctx.getImageData(x*(img.width/cols), y*(img.height/rows), 1, 1);
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
                        "color1": {
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
function generatePixelSphere() {
    let radius = document.getElementById('pixel-sphere-prompt').value;
    document.getElementById('pixel-sphere-prompt').value = '';
    
    if (radius == "" || radius == null || radius < 1) {
        radius = 10;
    }
    let file = document.getElementById('image-sphere-btn-input').files[0];
    let imageCanvas = document.getElementById('pixel-sphere-canvas');
    let imageContext = imageCanvas.getContext('2d');

    let pixels = [];
    for (let x = 0 - radius; x <= 0 + radius; x++) {
        for (let y = 0 - radius; y <= 0 + radius; y++) {
            for (let z = 0 - radius; z <= 0 + radius; z++) {
                let distance = Math.sqrt(
                    (x) ** 2 +
                    (y) ** 2 +
                    (z) ** 2
                );
                if (distance > radius - 0.5 && distance < radius + 0.5) {
                    let object = {
                        levelNodeStatic: {
                            shape: 1000,
                            material: 8,
                            position: {
                                x: x,
                                y: y,
                                z: z
                            },
                            scale: {
                                x: 1,
                                y: 1,
                                z: 1
                            },
                            rotation: {
                                w: 1,
                                x: 0,
                                y: 0,
                                z: 0
                            },
                            color1: {
                                r: 1,
                                g: 1,
                                b: 1,
                                a: 1
                            },
                            isNeon: true
                        }
                    };
                    pixels.push(object);
                }
            }
        }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            imageCanvas.width = img.width;
            imageCanvas.height = img.height;
            imageContext.drawImage(img, 0, 0);

            const imageData = imageContext.getImageData(0, 0, imageCanvas.width, imageCanvas.height).data;
            const imageWidth = imageCanvas.width;
            const imageHeight = imageCanvas.height;

            let mainLevel = getLevel();
            pixels.forEach(object => {
                const phi = Math.atan2(object.levelNodeStatic.position.z, object.levelNodeStatic.position.x);
                const theta = Math.acos(object.levelNodeStatic.position.y / radius);

                const u = - (phi + radius) / (2 * Math.PI);
                const v = theta / Math.PI;

                const x = Math.floor(u * imageWidth);
                const y = Math.floor(v * imageHeight);

                const index = (y * imageWidth + x) * 4;
                const r = imageData[index] / 255;
                const g = imageData[index + 1] / 255;
                const b = imageData[index + 2] / 255;

                object.levelNodeStatic.color1 = gammaToLinear(r, g, b);

                mainLevel.levelNodes.push(object);
            });
            setLevel(mainLevel);

        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}
function applyImage() {
    let file = document.getElementById('image-apply-btn-input').files[0];
    let imageCanvas = document.getElementById('pixel-apply-canvas');
    let imageContext = imageCanvas.getContext('2d');

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            imageCanvas.width = img.width;
            imageCanvas.height = img.height;
            imageContext.drawImage(img, 0, 0);

            const imageData = imageContext.getImageData(0, 0, imageCanvas.width, imageCanvas.height).data;
            const imageWidth = imageCanvas.width;
            const imageHeight = imageCanvas.height;

            let mainLevel = getLevel();
            runOnNodes(mainLevel.levelNodes, (object) => {
                if (object?.levelNodeStatic?.material == 8) {
                    const distance = Math.sqrt(
                        (object.levelNodeStatic?.position?.x || 0) ** 2 +
                        (object.levelNodeStatic?.position?.y || 0) ** 2 +
                        (object.levelNodeStatic?.position?.z || 0) ** 2
                    );

                    const phi = Math.atan2((object.levelNodeStatic?.position?.z || 0), (object.levelNodeStatic?.position?.x || 0));
                    const theta = Math.acos((object.levelNodeStatic?.position?.y || 0) / distance);
    
                    const u = - (phi + distance) / (2 * Math.PI);
                    const v = theta / Math.PI;
    
                    const x = Math.floor(u * imageWidth);
                    const y = Math.floor(v * imageHeight);
    
                    const index = (y * imageWidth + x) * 4;
                    const r = imageData[index] / 255;
                    const g = imageData[index + 1] / 255;
                    const b = imageData[index + 2] / 255;
    
                    object.levelNodeStatic.color1 = gammaToLinear(r, g, b);
                }
            }, false);
            setLevel(mainLevel);

        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}
function gammaToLinear(r, g, b) {
    r = (r <= 0.04045) ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = (g <= 0.04045) ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = (b <= 0.04045) ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    return {r, g, b, a:1};
}
function generateTextToSigns() {
    const text = document.getElementById('bulk-text-prompt').value;
    let wordsper = parseInt(document.getElementById('bulk-text-words').value);
    let direction = document.getElementById('bulk-text-direction').value;

    let words = text.split(' ');

    let splitStrings = [];
    for (let i = 0; i < words.length; i += wordsper) {
        let chunk = words.slice(i, i + wordsper);
        splitStrings.push(chunk.join(' '));
    }
    
    let level = getLevel();
    splitStrings.forEach((str, i) => {
        let sign = {levelNodeSign: {position: {x: 0,y: 0,z: 0},rotation: {w: 1.0},text:str}};
        if (direction == 'horizontal') {
            sign.levelNodeSign.position.x = i;
        } else {
            sign.levelNodeSign.position.y = -i;
        }
        level.levelNodes.push(sign);
    });
    setLevel(level);
}
function find_char(char, last_10, levelNodes) {
    for (let i = 0; i < levelNodes.length; i++) {
        if (levelNodes[i].levelNodeSign.text == char && !last_10.includes(i)) {
            return i
        }
    }
    return false
}
function generateAnimatedTextToSigns() {
    const text = document.getElementById('bulk-text-animated-prompt').value;

    // config
    let count = 0;
    let char_width = parseInt(document.getElementById('bulk-text-animated-char_width')?.value) || 0.05;
    let appearance_time = parseInt(document.getElementById('bulk-text-animated-appearance_time')?.value) || 2;
    let interval = parseInt(document.getElementById('bulk-text-animated-interval')?.value) || 0.1;
    let active_position = 0;
    let visible_length = parseInt(document.getElementById('bulk-text-animated-visible_length')?.value) || 40;
    let foreward_pos = 1;
    let height = 0;

    let levelNodes = [];
    let last_10 = [];
    let wants_return = false;

    for (let i = 0; i < text.length; i++) {
        let char = text.charAt(i);
        count++;

        if (char == "\n") {
            wants_return = true;
        }

        let sign_iter = find_char(char, last_10, levelNodes);
        if (sign_iter === false) {
            levelNodes.push({
                "levelNodeSign": {
                    "position": {
                    },
                    "rotation": {
                        "w": 1.0
                    },
                    "text": char
                },
                "animations": [
                    {
                        "frames": [
                            {
                                "position": {
                                },
                                "rotation": {
                                    "w": 1.0
                                }
                            }
                        ],
                        "name": "idle",
                        "speed": 1
                    }
                ]
            });
            sign_iter = levelNodes.length - 1;
        }

        // sign_iter = find_char(char, last_10, levelNodes);
        last_10.push(sign_iter);

        if (last_10.length > appearance_time / interval) {
            last_10.shift();
        }
        // appear
        levelNodes[sign_iter].animations[0].frames.push({
            "position": {
                "z": 1 * foreward_pos,
                "y": height * char_width * -2,
                "x": 1 * active_position * char_width
            },
            "rotation": {
                "w": 1.0
            },
            "time": count * interval
        });
        // disappear
        levelNodes[sign_iter].animations[0].frames.push({
            "position": {
                "z": 1 * foreward_pos,
                "y": height * char_width * -2,
                "x": 1 * active_position * char_width
            },
            "rotation": {
                "w": 1.0
            },
            "time": count * interval + appearance_time
        });
    
        levelNodes[sign_iter].animations[0].frames.push({
            "position": {
            },
            "rotation": {
                "w": 1.0
            },
            "time": count * interval + appearance_time
        });

        active_position++;
        if (active_position > visible_length) {
            wants_return = true;
        }
        if (wants_return && char == " ") {
            active_position = 0;
            height++;
            wants_return = false;
        }
    }

    for (let i = 0; i < levelNodes.length; i++) {
        levelNodes[i].animations[0].frames.push({
            "position": {
                "x": 0,
                "y": 0,
                "z": 0
            },
            "rotation": {
                "w": 1.0
            },
            "time": count * interval + appearance_time + 1
        });
    }

    let level = getLevel();
    levelNodes.forEach(node => {
        level.levelNodes.push(node);
    });
    setLevel(level);
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
function setEditAmbience() {
    let level = getLevel();
    level.ambienceSettings.skyHorizonColor = {
        "r": editAmbienceSettings.skyHorizonColorR,
        "g": editAmbienceSettings.skyHorizonColorG,
        "b": editAmbienceSettings.skyHorizonColorB
    };
    level.ambienceSettings.skyZenithColor = {
        "r": editAmbienceSettings.skyZenithColorR,
        "g": editAmbienceSettings.skyZenithColorG,
        "b": editAmbienceSettings.skyZenithColorB
    };
    level.ambienceSettings.sunSize = editAmbienceSettings.sunSize;
    level.ambienceSettings.sunAltitude = editAmbienceSettings.sunAltitude;
    level.ambienceSettings.sunAzimuth = editAmbienceSettings.sunAzimuth;
    level.ambienceSettings.fogDensity = editAmbienceSettings.fogDensity;
    setLevel(level);
}
function animationToolSetup() {
    let animations = (editing?.userData?.grabNodeData?.animations || []);
    let frames = animations.length > 0 ? (animations[0]?.frames || []) : [];
    for (let i in frames) {
        let frame = frames[i];
        let frameElement = document.createElement('div');
        frameElement.classList.add('animate-tool-frame');
        frameElement.innerHTML = `<span data-frame-iter="${i}">${parseInt(i)+1}: ${frame.time}s</span>`;
        document.getElementById('animate-tool-frames').appendChild(frameElement);
    }
}
function animationToolAdd() {
    let initialNode = editing.userData.initialGrabNodeData;
    let currentNode = editing.userData.grabNodeData;
    let initialPos = Object.values(initialNode)[0].position;
    let currentPos = Object.values(currentNode)[0].position;
    let initialRot = Object.values(initialNode)[0].rotation;
    let currentRot = Object.values(currentNode)[0].rotation;
    let lastTime = -1;
    if (!currentNode?.animations) {
        currentNode.animations = [];
    }
    if (!currentNode?.animations[0]) {
        currentNode.animations[0] = {
            "frames": [],
            "speed": 1
        }
    }
    if (currentNode?.animations?.length > 0
        && currentNode.animations[0].frames.length > 0
        && currentNode.animations[0].frames[currentNode.animations[0].frames.length-1]?.time >= 0
    ) {
        lastTime = currentNode.animations[0].frames[currentNode.animations[0].frames.length-1].time;
    }
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
    const changedRot = new THREE.Quaternion();
    const currentQuat = new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
    const initialQuat = new THREE.Quaternion(initialRot.x, initialRot.y, initialRot.z, initialRot.w);
    changedRot.multiply( 
        currentQuat, 
        initialQuat.invert() 
    );
    newFrame.rotation.x = changedRot.x;
    newFrame.rotation.y = changedRot.y;
    newFrame.rotation.z = changedRot.z;
    newFrame.rotation.w = changedRot.w;
    if (!editing?.animations) {
        editing.animations = [];
    }
    if (!(editing?.animations?.length > 0)) {
        editing.animations[0] = {
            "frames": [],
            "speed": 1
        }
    }
    editing.animations[0].frames.push(newFrame);
    if (!editing?.userData?.grabNodeData?.animations) {
        editing.userData.grabNodeData.animations = [];
    }
    if (!(editing?.userData?.grabNodeData?.animations?.length > 0)) {
        editing.userData.grabNodeData.animations[0] = {
            "frames": [],
            "speed": 1
        }
    }
    editing.userData.grabNodeData.animations[0].frames.push(newFrame);
}
function animationToolClear() {
    editing?.userData?.grabNodeData?.animations ? editing.userData.grabNodeData.animations = [] : null;
}
function copyCameraState() {
    let cameraState = `&camera_position=`;
    cameraState += `${camera.position.x},${camera.position.y},${camera.position.z}`;
    cameraState += `&camera_rotation=`;
    cameraState += `${camera.rotation.x},${camera.rotation.y},${camera.rotation.z}`;
    cameraState += `&control_target=`;
    cameraState += `${controls.target.x},${controls.target.y},${controls.target.z}`;

    navigator.clipboard.writeText(cameraState);
}
function generateCheatSheet(advanced=false) {
    let level = getLevel();
    level.title = `${advanced ? 'Advanced ' : ''}Cheat Sheet`;
    level.description = "All objects are neon and transparent by default.";
    let moddedShapes = [
        null,
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        1000,
        1001,
        1002,
        1003,
        1004,
        1005,
    ];
    let moddedMaterials = [
        null
    ]
    for (let i = -10; i <= 9; i++) {
        moddedMaterials.push(i);
    }
    if (advanced) {
        for (let i = 10; i <= 60; i++) {
            moddedMaterials.push(i);
        }
    }
    for (let i = 0; i < moddedShapes.length; i++) {
        for (let j = 0; j < moddedMaterials.length; j++) {
            level.levelNodes.push({
                "levelNodeStatic": {
                    "shape": moddedShapes[i],
                    "material": moddedMaterials[j],
                    "position": {
                        "x": i,
                        "y": 0,
                        "z": j
                    },
                    "scale": {
                        "x": 1,
                        "y": 1,
                        "z": 1
                    },
                    "rotation": {
                        "w": 1,
                        "x": 0,
                        "y": 0,
                        "z": 0
                    },
                    "color1": {
                        "r": 1,
                        "g": 1,
                        "b": 1,
                        "a": 1
                    },
                    "color2": {
                        "r": 1,
                        "g": 1,
                        "b": 1,
                        "a": 1
                    },
                    "isNeon": true,
                    "isTransparent": true
                }
            });
        }
    }
    setLevel(level);
}
function loadModdedProtobuf() {
    let moddedShapes = "";
    let moddedMaterials = "";

    let {root} = protobuf.parse(protobufData, { keepCase: true });
    let currentMaterials = Object.values(root.COD.Level.LevelNodeMaterial);
    let currentShapes = Object.values(root.COD.Level.LevelNodeShape);

    for (let i = -2000; i < 2000; i++) {
        if (!currentMaterials.includes(i)) {
            moddedMaterials += `M${i}=${i};`.replace("-", "N");
        }
        if (!currentShapes.includes(i)) {
            moddedShapes += `S${i}=${i};`.replace("-", "N");
        }
    }

    let protobuf_chunks = protobufData.split("enum LevelNodeShape");
    protobuf_chunks[1] = protobuf_chunks[1].replace("{", `{\n//Modded types\n${moddedShapes}\n\n`);
    let newProtobuf = protobuf_chunks.join("enum LevelNodeShape");

    protobuf_chunks = newProtobuf.split("enum LevelNodeMaterial");
    protobuf_chunks[1] = protobuf_chunks[1].replace("{", `{\n//Modded types\n${moddedMaterials}\n\n`);
    newProtobuf = protobuf_chunks.join("enum LevelNodeMaterial");

    document.getElementById('protobuf-prompt').value = newProtobuf;
}
function saveConfig() {
    let currentConfig = {
        showAnimations,
        showGroups,
        fogEnabled,
        hideText,
        highlightText,
        playAnimations,
        animationSpeed,
        showTriggerPaths
    };
    console.log(currentConfig);
    localStorage.setItem("editor-config", JSON.stringify(currentConfig));
}
function loadConfig() {
    let currentConfig = JSON.parse(localStorage.getItem("editor-config"));
    console.log(currentConfig);
    if (currentConfig) {
        showAnimations = currentConfig.showAnimations;
        showGroups = currentConfig.showGroups;
        fogEnabled = currentConfig.fogEnabled;
        hideText = currentConfig.hideText;
        highlightText = currentConfig.highlightText;
        playAnimations = currentConfig.playAnimations;
        animationSpeed = currentConfig.animationSpeed;
        showTriggerPaths = currentConfig.showTriggerPaths;
    }
    incrementLoader(10);
}
function higherFar() {
    camera.far = 1000000;
    camera.updateProjectionMatrix();
}
function initUI() {
    // dark mode
    if (localStorage.getItem("darkMode") === "true") {
        document.body.parentElement.classList.add("dark-mode");
    }

    // prompts
    const promptsElement = document.getElementById('prompts');

    document.getElementById('edit_ambienceMenu-btn').addEventListener('click', () => {
        promptsElement.style.display = 'grid';
        document.getElementById('prompt-ambienceMenu').style.display = 'flex';
    });
    document.querySelector('#prompt-ambienceMenu .prompt-cancel').addEventListener('click', () => {
        promptsElement.style.display = 'none';
        document.getElementById('prompt-ambienceMenu').style.display = 'none';
    });
    document.querySelectorAll('#prompt-ambienceMenu .ambience-editor').forEach((input) => {
        input.addEventListener('change', () => {
            let setting = input.getAttribute('data-setting');
            let value = parseFloat(input.value);
            editAmbienceSettings[setting] = value;
            setEditAmbience();
        });
    });

    document.getElementById('edit_editJSON-btn').addEventListener('click', () => {
        promptsElement.style.display = 'grid';
        document.getElementById('prompt-editingJson').style.display = 'flex';
        document.getElementById('editingJson-prompt').innerHTML = JsonToHighlightedText(editing.userData.grabNodeData);
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
        document.getElementById('editingChildrenJson-prompt').innerHTML = JsonToHighlightedText(editing.userData.grabNodeData.levelNodeGroup.childNodes);
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
        document.getElementById('editingAnimationsJson-prompt').innerHTML = JsonToHighlightedText(editing.userData.grabNodeData.animations);
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

    document.getElementById('bulk-text-btn').addEventListener('click', () => {
        promptsElement.style.display = 'grid';
        document.getElementById('prompt-bulk-text').style.display = 'flex';
    });
    document.querySelector('#prompt-bulk-text .prompt-cancel').addEventListener('click', () => {
        promptsElement.style.display = 'none';
        document.getElementById('prompt-bulk-text').style.display = 'none';
        document.getElementById('bulk-text-prompt').value = '';
    });
    document.querySelector('#prompt-bulk-text .prompt-submit').addEventListener('click', () => {
        promptsElement.style.display = 'none';
        document.getElementById('prompt-bulk-text').style.display = 'none';
        generateTextToSigns();
        document.getElementById('bulk-text-prompt').value = '';
    });

    document.getElementById('bulk-text-animated-btn').addEventListener('click', () => {
        promptsElement.style.display = 'grid';
        document.getElementById('prompt-bulk-text-animated').style.display = 'flex';
    });
    document.querySelector('#prompt-bulk-text-animated .prompt-cancel').addEventListener('click', () => {
        promptsElement.style.display = 'none';
        document.getElementById('prompt-bulk-text-animated').style.display = 'none';
        document.getElementById('bulk-text-animated-prompt').value = '';
    });
    document.querySelector('#prompt-bulk-text-animated .prompt-submit').addEventListener('click', () => {
        promptsElement.style.display = 'none';
        document.getElementById('prompt-bulk-text-animated').style.display = 'none';
        generateAnimatedTextToSigns();
        document.getElementById('bulk-text-animated-prompt').value = '';
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

        let file = document.getElementById('image-btn-input').files[0];
        let reader = new FileReader();
        reader.onload = function() {
            let data = reader.result;
            let img = new Image();
            img.onload = function() {
                const ratio = Math.floor(50 / (img.width / img.height));
                document.getElementById('pixel-prompt-rows').setAttribute('data-default', ratio);
                document.getElementById('pixel-prompt-rows').setAttribute('placeholder', `Height, Default: ${ratio}`);
            }
            img.src = data;
        }
        reader.readAsDataURL(file);
    });

    document.querySelector('#prompt-pixel-sphere .prompt-cancel').addEventListener('click', () => {
        promptsElement.style.display = 'none';
        document.getElementById('prompt-pixel-sphere').style.display = 'none';
        document.getElementById('pixel-sphere-prompt').value = '';
    });
    document.querySelector('#prompt-pixel-sphere .prompt-submit').addEventListener('click', () => {
        promptsElement.style.display = 'none';
        document.getElementById('prompt-pixel-sphere').style.display = 'none';
        generatePixelSphere();
    });
    document.getElementById('image-sphere-btn-input').addEventListener('change', (e) => {
        promptsElement.style.display = 'grid';
        document.getElementById('prompt-pixel-sphere').style.display = 'flex';
    });
    
    document.getElementById('image-apply-btn-input').addEventListener('change', (e) => {
        applyImage();
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

    document.getElementById('outline-btn').addEventListener('click', () => {
        promptsElement.style.display = 'grid';
        document.getElementById('prompt-outline').style.display = 'flex';
    });
    document.querySelector('#prompt-outline .prompt-cancel').addEventListener('click', () => {
        promptsElement.style.display = 'none';
        document.getElementById('prompt-outline').style.display = 'none';
    });
    document.querySelector('#prompt-outline .prompt-submit').addEventListener('click', () => {
        promptsElement.style.display = 'none';
        document.getElementById('prompt-outline').style.display = 'none';
        outlineLevel();
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

    document.getElementById('edit_exportJSON-btn').addEventListener('click', () => {
        saveDataAsFile(`${(Date.now()).toString().slice(0, -3)}.node.json`, JSON.stringify(editing.userData.grabNodeData, 2));
    });

    timelineSliderElement.addEventListener('input', () => {
        animationTime = parseFloat(timelineSliderElement.value);
    });
    // animate tool
    document.getElementById('edit_animate').addEventListener('click', () => {
        if (enableEditing && editing) {
            document.getElementById('animate-tool').style.display = 'flex';
            animationToolSetup();
        }
    });
    document.getElementById('animate-tool-close').addEventListener('click', () => {
        document.getElementById('animate-tool-frames').innerHTML = '';
        document.getElementById('animate-tool').style.display = 'none';
    });
    document.getElementById('animate-tool-add').addEventListener('click', () => {
        animationToolAdd();
        document.getElementById('animate-tool-frames').innerHTML = '';
        animationToolSetup();
    });
    document.getElementById('animate-tool-clear').addEventListener('click', () => {
        animationToolClear();
        document.getElementById('animate-tool-frames').innerHTML = '';
    });

    // apply
    applyChangesElement.addEventListener('click', generateLevelFromObjects);
    applyChangesAsFrameElement.addEventListener('click', generateFrameLevelFromObjects);
    // stats
    document.getElementById('stats-container').addEventListener('click', handleStatsClick);
    // buttons
    document.getElementById('save-config-btn').addEventListener('click', saveConfig);
    document.getElementById('copyCamera-btn').addEventListener('click', copyCameraState);
    document.getElementById('enableEditing-btn').addEventListener('click', toggleEditing);
    document.getElementById('hide-btn').addEventListener('click', () => {editInputElement.style.display = hideText ? 'block' : 'none';hideText = !hideText;highlightTextEditor()});
    document.getElementById('highlight-btn').addEventListener('click', () => {highlightText = !highlightText;highlightTextEditor()});
    document.getElementById('performance-btn').addEventListener('click', () => {renderer.getPixelRatio() == 1 ? renderer.setPixelRatio( window.devicePixelRatio / 10 ) : renderer.setPixelRatio( 1 )});
    document.getElementById('range-btn').addEventListener('click', () => {loadModdedProtobuf()});
    editInputElement.addEventListener('keydown', (e) => {handleEditInput(e)});
    document.getElementById('start-btn').addEventListener('click', goToStart);
    document.getElementById('finish-btn').addEventListener('click', goToFinish);
    document.getElementById('mapview-btn').addEventListener('click', mapView);
    document.getElementById('nullview-btn').addEventListener('click', nullView);
    document.getElementById('higherFar-btn').addEventListener('click', higherFar);
    document.getElementById('showGroups-btn').addEventListener('click', () => {showGroups = !showGroups; refreshScene()});
    document.getElementById('showTriggerPaths-btn').addEventListener('click', () => {showTriggerPaths = !showTriggerPaths; refreshScene()});
    document.getElementById('showAnimations-btn').addEventListener('click', () => {showAnimations = !showAnimations; refreshScene()});
    document.getElementById('toggleFog-btn').addEventListener('click', () => {toggleFog(); refreshScene()});
    editInputElement.addEventListener('blur', highlightTextEditor);
    document.getElementById('json-btn').addEventListener('click', downloadAsJSON);
    document.getElementById('monochromify-btn').addEventListener('click', monochromify);
    document.getElementById('gltf-btn').addEventListener('click', exportLevelAsGLTF);
    document.getElementById('toquest-btn').addEventListener('click', saveToQuest);
    document.getElementById('connect-adb-btn').addEventListener('click', connectUsb);
    document.getElementById('cleardetails-btn').addEventListener('click', clearLevelDetails);
    document.getElementById('group-btn').addEventListener('click', groupLevel);
    document.getElementById('ungroup-btn').addEventListener('click', unGroupLevel);
    document.getElementById('FPE-pixelate-btn').addEventListener('click', FPEPixelate);
    // document.getElementById('outline-btn').addEventListener('click', outlineLevel);
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
    document.getElementById('ungroup-all-btn').addEventListener('click', () => {let level = getLevel(); level.levelNodes = recursiveUnGroup(level.levelNodes); setLevel(level)});
    document.getElementById('topc-btn').addEventListener('click', () => {downloadProto(getLevel())});
    document.getElementById('empty-btn').addEventListener( 'click', () => {openJSON('level_data/json_files/empty.json')});
    // document.getElementById('the-index-btn').addEventListener('click', () => {openProto('level_data/the-index.level')});
    document.getElementById('basic-cheatsheet-btn').addEventListener('click', () => {generateCheatSheet()});
    document.getElementById('advanced-cheatsheet-btn').addEventListener('click', () => {generateCheatSheet(true)});
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
    document.getElementById('image-sphere-btn').addEventListener('click', () => {document.getElementById('image-sphere-btn-input').click()});
    document.getElementById('image-apply-btn').addEventListener('click', () => {document.getElementById('image-apply-btn-input').click()});
    document.getElementById('pointcloud-btn').addEventListener('click', () => {document.getElementById('pointcloud-btn-input').click()});
    document.getElementById('pointcloud-btn-input').addEventListener('change', (e) => {openPointCloud(e.target.files[0])});
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
    // intentional node types
    document.getElementById('nodeStatic-btn').addEventListener('click', () => {appendInsert("nodeStatic")});
    document.getElementById('nodeAnimated-btn').addEventListener('click', () => {appendInsert("nodeAnimated")});
    document.getElementById('nodeColored-btn').addEventListener('click', () => {appendInsert("nodeColored")});
    document.getElementById('nodeCrumbling-btn').addEventListener('click', () => {appendInsert("nodeCrumbling")});
    document.getElementById('nodeSign-btn').addEventListener('click', () => {appendInsert("nodeSign")});
    document.getElementById('nodeStart-btn').addEventListener('click', () => {appendInsert("nodeStart")});
    document.getElementById('nodeFinish-btn').addEventListener('click', () => {appendInsert("nodeFinish")});
    document.getElementById('nodeGravity-btn').addEventListener('click', () => {appendInsert("nodeGravity")});
    document.getElementById('nodeColoredLava-btn').addEventListener('click', () => {appendInsert("nodeColoredLava")});
    // insert modded nodes
    // not actually modded, but cool node presets
    document.getElementById('NeonTransparentNode-btn').addEventListener('click', () => {appendInsert("NeonTransparentNode")});
    document.getElementById('InvertedNode-btn').addEventListener('click', () => {appendInsert("InvertedNode")});
    document.getElementById('ScalableStartNode-btn').addEventListener('click', () => {appendInsert("ScalableStartNode")});
    document.getElementById('ScalableFinishNode-btn').addEventListener('click', () => {appendInsert("ScalableFinishNode")});
    document.getElementById('ScalableSignNode-btn').addEventListener('click', () => {appendInsert("ScalableSignNode")});
    document.getElementById('Parallelogram-btn').addEventListener('click', () => {appendInsert("Parallelogram")});
    // insert presets
    // groups of pre-made objects
    document.getElementById('HighGravity-btn').addEventListener('click', () => {appendInsert("HighGravity")});
    document.getElementById('BreakTimes-btn').addEventListener('click', () => {appendInsert("BreakTimes")});
    
    document.getElementById('dev_placeLobbyMenu-btn').addEventListener('click', () => {
        devModes.placeLobbyMenu = true;
        document.getElementById('dev-tools').style.display = 'flex';
    });
    document.getElementById('dev_placeCollectible-btn').addEventListener('click', () => {
        devModes.placeCollectible = true;
        document.getElementById('dev-tools').style.display = 'flex';
    });

    document.getElementById('dev-tools-lobby-flip').addEventListener('click', () => {
        devModes.active.rotation.y += Math.PI / 2;
    });
    document.getElementById('dev-tools-lobby-copy').addEventListener('click', () => {
        document.getElementById('dev-tools-lobby-copy-popup').style.display = 'flex';
        if (devModes.placeLobbyMenu) {
            document.getElementById('dev-tools-lobby-copy-popup-text').innerText = `Menu position: (${
                    devModes.active.position.x
                }f, ${
                    devModes.active.position.y
                }f, ${
                    devModes.active.position.z
                }f)\n
                Menu rotation: (${
                    devModes.active.rotation.x
                }f, ${
                    devModes.active.rotation.y
                }f, ${
                    devModes.active.rotation.z
                }f)
            `;
        } else if (devModes.placeCollectible) {
            let message = '';
            devModes.objects.forEach(object => {
                message += `Collectible position: (${
                    object.position.x
                }f, ${
                    object.position.y
                }f, ${
                    object.position.z
                }f)\n`;
            });
            document.getElementById('dev-tools-lobby-copy-popup-text').innerText = message;
        }
    });
    document.getElementById('dev-tools-lobby-copy-popup-close').addEventListener('click', () => {
        document.getElementById('dev-tools-lobby-copy-popup').style.display = 'none';
        document.getElementById('dev-tools-lobby-copy-popup-text').innerText = '';
    });
    document.getElementById('dev-tools-lobby-done').addEventListener('click', () => {
        controls.enabled = true;
        devModes.objects.forEach(object => {
            scene.remove(object);
        });
        devModes.placeLobbyMenu = false;
        devModes.objects = [];
        devTransform.detach();
        devModes.active = undefined;
        document.getElementById('dev-tools').style.display = 'none';
    });

    incrementLoader(10);
}
async function initAttributes() {
    for (const path of materialList) {
        const texture = await loadTexture(path);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        let material = new THREE.ShaderMaterial({
            vertexShader: SHADERS.levelVS,
            fragmentShader: SHADERS.levelFS,
            uniforms: {
                "colorTexture": { value: texture },
                "tileFactor": { value: 1.1 },
                "diffuseColor": { value: [1.0, 1.0, 1.0] },
                "worldNormalMatrix": { value: new THREE.Matrix3() },
                "neonEnabled": { value: 0.0 },
                "isTransparent": { value: 0.0 },
                "fogEnabled": { value: fogEnabled },
                "specularColor": { value: [0.3, 0.3, 0.3, 16.0]},
                "isSelected": { value: false },
                "isLava": { value: 0.0 },
                "isColoredLava": { value: 0.0 }
            }
        });
        let exportMaterial = new THREE.MeshBasicMaterial({ map: texture });
        materials.push(material);
        exportMaterials.push(exportMaterial);
        incrementLoader(10 / materialList.length);
    }

    for (const path of shapeList) {
        const model = await loadModel(path);
        shapes.push(model);
        incrementLoader(10 / shapeList.length);
    }

    startMaterial = new THREE.ShaderMaterial();
	startMaterial.vertexShader = SHADERS.startFinishVS;
	startMaterial.fragmentShader = SHADERS.startFinishFS;
	startMaterial.flatShading = true;
	startMaterial.transparent = true;
	startMaterial.depthWrite = false;
	startMaterial.uniforms = { "diffuseColor": {value: [0.0, 1.0, 0.0, 1.0]}};
	objectMaterials.push(startMaterial);

	finishMaterial = new THREE.ShaderMaterial();
	finishMaterial.vertexShader = SHADERS.startFinishVS;
	finishMaterial.fragmentShader = SHADERS.startFinishFS;
	finishMaterial.flatShading = true;
	finishMaterial.transparent = true;
	finishMaterial.depthWrite = false;
	finishMaterial.uniforms = { "diffuseColor": {value: [1.0, 0.0, 0.0, 1.0]}};
	objectMaterials.push(finishMaterial);
    
    skyMaterial = new THREE.ShaderMaterial();
    skyMaterial.vertexShader = SHADERS.skyVS;
    skyMaterial.fragmentShader = SHADERS.skyFS;
    skyMaterial.flatShading = false;
    skyMaterial.depthWrite = false;
    skyMaterial.side = THREE.BackSide;

    signMaterial = materials[4].clone();
    signMaterial.uniforms.colorTexture = materials[4].uniforms.colorTexture;
    signMaterial.vertexShader = SHADERS.signVS;
    signMaterial.fragmentShader = SHADERS.signFS;
    objectMaterials.push(signMaterial);
    
    neonMaterial = materials[8].clone();
    neonMaterial.uniforms.colorTexture = materials[8].uniforms.colorTexture;
    neonMaterial.uniforms.specularColor.value = [0.4, 0.4, 0.4, 64.0];
    neonMaterial.uniforms.neonEnabled.value = 1.0;
    objectMaterials.push(neonMaterial);
    
    triggerMaterial = materials[8].clone();
    triggerMaterial.uniforms.colorTexture = materials[8].uniforms.colorTexture;
    triggerMaterial.uniforms.isTransparent.value = 1.0;
    triggerMaterial.uniforms.diffuseColor.value = [1, 0.5, 0];
    triggerMaterial.transparent = true;
    triggerMaterial.opacity = 0;
    objectMaterials.push(triggerMaterial);

    sunAngle = new THREE.Euler(THREE.MathUtils.degToRad(45), THREE.MathUtils.degToRad(315), 0.0)
    sunAltitude = 45.0
    horizonColor = [0.916, 0.9574, 0.9574]

    fontLoader.load('/font/font.typeface.json', (response) => {
        font = response;
    });

    console.log('Ready', materials, shapes);
    incrementLoader(10);
}
function initURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('level');

    console.log(paramId);
    if (paramId) {
        if (paramId.includes('t:')) {
            const templateIndex = parseInt(paramId.split(':')[1]);
            const template = templates[templateIndex];
            if (template.type == 'identifier') {
                downloadAndOpenLevel(template.link);
            } else if (template.type == 'file') {
                openProto(template.link);
            }
        } else {
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

    const paramCameraPosition = urlParams.get('camera_position');
    const paramCameraRotation = urlParams.get('camera_rotation');
    const paramControlTarget = urlParams.get('control_target');
    if (paramCameraPosition) {
        const position = paramCameraPosition.split(',').map(pos=>parseFloat(pos));
        camera.position.set(
            position[0],
            position[1],
            position[2]
        );
    }
    if (paramCameraRotation) {
        const rotation = paramCameraRotation.split(',').map(rot=>parseFloat(rot));
        camera.rotation.set(
            rotation[0],
            rotation[1],
            rotation[2]
        );
    }
    if (paramControlTarget) {
        const target = paramControlTarget.split(',').map(pos=>parseFloat(pos));
        controls.target.set(
            target[0],
            target[1],
            target[2]
        );
        camera.lookAt(
            target[0],
            target[1],
            target[2]
        );
    }
    
    console.log(camera, controls);
    incrementLoader(10);
}

function incrementLoader(percent) {
    loadedPercentage += percent;
    if (loadedPercentage >= 100) {
        loadedPercentage = 100;
        loaderContainer.style.display = 'none';
    }
    loaderText.innerText = `${Math.round(loadedPercentage * 10) / 10}%`;
}

await initAttributes();
initEditor();
highlightTextEditor();
initTerminal();
initUI();
initURLParams();
loadConfig();