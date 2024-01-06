import * as THREE from 'https://unpkg.com/three@0.145.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.145.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@v0.132.0/examples/jsm/loaders/GLTFLoader.js';
import { FlyControls } from 'https://unpkg.com/three@0.145.0/examples/jsm/controls/FlyControls.js';
import { GLTFExporter } from 'https://cdn.skypack.dev/three@v0.132.0/examples/jsm//exporters/GLTFExporter.js';
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.145.0/examples/jsm/webxr/VRButton.min.js";
// import { XRControllerModelFactory } from 'https://cdn.jsdelivr.net/npm/three@0.145.0/examples/jsm/webxr/XRControllerModelFactory.js';
// import { CubemapToEquirectangular } from './js/CubemapToEquirectangular.js';

let webusb = null;
let adb = null;
let shell = null;
let sync = null;
let decoder = new TextDecoder();
let camera, scene, renderer, light, controls, fly, loader, sun;
let objects = [];
let materials = [];
let shapes = [];
let exportMaterials = [];
let altTextures = false;
let lastRan = '';
let HIDE_TEXT = false;
let HIGHLIGHT_TEXT = true;
let vrButton;
let startMaterial, finishMaterial;
let templates = [
    {
        "name": "Animation Cheat Sheet",
        "link": "level_data/animations.level",
        "type": "file"
    },
    {
        "name": "Tutorial",
        "link": "29t798uon2urbra1f8w2q:1693775768",
        "type": "identifier"
    },
    {
        "name": "Rick Roll",
        "link": "29sgp24f1uorbc6vq8d2k:1696497039",
        "type": "identifier"
    },
    {
        "name": "BAD APPLE!!",
        "link": "29sgp24f1uorbc6vq8d2k:1696497038",
        "type": "identifier"
    },
    {
        "name": "animation test file",
        "link": "level_data/animtesting.level",
        "type": "file"
    },
    {
        "name": "Space Lobby 2024",
        "link": "level_data/lobbies/lobby-space-2024.level",
        "type": "file"
    },
    {
        "name": "Christmas Lobby 2023",
        "link": "level_data/lobbies/lobby-christmas-2023.level",
        "type": "file"
    },
    {
        "name": "New Years 2024 Lobby",
        "link": "level_data/lobbies/lobby-new-year-2024.level",
        "type": "file"
    },
    {
        "name": "Best Of Grab Lobby",
        "link": "level_data/lobbies/lobby-best-of-grab-2023.level",
        "type": "file"
    },
    {
        "name": "Halloween Lobby 2023",
        "link": "level_data/lobbies/lobby-halloween-2023.level",
        "type": "file"
    },
    {
        "name": "Lobby",
        "link": "level_data/lobbies/lobby.level",
        "type": "file"
    },
    {
        "name": "Treehouse Lobby",
        "link": "level_data/lobbies/lobby-treehouse.level",
        "type": "file"
    },
    {
        "name": "Temple Lobby",
        "link": "level_data/lobbies/lobby-temple.level",
        "type": "file"
    },
    {
        "name": "Dojo Lobby",
        "link": "level_data/lobbies/lobby-dojo.level",
        "type": "file"
    },
    {
        "name": "Christmas Lobby",
        "link": "level_data/lobbies/lobby-christmas.level",
        "type": "file"
    },
    {
        "name": "Cave Lobby",
        "link": "level_data/lobbies/lobby-cave.level",
        "type": "file"
    },
    {
        "name": "Beach Lobby",
        "link": "level_data/lobbies/lobby-beach.level",
        "type": "file"
    },
    {
        "name": "New Editor",
        "link": "level_data/new.level",
        "type": "file"
    },
    {
        "name": "Castle Lobby 2023",
        "link": "level_data/lobbies/lobby-castle-2023.level",
        "type": "file"
    },
    {
        "name": "Christmas Lobby 2022",
        "link": "level_data/lobbies/lobby-christmas-2022.level",
        "type": "file"
    },
    {
        "name": "Easter GTF Lobby 2023",
        "link": "level_data/lobbies/lobby-easter-2023.level",
        "type": "file"
    },
    {
        "name": "Summer Lobby 2023",
        "link": "level_data/lobbies/lobby-summer-2023.level",
        "type": "file"
    },
    {
        "name": "Space Lobby",
        "link": "level_data/lobbies/lobby-space.level",
        "type": "file"
    },
    {
        "name": "Restaurant Lobby",
        "link": "level_data/lobbies/lobby-restaurant.level",
        "type": "file"
    },
    {
        "name": "Halloween Lobby",
        "link": "level_data/lobbies/lobby-halloween.level",
        "type": "file"
    },
    {
        "name": "Forest Lobby",
        "link": "level_data/lobbies/lobby-forest.level",
        "type": "file"
    },
    {
        "name": "Floating Islands Lobby 2023",
        "link": "level_data/lobbies/lobby-floating-islands-2023.level",
        "type": "file"
    },
    {
        "name": "Winter Lobby 2023",
        "link": "level_data/lobbies/lobby-winter-2023.level",
        "type": "file"
    },
    {
        "name": "The Mountain",
        "link": "29r46v7djliny6t4rzvq7:1654257963",
        "type": "identifier"
    },
    {
        "name": ".index's challenge",
        "link": "29sgp24f1uorbc6vq8d2k:1667046337",
        "type": "identifier"
    },
    {
        "name": "FROSTYs climbing adventure",
        "link": "29ffxg2ijqxyrgxyy2vjj:1642284195",
        "type": "identifier"
    },
    {
        "name": "fire",
        "link": "2a4lsr3j8bypkewcx9s90:fire",
        "type": "identifier"
    },
    {
        "name": "WOODEN",
        "link": "29sgp24f1uorbc6vq8d2k:1693731780",
        "type": "identifier"
    },
    {
        "name": "Blood in the ice",
        "link": "2a4lsr3j8bypkewcx9s90:1691122081",
        "type": "identifier"
    },
    {
        "name": "DON'T SLIP!",
        "link": "29sgp24f1uorbc6vq8d2k:1693033756",
        "type": "identifier"
    },
    {
        "name": ".index's X-Ray",
        "link": "29sgp24f1uorbc6vq8d2k:1685501411",
        "type": "identifier"
    },
    {
        "name": "COW!",
        "link": "29sgp24f1uorbc6vq8d2k:1685501444",
        "type": "identifier"
    },
    {
        "name": "VERY FUN LEVEL",
        "link": "2a4lsr3j8bypkewcx9s90:1684323969",
        "type": "identifier"
    },
    {
        "name": "Tutorial 1",
        "link": "level_data/official/1-tutorial-1.level",
        "type": "file"
    },
    {
        "name": "Tutorial 2",
        "link": "level_data/official/2-tutorial-2.level",
        "type": "file"
    },
    {
        "name": "Tutorial 3",
        "link": "level_data/official/3-tutorial-3.level",
        "type": "file"
    },
    {
        "name": "Tutorial 4",
        "link": "level_data/official/4-tutorial-4.level",
        "type": "file"
    },
    {
        "name": "Tutorial 5",
        "link": "level_data/official/5-tutorial-5.level",
        "type": "file"
    },
    {
        "name": "Tutorial 6",
        "link": "level_data/official/6-tutorial-6.level",
        "type": "file"
    },
    {
        "name": "Tutorial 7",
        "link": "level_data/official/7-tutorial-7.level",
        "type": "file"
    },
    {
        "name": "Easy 1",
        "link": "level_data/official/10-easy-1.level",
        "type": "file"
    },
    {
        "name": "Easy 2",
        "link": "level_data/official/11-easy-2.level",
        "type": "file"
    },
    {
        "name": "Easy 3",
        "link": "level_data/official/12-easy-3.level",
        "type": "file"
    },
    {
        "name": "Easy 4",
        "link": "level_data/official/13-easy-4.level",
        "type": "file"
    },
    {
        "name": "Easy 5",
        "link": "level_data/official/14-easy-5.level",
        "type": "file"
    },
    {
        "name": "Easy 6",
        "link": "level_data/official/15-easy-6.level",
        "type": "file"
    },
    {
        "name": "Easy tower",
        "link": "level_data/official/20-easy-tower.level",
        "type": "file"
    },
    {
        "name": "Death Tower",
        "link": "level_data/official/30-death-tower.level",
        "type": "file"
    },
    {
        "name": "BFL",
        "link": "level_data/official/40-BFL-1.level",
        "type": "file"
    }
];
let PROTOBUF_DATA = `
syntax = "proto3";

package COD.Level;

message Level
{
  uint32 formatVersion = 1;

  string title = 2;
  string creators = 3;
  string description = 4;
  uint32 complexity = 5;
  uint32 maxCheckpointCount = 7;

  AmbienceSettings ambienceSettings = 8;

  repeated LevelNode levelNodes = 6;
}

message Vector
{
	float x = 1;
	float y = 2;
	float z = 3;
}

message Quaternion
{
	float x = 1;
	float y = 2;
	float z = 3;
	float w = 4;
}

message Color
{
	float r = 1;
	float g = 2;
	float b = 3;
	float a = 4;
}

message AmbienceSettings
{
	Color skyZenithColor = 1;
	Color skyHorizonColor = 2;

	float sunAltitude = 3;
	float sunAzimuth = 4;
	float sunSize = 5;

	float fogDDensity = 6;
}

enum LevelNodeShape
{
	START = 0;
	FINISH = 1;
	SIGN = 2;

	__END_OF_SPECIAL_PARTS__ = 3;

	CUBE = 1000;
	SPHERE = 1001;
	CYLINDER = 1002;
	PYRAMID = 1003;
	PRISM = 1004;
}

enum LevelNodeMaterial
{
	DEFAULT = 0;
	GRABBABLE = 1;
	ICE = 2;
	LAVA = 3;
	WOOD = 4;
	GRAPPLABLE = 5;
	GRAPPLABLE_LAVA = 6;

	GRABBABLE_CRUMBLING= 7;
	DEFAULT_COLORED = 8;
	BOUNCING = 9;
}

message LevelNodeGroup
{
	Vector position = 1;
	Vector scale = 2;
	Quaternion rotation = 3;

	repeated LevelNode childNodes = 4;
}

message LevelNodeStart
{
	Vector position = 1;
	Quaternion rotation = 2;
	float radius = 3;
}

message LevelNodeFinish
{
	Vector position = 1;
	float radius = 2;
}

message LevelNodeStatic
{
	LevelNodeShape shape = 1;
	LevelNodeMaterial material = 2;

	Vector position = 3;
	Vector scale = 4;
	Quaternion rotation = 5;

	Color color = 6;
	bool isNeon = 7;
}

message LevelNodeCrumbling
{
	LevelNodeShape shape = 1;
	LevelNodeMaterial material = 2;

	Vector position = 3;
	Vector scale = 4;
	Quaternion rotation = 5;

	float stableTime = 6;
	float respawnTime = 7;
}

message LevelNodeSign
{
	Vector position = 1;
	Quaternion rotation = 2;

	string text = 3;
}

message LevelNodeGravity
{
	enum Mode
	{
		DEFAULT = 0;
		NOLEGS = 1; //gtag like movement with the head on the ground, also no leg collisions with lava
	}

	Mode mode = 1;

	Vector position = 2;
	Vector scale = 3;
	Quaternion rotation = 4;

	Vector direction = 5;
}

message AnimationFrame
{
	float time = 1;
	Vector position = 2;
	Quaternion rotation = 3;
}

message Animation
{
	enum Direction
	{
		RESTART = 0;
		PINGPONG = 1;
	}

	string name = 1;
	repeated AnimationFrame frames = 2;
	Direction direction = 3;
	float speed = 4;
}

message LevelNode
{
	bool isLocked = 6;

	oneof content
	{
		LevelNodeStart levelNodeStart = 1;
		LevelNodeFinish levelNodeFinish = 2;
		LevelNodeStatic levelNodeStatic = 3;
		LevelNodeSign levelNodeSign = 4;
		LevelNodeCrumbling levelNodeCrumbling = 5;
		LevelNodeGroup levelNodeGroup = 7;
		LevelNodeGravity levelNodeGravity = 8;
	}

	repeated Animation animations = 15;
}
`
const vertexShader = /*glsl*/`

varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform mat3 worldNormalMatrix;

void main()
{
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vNormal = worldNormalMatrix * normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const fragmentShader = /*glsl*/`

varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform vec3 colors;
uniform float opacity;
uniform sampler2D colorTexture;
uniform float tileFactor;

const float gamma = 0.5;

void main()
{
    vec4 color = vec4(colors, opacity);
    vec3 blendNormals = abs(vNormal);
    vec3 texSample;
    vec4 adjustment = vec4(1.0, 1.0, 1.0, 1.0);

    if(blendNormals.x > blendNormals.y && blendNormals.x > blendNormals.z)
    {
        texSample = texture2D(colorTexture, vWorldPosition.zy * tileFactor).rgb;
    }
    else if(blendNormals.y > blendNormals.z)
    {
        texSample = texture2D(colorTexture, vWorldPosition.xz * tileFactor).rgb;
    }
    else
    {
        texSample = texture2D(colorTexture, vWorldPosition.xy * tileFactor).rgb;
    }

    texSample = pow(texSample, vec3(1.0 / gamma));

    color.rgb *= texSample * adjustment.rgb;
    gl_FragColor = LinearTosRGB(color);
}`;
const startFinishVS = /*glsl*/`
varying vec2 vTexcoord;

void main()
{
    vTexcoord = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const startFinishFS = /*glsl*/`
varying vec2 vTexcoord;

uniform vec4 diffuseColor;

void main()
{
    vec4 color = diffuseColor;
    float factor = vTexcoord.y;
    factor *= factor * factor;
    factor = clamp(factor, 0.0, 1.0);
    color.a = factor;

    gl_FragColor = color;
}`;

function getLevel() {
    return JSON.parse(document.getElementById('edit-input').innerText);
}
function setLevel(level) {
    console.log(level);
    if (level.formatVersion != 6) {
        document.getElementById('warning').style.display = "block";
    } else {
        document.getElementById('warning').style.display = "none";
    }
    level.levelNodes ? {} : level.levelNodes = [];
    level.levelNodes.forEach(node => {
        if (node.hasOwnProperty('levelNodeStatic')) {
            node.levelNodeStatic.color ? {} : node.levelNodeStatic.color = {};
            node.levelNodeStatic.color.r ? {} : node.levelNodeStatic.color.r = 0;
            node.levelNodeStatic.color.g ? {} : node.levelNodeStatic.color.g = 0;
            node.levelNodeStatic.color.b ? {} : node.levelNodeStatic.color.b = 0;
        }
    });

    document.getElementById('edit-input').innerText = JSON.stringify(level, null, 4);
    highlightTextEditor();
}
function highlightTextEditor() {
    if (!HIDE_TEXT) {
        let textEditor = document.getElementById('edit-input');
        
        const editText = JSON.stringify(JSON.parse(textEditor.innerText), null, 4);
        if (HIGHLIGHT_TEXT) {

            let highlightedText = editText.replace(/"color":\s*{\s*("r":\s*(\d+(?:\.\d+)?),)?\s*("g":\s*(\d+(?:\.\d+)?),)?\s*("b":\s*(\d+(?:\.\d+)?),)?\s*("a":\s*\d+(?:\.\d+)?)?\s*}/, (match) => {
                let jsonData = JSON.parse(`{${match}}`);
                let color = `rgba(${(jsonData.color.r || 0) * 255}, ${(jsonData.color.g || 0) * 255}, ${(jsonData.color.b || 0) * 255}, 0.3)`;
                return `<span style='text-shadow: 0 0 10px ${color}, 0 0 10px ${color}, 0 0 10px ${color}, 0 0 10px ${color}, 0 0 10px ${color}, 0 0 10px ${color};'>${match}</span>`
            });

            highlightedText = highlightedText.replace(/([bruf]*)(\"""|")(?:(?!\2)(?:\\.|[^\\]))*\2:?/gs, (match) => {
            if (match.endsWith(":")) {
                return `<span style="color: #dd612e">${match.slice(0,-1)}</span><span style="color: #007acc">:</span>`;
            } else {
                return `<span style="color: #487e02">${match}</span>`;
            }
            });
            highlightedText = highlightedText.replace(/"levelNodeFinish"/gsi, (match) => {
                return `<span style="background: #f006;">${match}</span>`
            });
            highlightedText = highlightedText.replace(/"levelNodeStart"/gsi, (match) => {
                return `<span style="background: #0f06;">${match}</span>`
            });
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

            textEditor.innerHTML = highlightedText;
        } else {
            textEditor.innerHTML = editText;
        }
    }
    refreshScene();
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
            const glftScene = gltf.scene;
            // if (path == 'models/editor/pyramid.glb' || path == 'models/editor/prism.glb') {
            //     glftScene.children[0].geometry.rotateX(Math.PI);
            // }
            resolve(glftScene.children[0]);
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
            let material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    "colorTexture": { value: texture },
                    "tileFactor": { value: 1.1 },
                    "worldNormalMatrix": { value: new THREE.Matrix3() },
                    "colors": { value: new THREE.Vector3(1.0, 1.0, 1.0) },
                    "opacity": { value: 1.0 },
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
        downloadAndOpenLevel(paramId);
    }

}
function refreshScene() {
    let levelData = getLevel();
    let levelNodes = levelData["levelNodes"];
    
    let complexity = 0;
    objects = [];
    scene.clear();
    
    levelNodes.forEach((node) => {
        complexity += loadLevelNode(node, scene);
    });
    
    document.getElementById('complexity').innerText = `Complexity: ${complexity}`;
    
    
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

    document.getElementById('render-container').style.backgroundImage = `linear-gradient(rgb(${sky[0][0]}, ${sky[0][1]}, ${sky[0][2]}), rgb(${sky[1][0]}, ${sky[1][1]}, ${sky[1][2]}), rgb(${sky[0][0]}, ${sky[0][1]}, ${sky[0][2]}))`;

    renderer.render( scene, camera );
}
function loadLevelNode(node, parent) {
    if (node.levelNodeGroup) {
        node = node.levelNodeGroup;
        let cube = new THREE.Object3D()
        objects.push( cube );
        parent.add( cube );
        node.position.x ? cube.position.x = node.position.x : cube.position.x = 0;
        node.position.y ? cube.position.y = node.position.y : cube.position.y = 0;
        node.position.z ? cube.position.z = node.position.z : cube.position.z = 0;
        node.scale.x ? cube.scale.x = node.scale.x : cube.scale.x = 0;
        node.scale.y ? cube.scale.y = node.scale.y : cube.scale.y = 0;
        node.scale.z ? cube.scale.z = node.scale.z : cube.scale.z = 0;
        node.rotation.x ? cube.quaternion.x = node.rotation.x : cube.quaternion.x = 0;
        node.rotation.y ? cube.quaternion.y = node.rotation.y : cube.quaternion.y = 0;
        node.rotation.z ? cube.quaternion.z = node.rotation.z : cube.quaternion.z = 0;
        node.rotation.w ? cube.quaternion.w = node.rotation.w : cube.quaternion.w = 0;
        let groupComplexity = 0;
        node.childNodes.forEach(node => {
            groupComplexity += loadLevelNode(node, cube);
        });
        return groupComplexity;
    } else if (node.levelNodeGravity) {
        node = node.levelNodeGravity;

        let particleGeometry = new THREE.BufferGeometry();

        let particleColor = new THREE.Color(1.0, 1.0, 1.0);
        if (node?.mode == 1) {
            particleColor = new THREE.Color(1.0, 0.6, 0.6);
        }
        let particleMaterial = new THREE.PointsMaterial({ color: particleColor, size: 0.05 });

        let object = new THREE.Object3D()
        object.position.x = node.position.x
        object.position.y = node.position.y
        object.position.z = node.position.z

        object.scale.x = node.scale.x
        object.scale.y = node.scale.y
        object.scale.z = node.scale.z

        object.quaternion.x = node.rotation.x
        object.quaternion.y = node.rotation.y
        object.quaternion.z = node.rotation.z
        object.quaternion.w = node.rotation.w

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
        parent.add(object);
        objects.push(object);

        return 10;
    } else if (node.levelNodeStatic) { 
        node = node.levelNodeStatic;
        let cube;
        if (node.shape-1000 >= 0 && node.shape-1000 < shapes.length) {
            cube = shapes[node.shape-1000].clone();
        } else {
            cube = shapes[0].clone();
        }
        let material;
        if (node.material >= 0 && node.material < materials.length) {
            if (altTextures) {
                node.material ? material = exportMaterials[node.material].clone() : material = exportMaterials[0].clone();    
            } else {
                node.material ? material = materials[node.material].clone() : material = materials[0].clone();    
            }
        } else if (!altTextures) {
            material = materials[0].clone();
        } else {
            material = exportMaterials[0].clone();
        }
        if (node.material == 8) {
            node.color.r ? null : node.color.r = 0;
            node.color.g ? null : node.color.g = 0;
            node.color.b ? null : node.color.b = 0;
            if (altTextures) {
                material.color = new THREE.Color(node.color.r, node.color.g, node.color.b);
            } else {
                material.uniforms.colors.value = new THREE.Vector3(node.color.r, node.color.g, node.color.b);
            }
        }
        cube.material = material;
        node.position.x ? cube.position.x = node.position.x : cube.position.x = 0;
        node.position.y ? cube.position.y = node.position.y : cube.position.y = 0;
        node.position.z ? cube.position.z = node.position.z : cube.position.z = 0;
        node.rotation.w ? cube.quaternion.w = node.rotation.w : cube.quaternion.w = 0;
        node.rotation.x ? cube.quaternion.x = node.rotation.x : cube.quaternion.x = 0;
        node.rotation.y ? cube.quaternion.y = node.rotation.y : cube.quaternion.y = 0;
        node.rotation.z ? cube.quaternion.z = node.rotation.z : cube.quaternion.z = 0;
        node.scale.x ? cube.scale.x = node.scale.x : cube.scale.x = 0;
        node.scale.y ? cube.scale.y = node.scale.y : cube.scale.y = 0;
        node.scale.z ? cube.scale.z = node.scale.z : cube.scale.z = 0;

        if (!altTextures) {
            // console.log(material);
            let targetVector = new THREE.Vector3();
            let targetQuaternion = new THREE.Quaternion();
            let worldMatrix = new THREE.Matrix4();
            worldMatrix.compose(
                cube.getWorldPosition(targetVector), 
                cube.getWorldQuaternion(targetQuaternion), 
                cube.getWorldScale(targetVector)
            );

            let normalMatrix = new THREE.Matrix3();
            normalMatrix.getNormalMatrix(worldMatrix);
            material.uniforms.worldNormalMatrix.value = normalMatrix;
        }

        parent.add(cube);
        objects.push(cube);
        return 2;
    } else if (node.levelNodeCrumbling) {
        node = node.levelNodeCrumbling;
        let cube, material;
        if (node.shape-1000 >= 0 && node.shape-1000 < shapes.length) {
            cube = shapes[node.shape-1000].clone();
        } else {
            cube = shapes[0].clone();
        }
        if (node.material >= 0 && node.material < materials.length) {
            if (altTextures) {
                node.material ? material = exportMaterials[node.material] : material = exportMaterials[0];
            } else {
                node.material ? material = materials[node.material] : material = materials[0];
            }
        } else if (!altTextures) {
            material = exportMaterials[0];
        } else {
            material = materials[0];
        }
        cube.material = material;
        node.position.x ? cube.position.x = node.position.x : cube.position.x = 0;
        node.position.y ? cube.position.y = node.position.y : cube.position.y = 0;
        node.position.z ? cube.position.z = node.position.z : cube.position.z = 0;
        node.rotation.w ? cube.quaternion.w = node.rotation.w : cube.quaternion.w = 0;
        node.rotation.x ? cube.quaternion.x = node.rotation.x : cube.quaternion.x = 0;
        node.rotation.y ? cube.quaternion.y = node.rotation.y : cube.quaternion.y = 0;
        node.rotation.z ? cube.quaternion.z = node.rotation.z : cube.quaternion.z = 0;
        node.scale.x ? cube.scale.x = node.scale.x : cube.scale.x = 0;
        node.scale.y ? cube.scale.y = node.scale.y : cube.scale.y = 0;
        node.scale.z ? cube.scale.z = node.scale.z : cube.scale.z = 0;

        if (!altTextures) {
            let targetVector = new THREE.Vector3();
            let targetQuaternion = new THREE.Quaternion();
            let worldMatrix = new THREE.Matrix4();
            worldMatrix.compose(
                cube.getWorldPosition(targetVector), 
                cube.getWorldQuaternion(targetQuaternion), 
                cube.getWorldScale(targetVector)
            );

            let normalMatrix = new THREE.Matrix3();
            normalMatrix.getNormalMatrix(worldMatrix);
            material.uniforms.worldNormalMatrix.value = normalMatrix;
        }

        parent.add(cube);
        objects.push(cube);
        return 3;
    } else if (node.levelNodeSign) {
        node = node.levelNodeSign;
        let cube = shapes[5].clone();
        if (altTextures) {
            cube.material = exportMaterials[4];
        } else {
            cube.material = materials[4];
        }
        node.position.x ? cube.position.x = node.position.x : cube.position.x = 0;
        node.position.y ? cube.position.y = node.position.y : cube.position.y = 0;
        node.position.z ? cube.position.z = node.position.z : cube.position.z = 0;
        node.rotation.w ? cube.quaternion.w = node.rotation.w : cube.quaternion.w = 0;
        node.rotation.x ? cube.quaternion.x = node.rotation.x : cube.quaternion.x = 0;
        node.rotation.y ? cube.quaternion.y = node.rotation.y : cube.quaternion.y = 0;
        node.rotation.z ? cube.quaternion.z = node.rotation.z : cube.quaternion.z = 0;
        parent.add(cube);
        objects.push(cube);
        return 5;
    } else if (node.levelNodeStart) {
        node = node.levelNodeStart;
        let cube = shapes[6].clone();
        // cube.material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
        cube.material = startMaterial;
        node.position.x ? cube.position.x = node.position.x : cube.position.x = 0;
        node.position.y ? cube.position.y = node.position.y : cube.position.y = 0;
        node.position.z ? cube.position.z = node.position.z : cube.position.z = 0;
        node.rotation.w ? cube.quaternion.w = node.rotation.w : cube.quaternion.w = 0;
        node.rotation.x ? cube.quaternion.x = node.rotation.x : cube.quaternion.x = 0;
        node.rotation.y ? cube.quaternion.y = node.rotation.y : cube.quaternion.y = 0;
        node.rotation.z ? cube.quaternion.z = node.rotation.z : cube.quaternion.z = 0;
        node.radius ? cube.scale.x = node.radius : cube.scale.x = 0;
        node.radius ? cube.scale.z = node.radius : cube.scale.z = 0;
        parent.add(cube);
        objects.push(cube);
        return 0;
    } else if (node.levelNodeFinish) {
        node = node.levelNodeFinish;
        let cube = shapes[6].clone();
        // cube.material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
        cube.material = finishMaterial;
        node.position.x ? cube.position.x = node.position.x : cube.position.x = 0;
        node.position.y ? cube.position.y = node.position.y : cube.position.y = 0;
        node.position.z ? cube.position.z = node.position.z : cube.position.z = 0;
        node.radius ? cube.scale.x = node.radius : cube.scale.x = 0;
        node.radius ? cube.scale.z = node.radius : cube.scale.z = 0;
        parent.add(cube);
        objects.push(cube);
        return 0;
    } else {
        return 0;
    }
}
function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}
function readArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        let reader = new FileReader();
        reader.onload = function() {
            let data = reader.result;
            let {root} = protobuf.parse(PROTOBUF_DATA, { keepCase: true });
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
    fetch(`https://api.slin.dev/grab/v1/details/${id.replace(":", "/")}`)
        .then(response => response.json())
        .then(data => {
            openProto(`https://api.slin.dev/grab/v1/download/${data.data_key.replaceAll(":", "/").replace("level_data/", "")}`);
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
    let {root} = protobuf.parse(PROTOBUF_DATA, { keepCase: true });
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
	exporter.parse(
	    scene,
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
    let {root} = protobuf.parse(PROTOBUF_DATA, { keepCase: true });
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
function runOnNodes(levelNodes, func, doGroups = true) {
    levelNodes.forEach((node) => {
        let isGroup = node.hasOwnProperty("levelNodeGroup");
        if ((isGroup && doGroups) || !isGroup) {
            func(node);
        }
        if (isGroup) {
            runOnNodes(node.levelNodeGroup.childNodes, func, doGroups);
        }
    });
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
function randomizeLevel() {
    let obj = getLevel();
    runOnNodes(obj.levelNodes, (node) => {
        if (Object.values(node)[0].hasOwnProperty("posiiton")) {
            Object.values(node)[0].position.x *= Math.random() + 0.5;
            Object.values(node)[0].position.y *= Math.random() + 0.5;
            Object.values(node)[0].position.z *= Math.random() + 0.5;
        }
        if (Object.values(node)[0].hasOwnProperty("scale")) {
            Object.values(node)[0].scale.x *= Math.random() + 0.5;
            Object.values(node)[0].scale.y *= Math.random() + 0.5;
            Object.values(node)[0].scale.z *= Math.random() + 0.5;
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
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
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
function groupLevel() {
    let levelData = getLevel();
    levelData.levelNodes = [{
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
            "childNodes": levelData.levelNodes
        }
    }];
    setLevel(levelData);
}
function ungroupLevel() {
    let levelData = getLevel();
    levelData.levelNodes = levelData.levelNodes[0].levelNodeGroup.childNodes;
    setLevel(levelData);
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
    }
}
function loadTemplateButtons() {
    let container = document.getElementById('templates-container');
    container.innerHTML = '';
    templates.forEach(template => {
        let templateElement = document.createElement('div');
        templateElement.classList.add('template');
        templateElement.innerText = template.name;
        templateElement.addEventListener('click', () => {
            if (template.type == 'identifier') {
                downloadAndOpenLevel(template.link);
            } else if (template.type == 'file') {
                openProto(template.link);
            }
        });
        container.appendChild(templateElement);
    });
}

loader = new GLTFLoader();
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize( window.innerWidth , window.innerHeight );
document.getElementById('render-container').appendChild( renderer.domElement );
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
addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
});
// let equiManaged = new CubemapToEquirectangular( renderer, true );
// setTimeout(()=>{equiManaged.update( camera, scene );}, 10000);
camera.position.set(0, 10, 10);
initAttributes();
animate();
highlightTextEditor();

// Terminal 
document.getElementById('terminal-input').addEventListener('keydown', (e) => {
    if (e.which === 13 && e.shiftKey === false && e.altKey === false) {
        e.preventDefault();
        let input = document.getElementById('terminal-input').value;
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
        document.getElementById("terminal-input").placeholder = `[Enter] to run JS code in loop\n[Alt] & [Enter] to run JS code out of loop\n[Alt] & [UpArrow] for last ran\nvar level = getLevel()\nlevel.levelNodes.forEach(node => {})\n\n${success} success | ${fail} error${fail != 0 ? "\n[ctrl]+[shift]+[i] for details" : ""}`;
        setLevel(level);
        lastRan = input
        document.getElementById('terminal-input').value = '';
    } else if (e.which === 13 && e.altKey === true && e.shiftKey === false) {
        e.preventDefault();
        let input = document.getElementById('terminal-input').value;
        let level = getLevel();
        try {
            eval(input);
            document.getElementById("terminal-input").placeholder = `[Enter] to run JS code in loop\n[Alt] & [Enter] to run JS code out of loop\n[Alt] & [UpArrow] for last ran\nvar level = getLevel()\nlevel.levelNodes.forEach(node => {})\n\nsuccess`;
        } catch (e) {
            console.error(e);
            document.getElementById("terminal-input").placeholder = `[Enter] to run JS code in loop\n[Alt] & [Enter] to run JS code out of loop\n[Alt] & [UpArrow] for last ran\nvar level = getLevel()\nlevel.levelNodes.forEach(node => {})\n\nerror | [ctrl]+[shift]+[i] for details`;
        }
        
        setLevel(level);
        lastRan = input
        document.getElementById('terminal-input').value = '';
    } else if (e.which === 38 && e.altKey === true) {
        e.preventDefault();
        document.getElementById('terminal-input').value = lastRan;
    }
});

// prompts
document.getElementById('title-btn').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'grid';
    document.getElementById('prompt-title').style.display = 'flex';
});
document.querySelector('#prompt-title .prompt-cancel').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-title').style.display = 'none';
    document.getElementById('title-prompt').value = '';
});
document.querySelector('#prompt-title .prompt-submit').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-title').style.display = 'none';
    let input = document.getElementById('title-prompt').value;
    let levelData = getLevel();
    levelData.title = input;
    setLevel(levelData);
    document.getElementById('title-prompt').value = '';
});
document.getElementById('description-btn').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'grid';
    document.getElementById('prompt-description').style.display = 'flex';
});
document.getElementById('quest-btn').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'grid';
    document.getElementById('prompt-levels').style.display = 'flex';
    listQuestLevels();
});
document.querySelector('#prompt-levels .prompt-cancel').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-levels').style.display = 'none';
});
document.getElementById('template-btn').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'grid';
    document.getElementById('prompt-templates').style.display = 'flex';
    loadTemplateButtons();
});
document.querySelector('#prompt-templates .prompt-cancel').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-templates').style.display = 'none';
});
document.querySelector('#prompt-description .prompt-cancel').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-description').style.display = 'none';
    document.getElementById('description-prompt').value = '';
});
document.querySelector('#prompt-description .prompt-submit').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-description').style.display = 'none';
    let input = document.getElementById('description-prompt').value;
    let levelData = getLevel();
    levelData.description = input;
    setLevel(levelData);
    document.getElementById('description-prompt').value = '';
});
document.getElementById('creators-btn').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'grid';
    document.getElementById('prompt-creators').style.display = 'flex';
});
document.querySelector('#prompt-creators .prompt-cancel').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-creators').style.display = 'none';
    document.getElementById('creators-prompt').value = '';
});
document.querySelector('#prompt-creators .prompt-submit').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-creators').style.display = 'none';
    let input = document.getElementById('creators-prompt').value;
    let levelData = getLevel();
    levelData.creators = input;
    setLevel(levelData);
    document.getElementById('creators-prompt').value = '';
});
document.getElementById('checkpoints-btn').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'grid';
    document.getElementById('prompt-checkpoints').style.display = 'flex';
});
document.querySelector('#prompt-checkpoints .prompt-cancel').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-checkpoints').style.display = 'none';
    document.getElementById('checkpoints-prompt').value = '';
});
document.querySelector('#prompt-checkpoints .prompt-submit').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-checkpoints').style.display = 'none';
    let input = document.getElementById('checkpoints-prompt').value;
    let levelData = getLevel();
    levelData.maxCheckpointCount = parseInt(input);
    setLevel(levelData);
    document.getElementById('checkpoints-prompt').value = '';
});
document.querySelector('#prompt-pixel .prompt-cancel').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-pixel').style.display = 'none';
    document.getElementById('pixel-prompt').value = '';
});
document.querySelector('#prompt-pixel .prompt-submit').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-pixel').style.display = 'none';
    generatePixelArt();
});
document.getElementById('image-btn-input').addEventListener('change', (e) => {
    document.getElementById('prompts').style.display = 'grid';
    document.getElementById('prompt-pixel').style.display = 'flex';
});
document.getElementById('protobuf-btn').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'grid';
    document.getElementById('prompt-protobuf').style.display = 'flex';
    document.getElementById('protobuf-prompt').value = PROTOBUF_DATA;
});
document.querySelector('#prompt-protobuf .prompt-cancel').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-protobuf').style.display = 'none';
    document.getElementById('protobuf-prompt').value = PROTOBUF_DATA;
});
document.querySelector('#prompt-protobuf .prompt-submit').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-protobuf').style.display = 'none';
    PROTOBUF_DATA = document.getElementById('protobuf-prompt').value;
});
// buttons
document.getElementById('hide-btn').addEventListener('click', () => {document.getElementById('edit-input').style.display = HIDE_TEXT ? 'block' : 'none';HIDE_TEXT = !HIDE_TEXT;highlightTextEditor()});
document.getElementById('highlight-btn').addEventListener('click', () => {HIGHLIGHT_TEXT = !HIGHLIGHT_TEXT;highlightTextEditor()});
document.getElementById('performance-btn').addEventListener('click', () => {renderer.getPixelRatio() == 1 ? renderer.setPixelRatio( window.devicePixelRatio / 10 ) : renderer.setPixelRatio( 1 )});
document.getElementById('range-btn').addEventListener('click', () => {loadProtobuf("proto/hacked.proto")});
document.getElementById("self-credit").addEventListener("click", (e) => {e.target.style.display = 'none'});
document.getElementById('edit-input').addEventListener('keydown', (e) => {handleEditInput(e)});
document.getElementById('start-btn').addEventListener('click', goToStart);
document.getElementById('altTextures-btn').addEventListener('click', toggleTextures);
document.getElementById('edit-input').addEventListener('blur', highlightTextEditor);
document.getElementById('json-btn').addEventListener('click', downloadAsJSON);
document.getElementById('gltf-btn').addEventListener('click', exportLevelAsGLTF);
document.getElementById('toquest-btn').addEventListener('click', saveToQuest);
document.getElementById('connect-adb-btn').addEventListener('click', connectUsb);
document.getElementById('cleardetails-btn').addEventListener('click', clearLevelDetails);
document.getElementById('group-btn').addEventListener('click', groupLevel);
document.getElementById('ungroup-btn').addEventListener('click', ungroupLevel);
document.getElementById('outline-btn').addEventListener('click', outlineLevel);
document.getElementById('magic-outline-btn').addEventListener('click', magicOutline);
document.getElementById('randomize-btn').addEventListener('click', randomizeLevel);
document.getElementById('randomizematerials-btn').addEventListener('click', randomizeLevelMaterials);
document.getElementById('explode-btn').addEventListener('click', explodeLevel);
document.getElementById('duplicate-btn').addEventListener('click', duplicateLevel);
document.getElementById('topc-btn').addEventListener('click', () => {downloadProto(getLevel())});
document.getElementById('empty-btn').addEventListener( 'click', () => {openJSON('level_data/json_files/empty.json')});
document.getElementById('the-index-btn').addEventListener('click', () => {openProto('level_data/the-index.level')});
document.getElementById('all-objects-btn').addEventListener('click', () => {openProto('level_data/cheat-sheet-6.level')});
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
document.getElementById('nodeCrumbling-btn').addEventListener('click', () => {appendJSON("level_data/json_files/crumbling-node.json")});
document.getElementById('nodeColored-btn').addEventListener('click', () => {appendJSON("level_data/json_files/colored-node.json")});
document.getElementById('nodeSign-btn').addEventListener('click', () => {appendJSON("level_data/json_files/sign-node.json")});
document.getElementById('nodeStart-btn').addEventListener('click', () => {appendJSON("level_data/json_files/start-node.json")});
document.getElementById('nodeFinish-btn').addEventListener('click', () => {appendJSON("level_data/json_files/finish-node.json")});
document.getElementById('nodeGravity-btn').addEventListener('click', () => {appendJSON("level_data/json_files/gravity-node.json")});
document.getElementById('nodeInvisible-btn').addEventListener('click', () => {appendJSON("level_data/json_files/invisible-node.json")});
// insert prefabs
document.getElementById('Parallelograms-btn').addEventListener('click', () => {appendJSON("level_data/json_files/parallelograms.json")});
document.getElementById('BreakTimes-btn').addEventListener('click', () => {appendJSON("level_data/json_files/break-times.json")});
document.getElementById('FreeStartFinish-btn').addEventListener('click', () => {appendJSON("level_data/json_files/free-start-finish.json")});
document.getElementById('TexturedSigns-btn').addEventListener('click', () => {appendJSON("level_data/json_files/textured-signs.json")});
document.getElementById('SpecialStones-btn').addEventListener('click', () => {appendJSON("level_data/json_files/special-stones.json")});
document.getElementById('NoHitbox-btn').addEventListener('click', () => {appendJSON("level_data/json_files/no-hitbox.json")});
document.getElementById('Inverted-btn').addEventListener('click', () => {appendJSON("level_data/json_files/inverted.json")});