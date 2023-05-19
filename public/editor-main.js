// Setup
import * as THREE from 'https://unpkg.com/three@0.145.0/build/three.module.js';
import { TransformControls } from 'https://unpkg.com/three@0.145.0/examples/jsm/controls/TransformControls.js';
import { TrackballControls } from 'https://unpkg.com/three@0.145.0/examples/jsm/controls/TrackballControls.js';
import { OrbitControls } from 'https://unpkg.com/three@0.145.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@v0.132.0/examples/jsm/loaders/GLTFLoader.js';
import { FlyControls } from 'https://unpkg.com/three@0.145.0/examples/jsm/controls/FlyControls.js';

var camera, scene, renderer, light, controls, fly, transforms, trackball, loader, sun;
var objects = [];
var materials = [];
var shapes = [];


// Terminal 
var lastRan = '';
document
    .getElementById('terminal-input')
    .addEventListener('keydown', (e) => {
        if (e.which === 13 && e.shiftKey === false && e.altKey === false) {
            e.preventDefault();
            var input = document
                .getElementById('terminal-input')
                .value;
            var level = getLevel();
            var success = 0;
            var fail = 0;
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
            document
                .getElementById('terminal-input')
                .value = '';
        } else if (e.which === 13 && e.altKey === true && e.shiftKey === false) {
            e.preventDefault();
            var input = document
                .getElementById('terminal-input')
                .value;
            var level = getLevel();
            try {
                eval(input);
                document.getElementById("terminal-input").placeholder = `[Enter] to run JS code in loop\n[Alt] & [Enter] to run JS code out of loop\n[Alt] & [UpArrow] for last ran\nvar level = getLevel()\nlevel.levelNodes.forEach(node => {})\n\nsuccess`;
            } catch (e) {
                console.error(e);
                document.getElementById("terminal-input").placeholder = `[Enter] to run JS code in loop\n[Alt] & [Enter] to run JS code out of loop\n[Alt] & [UpArrow] for last ran\nvar level = getLevel()\nlevel.levelNodes.forEach(node => {})\n\nerror | [ctrl]+[shift]+[i] for details`;
            }
            
            setLevel(level);
            lastRan = input
            document
                .getElementById('terminal-input')
                .value = '';
        } else if (e.which === 38 && e.altKey === true) {
            e.preventDefault();
            document
                .getElementById('terminal-input')
                .value = lastRan;
        }
    });

// Highlighting
function highlightTextEditor() {
    if (!HIDE_TEXT) {
        var textEditor = document.getElementById('edit-input');
        
        const editText = JSON.stringify(JSON.parse(textEditor.innerText), null, 4);
        if (HIGHLIGHT_TEXT) {

            var highlightedText = editText.replace(/"color":\s*{\s*("r":\s*(\d+(?:\.\d+)?),)?\s*("g":\s*(\d+(?:\.\d+)?),)?\s*("b":\s*(\d+(?:\.\d+)?),)?\s*("a":\s*\d+(?:\.\d+)?)?\s*}/, (match) => {
                var jsonData = JSON.parse(`{${match}}`);
                var color = `rgba(${(jsonData.color.r || 0) * 255}, ${(jsonData.color.g || 0) * 255}, ${(jsonData.color.b || 0) * 255}, 0.3)`;
                // return `<span style='background-color: ${color};'>"color"</span>${match.replace('"color"', "")}`
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
                        return `<span style="background-image: url(textures/default.png); background-size: contain">${match}</span>`;
                    case 1:
                        return `<span style="background-image: url(textures/grabbable.png); background-size: contain">${match}</span>`;
                    case 2:
                        return `<span style="background-image: url(textures/ice.png); background-size: contain">${match}</span>`;
                    case 3:
                        return `<span style="background-image: url(textures/lava.png); background-size: contain">${match}</span>`;
                    case 4:
                        return `<span style="background-image: url(textures/wood.png); background-size: contain">${match}</span>`;
                    case 5:
                        return `<span style="background-image: url(textures/grapplable.png); background-size: contain">${match}</span>`;
                    case 6:
                        return `<span style="background-image: url(textures/grapplable_lava.png); background-size: contain">${match}</span>`;
                    case 7:
                        return `<span style="background-image: url(textures/grabbable_crumbling.png); background-size: contain">${match}</span>`;
                    case 8:
                        return `<span style="background-image: url(textures/default_colored.png); background-size: contain">${match}</span>`;
                    case 9:
                        return `<span style="background-image: url(textures/bouncing.png); background-size: contain">${match}</span>`;
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
}
var textEditor = document.getElementById('edit-input').addEventListener('blur', () => {highlightTextEditor(); refreshScene();});

var textEditor = document.getElementById('edit-input').addEventListener('keydown', (e) => {
    if (e.which === 9) {
        e.preventDefault();
        let selection = window.getSelection();
        selection.collapseToStart();
        let range = selection.getRangeAt(0);
        range.insertNode(document.createTextNode("    "));
        selection.collapseToEnd();
    }
});






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


function initAttributes() {
    const attribPromises = [];
    let texture;
    [
    'textures/default.png',
    'textures/grabbable.png',
    'textures/ice.png',
    'textures/lava.png',
    'textures/wood.png',
    'textures/grapplable.png',
    'textures/grapplable_lava.png',
    'textures/grabbable_crumbling.png',
    'textures/default_colored.png',
    'textures/bouncing.png'
    ].forEach(path => {
        const attribPromise = new Promise((resolve) => {
            texture = new THREE.TextureLoader().load(path, function( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set( 2, 2 );
            });
            let material = new THREE.MeshBasicMaterial({ map: texture });
            materials.push(material);
            resolve();
        });
        attribPromises.push(attribPromise);
    });
    [
        'models/editor/cube.glb',
        'models/editor/sphere.glb',
        'models/editor/cylinder.glb',
        'models/editor/pyramid.glb',
        'models/editor/prism.glb',
        'models/editor/sign.glb',
        'models/editor/start_end.glb'
    ].forEach(path => {
        const attribPromise = new Promise((resolve) => {
            loader.load(path, function( gltf ) {
                let glftScene = gltf.scene;
                shapes.push(glftScene.children[0]);
                resolve();
            });
        });
        attribPromises.push(attribPromise);
    });
    Promise.all(attribPromises).then(() => {
        console.log('Ready');
    });
}


function loadLevelNode(node, parent) {
    if (node.levelNodeGroup) {
        let cube = new THREE.Object3D()
        objects.push( cube );
        parent.add( cube );
        node.levelNodeGroup.position.x ? cube.position.x = node.levelNodeGroup.position.x : cube.position.x = 0;
        node.levelNodeGroup.position.y ? cube.position.y = node.levelNodeGroup.position.y : cube.position.y = 0;
        node.levelNodeGroup.position.z ? cube.position.z = node.levelNodeGroup.position.z : cube.position.z = 0;
        node.levelNodeGroup.scale.x ? cube.scale.x = node.levelNodeGroup.scale.x : cube.scale.x = 0;
        node.levelNodeGroup.scale.y ? cube.scale.y = node.levelNodeGroup.scale.y : cube.scale.y = 0;
        node.levelNodeGroup.scale.z ? cube.scale.z = node.levelNodeGroup.scale.z : cube.scale.z = 0;
        node.levelNodeGroup.rotation.x ? cube.quaternion.x = node.levelNodeGroup.rotation.x : cube.quaternion.x = 0;
        node.levelNodeGroup.rotation.y ? cube.quaternion.y = node.levelNodeGroup.rotation.y : cube.quaternion.y = 0;
        node.levelNodeGroup.rotation.z ? cube.quaternion.z = node.levelNodeGroup.rotation.z : cube.quaternion.z = 0;
        node.levelNodeGroup.rotation.w ? cube.quaternion.w = node.levelNodeGroup.rotation.w : cube.quaternion.w = 0;
        let groupComplexity = 0;
        node.levelNodeGroup.childNodes.forEach(node => {
            groupComplexity += loadLevelNode(node, cube);
        });
        return groupComplexity;
    } else if (node.levelNodeStatic) { 
        node = node.levelNodeStatic;
        var cube = shapes[node.shape-1000].clone();
        let material;
        node.material ? material = materials[node.material].clone() : material = materials[0].clone();
        if (node.material == 8) {
            // let colorMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(node.color.r, node.color.g, node.color.b) });
            // material.transparent = true;
            // material.opacity = 0.5;
            // material = [ colorMaterial, material ];
            node.color.r ? null : node.color.r = 0;
            node.color.g ? null : node.color.g = 0;
            node.color.b ? null : node.color.b = 0;
            material.color = new THREE.Color(node.color.r, node.color.g, node.color.b);
        }
        cube.material = material;
        // var cube = new THREE.Mesh(shapes[node.shape-1000], materials[node.material]);
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
        parent.add(cube);
        objects.push(cube);
        return 2;
    } else if (node.levelNodeCrumbling) {
        node = node.levelNodeCrumbling;
        var cube = shapes[node.shape-1000].clone();
        node.material ? cube.material = materials[node.material] : cube.material = materials[0];
        // var cube = new THREE.Mesh(shapes[node.shape-1000], materials[node.material]);
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
        parent.add(cube);
        objects.push(cube);
        return 3;
    } else if (node.levelNodeSign) {
        node = node.levelNodeSign;
        var cube = shapes[5].clone();
        cube.material = materials[4];
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
        var cube = shapes[6].clone();
        cube.material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
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
        var cube = shapes[6].clone();
        cube.material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
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

camera.position.set(0, 10, 10);

initAttributes();

function refreshScene() {
    var levelData = getLevel();
    let levelNodes = levelData["levelNodes"];
    
    let complexity = 0;
    objects = [];
    scene.clear();
    
    levelNodes.forEach((node) => {
        complexity += loadLevelNode(node, scene);
    });
    
    // console.log(complexity);
    document.getElementById('complexity').innerText = `Complexity: ${complexity}`;
    
    
    var ambience = levelData.ambienceSettings;
    var sky = [
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

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}

animate();


// proto functions

function readArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        let reader = new FileReader();
        reader.onload = function() {
            let data = reader.result;
            var root = protobuf.parse(PROTOBUF_DATA, { keepCase: true }).root;
            // protobuf.load("proto/level.proto", function(err, root) {
                // if(err) throw err;
                console.log(root);
                let message = root.lookupType("COD.Level.Level");
                let decoded = message.decode(new Uint8Array(data));
                let object = message.toObject(decoded);
                resolve(object);
            // });
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
openProto('lobbies/lobby.level');

function openLevelFile(level) {
    let files = level;
    let readers = [];

    if (!files.length) return;

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
            var levelData = getLevel();
            levelData.levelNodes = levelData.levelNodes.concat(data.levelNodes);
            setLevel(levelData);
        })
}
function openJSONFile(file) {
    var reader = new FileReader();
    reader.onload = (event) => {
        var obj = JSON.parse(event.target.result);
        setLevel(obj);
    };
    reader.readAsText(file)
}
function appendLevelFile(level) {
    let files = level;
    let readers = [];

    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
        readers.push(readArrayBuffer(files[i]));
    }

    Promise.all(readers).then((values) => {
        var obj = getLevel();
        obj.levelNodes = obj.levelNodes.concat(values[0].levelNodes);
        setLevel(obj);
    });
}

function downloadProto(obj) {
    var root = protobuf.parse(PROTOBUF_DATA, { keepCase: true }).root;
    // protobuf.load("proto/level.proto", function(err, root) {
        // if(err) throw err;

        let message = root.lookupType("COD.Level.Level");
        let errMsg = message.verify(obj);
        if(errMsg) throw Error(errMsg);
        let buffer = message.encode(message.fromObject(obj)).finish();
        
        let blob = new Blob([buffer], {type: "application/octet-stream"});

        let link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = (Date.now()).toString().slice(0, -3)+".level";
        link.click();
    // });
}


// Buttons
document.getElementById('empty-btn').addEventListener( 'click', () => {
    setLevel({
        "formatVersion": 6,
        "title": "New Level",
        "creators": ".index-editor",
        "description": ".index - Level modding",
        "levelNodes": [],
        "maxCheckpointCount": 10,
        "ambienceSettings": {
            "skyZenithColor": {
                "r": 0.28,
                "g": 0.476,
                "b": 0.73,
                "a": 1
            },
            "skyHorizonColor": {
                "r": 0.916,
                "g": 0.9574,
                "b": 0.9574,
                "a": 1
            },
            "sunAltitude": 45,
            "sunAzimuth": 315,
            "sunSize": 1,
            "fogDDensity": 0
        }
    });
});

document.getElementById('slindev-btn').addEventListener('click', () => {
    window.open("https://discord.slin.dev", "_blank");
});

document.getElementById('email-btn').addEventListener('click', () => {
    location.href = "mailto:twhlynch@gmail.com";
});

document.getElementById('discord-btn').addEventListener('click', () => {
    window.open("https://discordapp.com/users/649165311257608192", "_blank");
});

document.getElementById('server-btn').addEventListener('click', () => {
    window.open("https://twhlynch.me/discord", "_blank");
});

document.getElementById('docs-btn').addEventListener('click', () => {
    window.open("docs.html", "_blank");
});

document.getElementById('json-btn').addEventListener('click', () => {
    const json = JSON.stringify(getLevel());
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (Date.now()).toString().slice(0, -3)+".json";
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
});

document.getElementById('pc-btn').addEventListener('click', () => {
    document.getElementById('pc-btn-input').click();
});
document.getElementById('pc-btn-input').addEventListener('change', (e) => {
    openLevelFile(e.target.files);
});


document.getElementById('pcjson-btn').addEventListener('click', () => {
    document.getElementById('pcjson-btn-input').click();
});
document.getElementById('pcjson-btn-input').addEventListener('change', (e) => {
    openJSONFile(e.target.files[0]);
});

//
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
    var input = document.getElementById('title-prompt').value;
    var levelData = getLevel();
    levelData.title = input;
    setLevel(levelData);
    document.getElementById('title-prompt').value = '';
});
//
document.getElementById('description-btn').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'grid';
    document.getElementById('prompt-description').style.display = 'flex';
});

document.getElementById('performance-btn').addEventListener('click', () => {
    renderer.getPixelRatio() == 1 ? renderer.setPixelRatio( window.devicePixelRatio / 10 ) : renderer.setPixelRatio( 1 );
});

document.querySelector('#prompt-description .prompt-cancel').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-description').style.display = 'none';
    document.getElementById('description-prompt').value = '';
});

document.querySelector('#prompt-description .prompt-submit').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-description').style.display = 'none';
    var input = document.getElementById('description-prompt').value;
    var levelData = getLevel();
    levelData.description = input;
    setLevel(levelData);
    document.getElementById('description-prompt').value = '';
});
//
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
    var input = document.getElementById('creators-prompt').value;
    var levelData = getLevel();
    levelData.creators = input;
    setLevel(levelData);
    document.getElementById('creators-prompt').value = '';
});
//
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
    var input = document.getElementById('checkpoints-prompt').value;
    var levelData = getLevel();
    levelData.maxCheckpointCount = parseInt(input);
    setLevel(levelData);
    document.getElementById('checkpoints-prompt').value = '';
});

document.getElementById('cleardetails-btn').addEventListener('click', () => {
    var levelData = getLevel();
    levelData.maxCheckpointCount = 0;
    levelData.title = "";
    levelData.description = "";
    levelData.creators = "";
    setLevel(levelData);
});

document.getElementById('group-btn').addEventListener('click', () => {
    var levelData = getLevel();
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
            "childNodes": levelData.levelNodes, 
            "scale": {
                "y": 1.0, 
                "x": 1.0, 
                "z": 1.0
            }
        }
    }];
    setLevel(levelData);
});

document.getElementById('duplicate-btn').addEventListener('click', () => {
    var levelData = getLevel();
    levelData.levelNodes = levelData.levelNodes.concat(levelData.levelNodes);
    setLevel(levelData);
});

document.getElementById('insertpc-btn').addEventListener('click', () => {
    document.getElementById('insertpc-btn-input').click();
});
document.getElementById('insertpc-btn-input').addEventListener('change', (e) => {
    appendLevelFile(e.target.files);
});

document.getElementById('hide-btn').addEventListener('click', () => {
    if (HIDE_TEXT) {
        document.getElementById('edit-input').style.display = 'block';
        HIDE_TEXT = false;
        highlightTextEditor();
        refreshScene();
    } else {
        document.getElementById('edit-input').style.display = 'none';
        HIDE_TEXT = true;
        highlightTextEditor();
        refreshScene();
    }
});

document.getElementById('highlight-btn').addEventListener('click', () => {
    if (HIGHLIGHT_TEXT) {
        HIGHLIGHT_TEXT = false;
        highlightTextEditor();
        refreshScene();
    } else {
        HIGHLIGHT_TEXT = true;
        highlightTextEditor();
        refreshScene();
    }
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

document.getElementById('topc-btn').addEventListener('click', () => {
    downloadProto(getLevel());
});

document.getElementById('nodeStatic-btn').addEventListener('click', () => {
    var staticNode = {
        "levelNodeStatic": {
            "shape": 1000,
            "material": 0,
            "position": {
                "x": 0,
                "y": 0,
                "z": 0
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
            }
        }
    };
    var levelData = getLevel();
    levelData.levelNodes.push(staticNode);
    setLevel(levelData);
});

document.getElementById('nodeCrumbling-btn').addEventListener('click', () => {
    var crumblingNode = {
        "levelNodeCrumbling": {
            "shape": 1000,
            "material": 7,
            "position": {
                "x": 0,
                "y": 0,
                "z": 0
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
            "stableTime": 0.5,
            "respawnTime": 0.5
        }
    };
    var levelData = getLevel();
    levelData.levelNodes.push(crumblingNode);
    setLevel(levelData);
});

document.getElementById('nodeColored-btn').addEventListener('click', () => {
    var coloredNode = {
        "levelNodeStatic": {
            "shape": 1000,
            "material": 8,
            "position": {
                "x": 0,
                "y": 0,
                "z": 0
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
            "color": {
                "r": 1,
                "g": 1,
                "b": 1,
                "a": 1
            },
            "isNeon": false
        }
    };
    var levelData = getLevel();
    levelData.levelNodes.push(coloredNode);
    setLevel(levelData);
});

document.getElementById('nodeSign-btn').addEventListener('click', () => {
    var signNode = {
        "levelNodeSign": {
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
            "text": "Sample text"
        }
    };
    var levelData = getLevel();
    levelData.levelNodes.push(signNode);
    setLevel(levelData);
});

document.getElementById('nodeStart-btn').addEventListener('click', () => {
    var startNode = {
        "levelNodeStart": {
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
            "radius": 1
        }
    };
    var levelData = getLevel();
    levelData.levelNodes.push(startNode);
    setLevel(levelData);
});

document.getElementById('nodeFinish-btn').addEventListener('click', () => {
    var finishNode = {
        "levelNodeFinish": {
            "position": {
                "x": 0,
                "y": 0,
                "z": 0
            },
            "radius": 1
        }
    };
    var levelData = getLevel();
    levelData.levelNodes.push(finishNode);
    setLevel(levelData);
});

document.getElementById('nodeInvisible-btn').addEventListener('click', () => {
    var finishNode = {
        "levelNodeStatic": {
            "shape": 1000,
            "material": null,
            "position": {
                "x": 0,
                "y": 0,
                "z": 0
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
            }
        }
    };
    var levelData = getLevel();
    levelData.levelNodes.push(finishNode);
    setLevel(levelData);
});

document.getElementById('clearambience-btn').addEventListener('click', () => {
    var ambience = {
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
        "sunSize": 1,
        "fogDDensity": 0
    };
    var levelData = getLevel();
    levelData.ambienceSettings = ambience;
    setLevel(levelData);
});

document.getElementById('maxambience-btn').addEventListener('click', () => {
    var ambience = {
        "skyZenithColor": {
            "r": 32000,
            "g": 32000,
            "b": 32000,
            "a": 1
        },
        "skyHorizonColor": {
            "r": 32000,
            "g": 32000,
            "b": 32000,
            "a": 1
        },
        "sunAltitude": 32000,
        "sunAzimuth": 32000,
        "sunSize": 32000,
        "fogDDensity": 32000
    };
    var levelData = getLevel();
    levelData.ambienceSettings = ambience;
    setLevel(levelData);
});

document.getElementById('minambience-btn').addEventListener('click', () => {
    var ambience = {
        "skyZenithColor": {
            "r": -32000,
            "g": -32000,
            "b": -32000,
            "a": 1
        },
        "skyHorizonColor": {
            "r": -32000,
            "g": -32000,
            "b": -32000,
            "a": 1
        },
        "sunAltitude": -32000,
        "sunAzimuth": -32000,
        "sunSize": -32000,
        "fogDDensity": -32000
    };
    var levelData = getLevel();
    levelData.ambienceSettings = ambience;
    setLevel(levelData);
});

document.getElementById('fireambience-btn').addEventListener('click', () => {
    var ambience = {
        "skyZenithColor": {
            "a": 1
        },
        "skyHorizonColor": {
            "r": 999999,
            "g": 982082.8125,
            "b": 949219.75,
            "a": 1
        },
        "sunAltitude": 88.97185516357422,
        "sunAzimuth": 315,
        "sunSize": 99999,
        "fogDDensity": 0.7152965068817139
    };
    var levelData = getLevel();
    levelData.ambienceSettings = ambience;
    setLevel(levelData);
});

document.getElementById('defaultambience-btn').addEventListener('click', () => {
    var ambience = {
        "skyZenithColor": {
            "r": 0.28,
            "g": 0.476,
            "b": 0.73,
            "a": 1
        },
        "skyHorizonColor": {
            "r": 0.916,
            "g": 0.9574,
            "b": 0.9574,
            "a": 1
        },
        "sunAltitude": 45,
        "sunAzimuth": 315,
        "sunSize": 1,
        "fogDDensity": 0
    };
    var levelData = getLevel();
    levelData.ambienceSettings = ambience;
    setLevel(levelData);
});

document.getElementById('randomambience-btn').addEventListener('click', () => {
    var ambience = {
        "skyZenithColor": {
            "r": Math.floor(Math.random() * 19999999999) - 9999999999,
            "g": Math.floor(Math.random() * 19999999999) - 9999999999,
            "b": Math.floor(Math.random() * 19999999999) - 9999999999,
            "a": 1
        },
        "skyHorizonColor": {
            "r": Math.floor(Math.random() * 19999999999) - 9999999999,
            "g": Math.floor(Math.random() * 19999999999) - 9999999999,
            "b": Math.floor(Math.random() * 19999999999) - 9999999999,
            "a": 1
        },
        "sunAltitude": Math.floor(Math.random() * 19999999999) - 9999999999,
        "sunAzimuth": Math.floor(Math.random() * 19999999999) - 9999999999,
        "sunSize": Math.floor(Math.random() * 19999999999) - 9999999999,
        "fogDDensity": Math.floor(Math.random() * 19999999999) - 9999999999
    };
    var levelData = getLevel();
    levelData.ambienceSettings = ambience;
    setLevel(levelData);
});

document.querySelector('#prompt-protobuf .prompt-submit').addEventListener('click', () => {
    document.getElementById('prompts').style.display = 'none';
    document.getElementById('prompt-protobuf').style.display = 'none';
    var input = document.getElementById('protobuf-prompt').value;
    PROTOBUF_DATA = input;
});

// prefabs

document.getElementById('Parallelograms-btn').addEventListener('click', () => {
    var levelData = getLevel();
    var prefab = {
        "levelNodeGroup": {
            "position": {
                "y": 0,
                "x": 0,
                "z": 0
            },
            "rotation": {
                "w": 1
            },
            "childNodes": [
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeGroup": {
                                    "position": {
                                        "y": 0,
                                        "x": 0,
                                        "z": 0
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "childNodes": [
                                        {
                                            "levelNodeStatic": {
                                                "shape": 1000,
                                                "material": 0,
                                                "position": {
                                                    "x": 0,
                                                    "y": 0,
                                                    "z": 0
                                                },
                                                "scale": {
                                                    "x": 2,
                                                    "y": 1,
                                                    "z": 1
                                                },
                                                "rotation": {
                                                    "w": 0.924,
                                                    "x": 0,
                                                    "y": 0.383,
                                                    "z": 0
                                                }
                                            }
                                        }
                                    ],
                                    "scale": {
                                        "y": 1,
                                        "x": 1,
                                        "z": 4
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": 1,
                            "z": 0.5
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeGroup": {
                                    "position": {
                                        "y": 0,
                                        "x": 0,
                                        "z": 0
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "childNodes": [
                                        {
                                            "levelNodeCrumbling": {
                                                "shape": 1000,
                                                "material": 7,
                                                "position": {
                                                    "x": 2,
                                                    "y": 0,
                                                    "z": 0
                                                },
                                                "scale": {
                                                    "x": 2,
                                                    "y": 1,
                                                    "z": 1
                                                },
                                                "rotation": {
                                                    "w": 0.924,
                                                    "x": 0,
                                                    "y": 0.383,
                                                    "z": 0
                                                },
                                                "stableTime": 0.5,
                                                "respawnTime": 0.5
                                            }
                                        }
                                    ],
                                    "scale": {
                                        "y": 1,
                                        "x": 1,
                                        "z": 4
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": 1,
                            "z": 0.5
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeGroup": {
                                    "position": {
                                        "y": 0,
                                        "x": 0,
                                        "z": 0
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "childNodes": [
                                        {
                                            "levelNodeStatic": {
                                                "shape": 1000,
                                                "material": 9,
                                                "position": {
                                                    "x": 4,
                                                    "y": 0,
                                                    "z": 0
                                                },
                                                "scale": {
                                                    "x": 2,
                                                    "y": 1,
                                                    "z": 1
                                                },
                                                "rotation": {
                                                    "w": 0.924,
                                                    "x": 0,
                                                    "y": 0.383,
                                                    "z": 0
                                                }
                                            }
                                        }
                                    ],
                                    "scale": {
                                        "y": 1,
                                        "x": 1,
                                        "z": 4
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": 1,
                            "z": 0.5
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeGroup": {
                                    "position": {
                                        "y": 0,
                                        "x": 0,
                                        "z": 0
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "childNodes": [
                                        {
                                            "levelNodeStatic": {
                                                "shape": 1000,
                                                "material": 8,
                                                "position": {
                                                    "x": 6,
                                                    "y": 0,
                                                    "z": 0
                                                },
                                                "scale": {
                                                    "x": 2,
                                                    "y": 1,
                                                    "z": 1
                                                },
                                                "rotation": {
                                                    "w": 0.924,
                                                    "x": 0,
                                                    "y": 0.383,
                                                    "z": 0
                                                },
                                                "color": {
                                                    "r": 0,
                                                    "g": 1,
                                                    "b": 1,
                                                    "a": 1
                                                }
                                            }
                                        }
                                    ],
                                    "scale": {
                                        "y": 1,
                                        "x": 1,
                                        "z": 4
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": 1,
                            "z": 0.5
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeGroup": {
                                    "position": {
                                        "y": 0,
                                        "x": 0,
                                        "z": 0
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "childNodes": [
                                        {
                                            "levelNodeStatic": {
                                                "shape": 1000,
                                                "material": 6,
                                                "position": {
                                                    "x": 8,
                                                    "y": 0,
                                                    "z": 0
                                                },
                                                "scale": {
                                                    "x": 2,
                                                    "y": 1,
                                                    "z": 1
                                                },
                                                "rotation": {
                                                    "w": 0.924,
                                                    "x": 0,
                                                    "y": 0.383,
                                                    "z": 0
                                                }
                                            }
                                        }
                                    ],
                                    "scale": {
                                        "y": 1,
                                        "x": 1,
                                        "z": 4
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": 1,
                            "z": 0.5
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeGroup": {
                                    "position": {
                                        "y": 0,
                                        "x": 0,
                                        "z": 0
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "childNodes": [
                                        {
                                            "levelNodeStatic": {
                                                "shape": 1000,
                                                "material": 5,
                                                "position": {
                                                    "x": 10,
                                                    "y": 0,
                                                    "z": 0
                                                },
                                                "scale": {
                                                    "x": 2,
                                                    "y": 1,
                                                    "z": 1
                                                },
                                                "rotation": {
                                                    "w": 0.924,
                                                    "x": 0,
                                                    "y": 0.383,
                                                    "z": 0
                                                }
                                            }
                                        }
                                    ],
                                    "scale": {
                                        "y": 1,
                                        "x": 1,
                                        "z": 4
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": 1,
                            "z": 0.5
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeGroup": {
                                    "position": {
                                        "y": 0,
                                        "x": 0,
                                        "z": 0
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "childNodes": [
                                        {
                                            "levelNodeStatic": {
                                                "shape": 1000,
                                                "material": 4,
                                                "position": {
                                                    "x": 12,
                                                    "y": 0,
                                                    "z": 0
                                                },
                                                "scale": {
                                                    "x": 2,
                                                    "y": 1,
                                                    "z": 1
                                                },
                                                "rotation": {
                                                    "w": 0.924,
                                                    "x": 0,
                                                    "y": 0.383,
                                                    "z": 0
                                                }
                                            }
                                        }
                                    ],
                                    "scale": {
                                        "y": 1,
                                        "x": 1,
                                        "z": 4
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": 1,
                            "z": 0.5
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeGroup": {
                                    "position": {
                                        "y": 0,
                                        "x": 0,
                                        "z": 0
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "childNodes": [
                                        {
                                            "levelNodeStatic": {
                                                "shape": 1000,
                                                "material": 3,
                                                "position": {
                                                    "x": 14,
                                                    "y": 0,
                                                    "z": 0
                                                },
                                                "scale": {
                                                    "x": 2,
                                                    "y": 1,
                                                    "z": 1
                                                },
                                                "rotation": {
                                                    "w": 0.924,
                                                    "x": 0,
                                                    "y": 0.383,
                                                    "z": 0
                                                }
                                            }
                                        }
                                    ],
                                    "scale": {
                                        "y": 1,
                                        "x": 1,
                                        "z": 4
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": 1,
                            "z": 0.5
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeGroup": {
                                    "position": {
                                        "y": 0,
                                        "x": 0,
                                        "z": 0
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "childNodes": [
                                        {
                                            "levelNodeStatic": {
                                                "shape": 1000,
                                                "material": 2,
                                                "position": {
                                                    "x": 16,
                                                    "y": 0,
                                                    "z": 0
                                                },
                                                "scale": {
                                                    "x": 2,
                                                    "y": 1,
                                                    "z": 1
                                                },
                                                "rotation": {
                                                    "w": 0.924,
                                                    "x": 0,
                                                    "y": 0.383,
                                                    "z": 0
                                                }
                                            }
                                        }
                                    ],
                                    "scale": {
                                        "y": 1,
                                        "x": 1,
                                        "z": 4
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": 1,
                            "z": 0.5
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeGroup": {
                                    "position": {
                                        "y": 0,
                                        "x": 0,
                                        "z": 0
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "childNodes": [
                                        {
                                            "levelNodeStatic": {
                                                "shape": 1000,
                                                "material": 1,
                                                "position": {
                                                    "x": 18,
                                                    "y": 0,
                                                    "z": 0
                                                },
                                                "scale": {
                                                    "x": 2,
                                                    "y": 1,
                                                    "z": 1
                                                },
                                                "rotation": {
                                                    "w": 0.924,
                                                    "x": 0,
                                                    "y": 0.383,
                                                    "z": 0
                                                }
                                            }
                                        }
                                    ],
                                    "scale": {
                                        "y": 1,
                                        "x": 1,
                                        "z": 4
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": 1,
                            "z": 0.5
                        }
                    }
                }
            ],
            "scale": {
                "y": 1,
                "x": 1,
                "z": 1
            }
        }
    };
    levelData.levelNodes.push(prefab);
    setLevel(levelData); 
});
document.getElementById('BreakTimes-btn').addEventListener('click', () => {
    var levelData = getLevel();
    var prefab = {
        "levelNodeGroup": {
            "position": {
                "y": 0,
                "x": 0,
                "z": 0
            },
            "rotation": {
                "w": 1
            },
            "childNodes": [
                {
                    "levelNodeCrumbling": {
                        "shape": 1000,
                        "material": 7,
                        "position": {
                            "x": -5,
                            "y": 5,
                            "z": -4
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.1,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1000,
                        "material": 7,
                        "position": {
                            "x": -4,
                            "y": 5,
                            "z": -4
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.2,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1000,
                        "material": 7,
                        "position": {
                            "x": -3,
                            "y": 5,
                            "z": -4
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.3,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1001,
                        "material": 7,
                        "position": {
                            "x": -5,
                            "y": 5,
                            "z": -3
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.1,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1001,
                        "material": 7,
                        "position": {
                            "x": -4,
                            "y": 5,
                            "z": -3
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.2,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1001,
                        "material": 7,
                        "position": {
                            "x": -3,
                            "y": 5,
                            "z": -3
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.3,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1002,
                        "material": 7,
                        "position": {
                            "x": -5,
                            "y": 5,
                            "z": -2
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.1,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1002,
                        "material": 7,
                        "position": {
                            "x": -4,
                            "y": 5,
                            "z": -2
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.2,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1002,
                        "material": 7,
                        "position": {
                            "x": -3,
                            "y": 5,
                            "z": -2
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.3,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1003,
                        "material": 7,
                        "position": {
                            "x": -5,
                            "y": 5,
                            "z": -1
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.1,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1003,
                        "material": 7,
                        "position": {
                            "x": -4,
                            "y": 5,
                            "z": -1
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.2,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1003,
                        "material": 7,
                        "position": {
                            "x": -3,
                            "y": 5,
                            "z": -1
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.3,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1004,
                        "material": 7,
                        "position": {
                            "x": -5,
                            "y": 5
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.1,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1004,
                        "material": 7,
                        "position": {
                            "x": -4,
                            "y": 5
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.2,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1004,
                        "material": 7,
                        "position": {
                            "x": -3,
                            "y": 5
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.3,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1004,
                        "material": 7,
                        "position": {
                            "x": -2,
                            "y": 5
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.4,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1003,
                        "material": 7,
                        "position": {
                            "x": -2,
                            "y": 5,
                            "z": -1
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.4,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1002,
                        "material": 7,
                        "position": {
                            "x": -2,
                            "y": 5,
                            "z": -2
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.4,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1001,
                        "material": 7,
                        "position": {
                            "x": -2,
                            "y": 5,
                            "z": -3
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.4,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1000,
                        "material": 7,
                        "position": {
                            "x": -2,
                            "y": 5,
                            "z": -4
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.4,
                        "respawnTime": 8
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1000,
                        "material": 7,
                        "position": {
                            "x": -1,
                            "y": 5,
                            "z": -4
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 1000,
                        "respawnTime": 1000
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1001,
                        "material": 7,
                        "position": {
                            "x": -1,
                            "y": 5,
                            "z": -3
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 1000,
                        "respawnTime": 1000
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1002,
                        "material": 7,
                        "position": {
                            "x": -1,
                            "y": 5,
                            "z": -2
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 1000,
                        "respawnTime": 1000
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1003,
                        "material": 7,
                        "position": {
                            "x": -1,
                            "y": 5,
                            "z": -1
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 1000,
                        "respawnTime": 1000
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1004,
                        "material": 7,
                        "position": {
                            "x": -1,
                            "y": 5
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 1000,
                        "respawnTime": 1000
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1000,
                        "material": 7,
                        "position": {
                            "x": 0,
                            "y": 5,
                            "z": -4
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 100000,
                        "respawnTime": 100000
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1001,
                        "material": 7,
                        "position": {
                            "x": 0,
                            "y": 5,
                            "z": -3
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 100000,
                        "respawnTime": 100000
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1002,
                        "material": 7,
                        "position": {
                            "x": 0,
                            "y": 5,
                            "z": -2
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 100000,
                        "respawnTime": 100000
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1003,
                        "material": 7,
                        "position": {
                            "x": 0,
                            "y": 5,
                            "z": -1
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 100000,
                        "respawnTime": 100000
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1004,
                        "material": 7,
                        "position": {
                            "x": 0,
                            "y": 5
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 100000,
                        "respawnTime": 100000
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1000,
                        "material": 7,
                        "position": {
                            "x": 1,
                            "y": 5,
                            "z": -4
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.001,
                        "respawnTime": 0.001
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1001,
                        "material": 7,
                        "position": {
                            "x": 1,
                            "y": 5,
                            "z": -3
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.001,
                        "respawnTime": 0.001
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1002,
                        "material": 7,
                        "position": {
                            "x": 1,
                            "y": 5,
                            "z": -2
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.001,
                        "respawnTime": 0.001
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1003,
                        "material": 7,
                        "position": {
                            "x": 1,
                            "y": 5,
                            "z": -1
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.001,
                        "respawnTime": 0.001
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 1004,
                        "material": 7,
                        "position": {
                            "x": 1,
                            "y": 5
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "stableTime": 0.001,
                        "respawnTime": 0.001
                    }
                }     
            ],
            "scale": {
                "y": 1,
                "x": 1,
                "z": 1
            }
        }
    };
    levelData.levelNodes.push(prefab);
    setLevel(levelData); 
});
document.getElementById('FreeStartFinish-btn').addEventListener('click', () => {
    var levelData = getLevel();
    var prefab = {
        "levelNodeGroup": {
            "position": {
                "y": 0,
                "x": 0,
                "z": 0
            },
            "rotation": {
                "w": 1
            },
            "childNodes": [
                {
                    "levelNodeGroup": {
                        "position": {
                            "x": -4,
                            "y": 2
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStart": {
                                    "position": {
                                        "x": 1,
                                        "y": 1,
                                        "z": 1
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "radius": 1
                                }
                            }
                        ]
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "x": -8,
                            "y": 2
                        },
                        "scale": {
                            "x": 1,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeFinish": {
                                    "position": {
                                        "x": 1,
                                        "y": 1,
                                        "z": 1
                                    },
                                    "radius": 1
                                }
                            }
                        ]
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "x": -14,
                            "y": -98
                        },
                        "scale": {
                            "x": 1,
                            "y": 100,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStart": {
                                    "position": {
                                        "x": 1,
                                        "y": 1,
                                        "z": 1
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "radius": 1
                                }
                            }
                        ]
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "x": -18,
                            "y": -98
                        },
                        "scale": {
                            "x": 1,
                            "y": 100,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeFinish": {
                                    "position": {
                                        "x": 1,
                                        "y": 1,
                                        "z": 1
                                    },
                                    "radius": 1
                                }
                            }
                        ]
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "x": -6,
                            "y": 2,
                            "z": -10
                        },
                        "scale": {
                            "x": 10,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStart": {
                                    "position": {
                                        "x": 1,
                                        "y": 1,
                                        "z": 1
                                    },
                                    "rotation": {
                                        "w": 1
                                    },
                                    "radius": 1
                                }
                            }
                        ]
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "x": -6,
                            "y": 2,
                            "z": -6
                        },
                        "scale": {
                            "x": 10,
                            "y": 1,
                            "z": 1
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeFinish": {
                                    "position": {
                                        "x": 1,
                                        "y": 1,
                                        "z": 1
                                    },
                                    "radius": 1
                                }
                            }
                        ]
                    }
                }
            ],
            "scale": {
                "y": 1,
                "x": 1,
                "z": 1
            }
        }
    };
    levelData.levelNodes.push(prefab);
    setLevel(levelData); 
});
document.getElementById('TexturedSigns-btn').addEventListener('click', () => {
    var levelData = getLevel();
    var prefab = {
        "levelNodeGroup": {
            "position": {
                "y": 0,
                "x": 0,
                "z": 0
            },
            "rotation": {
                "w": 1
            },
            "childNodes": [
                {
                    "levelNodeStatic": {
                        "shape": 2,
                        "material": 0,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "color": {
                            "r": 0,
                            "g": 0,
                            "b": 0
                        }
                    }
                }, {
                    "levelNodeStatic": {
                        "shape": 2,
                        "material": 1,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "color": {
                            "r": 0,
                            "g": 0,
                            "b": 0
                        }
                    }
                }, {
                    "levelNodeStatic": {
                        "shape": 2,
                        "material": 2,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "color": {
                            "r": 0,
                            "g": 0,
                            "b": 0
                        }
                    }
                }, {
                    "levelNodeStatic": {
                        "shape": 2,
                        "material": 3,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "color": {
                            "r": 0,
                            "g": 0,
                            "b": 0
                        }
                    }
                }, {
                    "levelNodeStatic": {
                        "shape": 2,
                        "material": 4,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "color": {
                            "r": 0,
                            "g": 0,
                            "b": 0
                        }
                    }
                }, {
                    "levelNodeStatic": {
                        "shape": 2,
                        "material": 5,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "color": {
                            "r": 0,
                            "g": 0,
                            "b": 0
                        }
                    }
                }, {
                    "levelNodeStatic": {
                        "shape": 2,
                        "material": 6,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "color": {
                            "r": 0,
                            "g": 0,
                            "b": 0
                        }
                    }
                }, {
                    "levelNodeStatic": {
                        "shape": 2,
                        "material": 9,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "color": {
                            "r": 0,
                            "g": 0,
                            "b": 0
                        }
                    }
                }, {
                    "levelNodeStatic": {
                        "shape": 2,
                        "material": 8,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "color": {
                            "r": 1,
                            "g": 1,
                            "b": 1,
                            "a": 1
                        },
                        "isNeon": false
                    }
                }, {
                    "levelNodeCrumbling": {
                        "shape": 2,
                        "material": 7,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "stableTime": 0.5,
                        "respawnTime": 0.5
                    }
                }
            ],
            "scale": {
                "y": 1,
                "x": 1,
                "z": 1
            }
        }
    };
    levelData.levelNodes.push(prefab);
    setLevel(levelData); 
});
document.getElementById('SpecialStones-btn').addEventListener('click', () => {
    var levelData = getLevel();
    var prefab = {
        "levelNodeGroup": {
            "position": {
                "y": 0,
                "x": 0,
                "z": 0
            },
            "rotation": {
                "w": 1
            },
            "childNodes": [
                {
                    "levelNodeStatic": {
                        "shape": 3,
                        "material": 0,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        }
                    }
                },
                {
                    "levelNodeStatic": {
                        "shape": 3,
                        "material": 1,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        }
                    }
                },
                {
                    "levelNodeStatic": {
                        "shape": 3,
                        "material": 2,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        }
                    }
                },
                {
                    "levelNodeStatic": {
                        "shape": 3,
                        "material": 3,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        }
                    }
                },
                {
                    "levelNodeStatic": {
                        "shape": 3,
                        "material": 4,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        }
                    }
                },
                {
                    "levelNodeStatic": {
                        "shape": 3,
                        "material": 5,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        }
                    }
                },
                {
                    "levelNodeStatic": {
                        "shape": 3,
                        "material": 6,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        }
                    }
                },
                {
                    "levelNodeStatic": {
                        "shape": 3,
                        "material": 9,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        }
                    }
                },
                {
                    "levelNodeStatic": {
                        "shape": 3,
                        "material": 8,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "color": {
                            "r": 1,
                            "g": 1,
                            "b": 1,
                            "a": 1
                        },
                        "isNeon": false
                    }
                },
                {
                    "levelNodeCrumbling": {
                        "shape": 3,
                        "material": 7,
                        "position": {
                            "x": 0,
                            "y": 0,
                            "z": 0
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
                        "stableTime": 0.5,
                        "respawnTime": 0.5
                    }
                }
            ],
            "scale": {
                "y": 1,
                "x": 1,
                "z": 1
            }
        }
    };
    levelData.levelNodes.push(prefab);
    setLevel(levelData); 
});
document.getElementById('NoHitbox-btn').addEventListener('click', () => {
    var levelData = getLevel();
    var prefab = {
        "levelNodeGroup": {
            "position": {
                "y": 0,
                "x": 0,
                "z": 0
            },
            "rotation": {
                "w": 1
            },
            "childNodes": [
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 0,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 1,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 2,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 3,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 4,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 5,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 6,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 9,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 8,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    "color": {
                                        "r": 1,
                                        "g": 1,
                                        "b": 1,
                                        "a": 1
                                    },
                                    "isNeon": false
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeCrumbling": {
                                    "shape": 1000,
                                    "material": 7,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    "stableTime": 0.5,
                                    "respawnTime": 0.5
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeSign": {
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
                                    "text": "Sample text"
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStart": {
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
                                    "radius": 1
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeFinish": {
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
                                    },
                                    "radius": 1
                                }
                            }
                        ],
                        "scale": {
                            "y": 1,
                            "x": -1,
                            "z": -1
                        }
                    }
                }
            ],
            "scale": {
                "y": 1,
                "x": 1,
                "z": 1
            }
        }
    };
    levelData.levelNodes.push(prefab);
    setLevel(levelData); 
});
document.getElementById('Inverted-btn').addEventListener('click', () => {
    var levelData = getLevel();
    var prefab = {
        "levelNodeGroup": {
            "position": {
                "y": 0,
                "x": 0,
                "z": 0
            },
            "rotation": {
                "w": 1
            },
            "childNodes": [
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 0,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 1,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 2,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 3,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 4,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 5,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 6,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 9,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    }
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStatic": {
                                    "shape": 1000,
                                    "material": 8,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    "color": {
                                        "r": 1,
                                        "g": 1,
                                        "b": 1,
                                        "a": 1
                                    },
                                    "isNeon": false
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeCrumbling": {
                                    "shape": 1000,
                                    "material": 7,
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
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
                                    "stableTime": 0.5,
                                    "respawnTime": 0.5
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeSign": {
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
                                    "text": "Sample text"
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeStart": {
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
                                    "radius": 1
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                },
                {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0,
                            "x": 0,
                            "z": 0
                        },
                        "rotation": {
                            "w": 1
                        },
                        "childNodes": [
                            {
                                "levelNodeFinish": {
                                    "position": {
                                        "x": 0,
                                        "y": 0,
                                        "z": 0
                                    },
                                    "radius": 1
                                }
                            }
                        ],
                        "scale": {
                            "y": -1,
                            "x": -1,
                            "z": -1
                        }
                    }
                }
            ],
            "scale": {
                "y": 1,
                "x": 1,
                "z": 1
            }
        }
    };
    levelData.levelNodes.push(prefab);
    setLevel(levelData); 
});

// Main
var PROTOBUF_DATA = `
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
	}

	repeated Animation animations = 15;
}
`
document.getElementById('range-btn').addEventListener('click', () => {
    fetch('proto/hacked.proto')
    .then(response => response.text())
    .then(HACKED_PROTO => {
    document.getElementById('protobuf-prompt').value = HACKED_PROTO;
    });
});

var HIDE_TEXT = false;
var HIGHLIGHT_TEXT = true;

highlightTextEditor();
refreshScene();

function getLevel() {
    return JSON.parse(document.getElementById('edit-input').innerText);
}
function setLevel(level) {
    if (level.formatVersion != 6) {
        document.getElementById('warning').style.display = "block";
    } else {
        document.getElementById('warning').style.display = "none";
    }
    !level.levelNodes ? level.levelNodes = [] : {};
    level.levelNodes.forEach(node => {
        if (node.hasOwnProperty('levelNodeStatic')) {
            !node.levelNodeStatic.color ? node.levelNodeStatic.color = {} : {};
            !node.levelNodeStatic.color.r ? node.levelNodeStatic.color.r = 0 : {};
            !node.levelNodeStatic.color.g ? node.levelNodeStatic.color.g = 0 : {};
            !node.levelNodeStatic.color.b ? node.levelNodeStatic.color.b = 0 : {};
        }
    });

    document.getElementById('edit-input').innerText = JSON.stringify(level, null, 4);
    highlightTextEditor();
    refreshScene();
}
