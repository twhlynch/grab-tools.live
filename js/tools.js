function readArrayBufferGroup(file) {
    return new Promise(function(resolve, reject) {
        let reader = new FileReader();
        reader.onload = function() {
            let data = reader.result;
            protobuf.load("proto/proto.proto", function(err, root) {
                if(err) {throw err};
                let message = root.lookupType("COD.Level.Level");
                let decoded = message.decode(new Uint8Array(data));
                let object = message.toObject(decoded);
                let group = {
                    "levelNodeGroup": {
                        "position": {
                            "y": 0, 
                            "x": 0, 
                            "z": 0
                        }, 
                        "rotation": {
                            "w": 1.0
                        }, 
                        "childNodes": object.levelNodes.filter(n => !(n.levelNodeStart) && !(n.levelNodeFinish)),
                        "scale": {
                            "y": 1.0, 
                            "x": 1.0, 
                            "z": 1.0
                        }
                    }
                }
                resolve(group);
            });
        }
        reader.onerror = function() {
            reject(reader);
        }
        reader.readAsArrayBuffer(file);
    });
}
function readArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        let reader = new FileReader();
        reader.onload = function() {
            let data = reader.result;
            protobuf.load("proto/proto.proto", function(err, root) {
                if(err) {throw err};
                let message = root.lookupType("COD.Level.Level");
                let decoded = message.decode(new Uint8Array(data));
                let object = message.toObject(decoded);
                resolve(object);
            });
        }
        reader.onerror = function() {
            reject(reader);
        }
        reader.readAsArrayBuffer(file);
    });
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function outlineNode(node) {
    let size = document.getElementById('outline-size').value;
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
function outlineLevel() {
    let { files } = document.getElementById('outline-file');

    readArrayBuffer(files[0]).then((levelData) => {

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

        protobuf.load("proto/proto.proto", function(err, root) {
            if(err) {throw err};

            let message = root.lookupType("COD.Level.Level");
            let errMsg = message.verify(levelData);
            if(errMsg) {throw Error(errMsg)};
            let buffer = message.encode(message.fromObject(levelData)).finish();
            
            let blob = new Blob([buffer], {type: "application/octet-stream"});
            
            let link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = (Date.now()).toString().slice(0, -3)+".level";
            link.click();
        });
        
    });
}
function find_char(char, last_10, level) {
    for (let i = 0; i < level.levelNodes.length; i++) {
        if (level.levelNodes[i].levelNodeSign.text == char && !last_10.includes(i)) {
            return i
        }
    }
    return false
}
function scripture() {
    let creators = document.getElementById('Scripture-creators').value;
    let desc = document.getElementById('Scripture-desc').value;
    let title = document.getElementById('Scripture-title').value;
    let text = document.getElementById('Scripture-text').value;

    // config
    let count = 0;
    let char_width = 0.05;
    let appearance_time = 2;
    let interval = 0.1;
    let active_position = 0;
    let visible_length = 40 ;
    let foreward_pos = 1;
    let height = 0;

    let level = {
        "formatVersion": 12,
        "title": title,
        "creators": creators+", .index",
        "description": desc+"  grab-tools.live",
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
        },
        "levelNodes": []
    };

    let last_10 = [];

    let wants_return = false;

    for (let i = 0; i < text.split("").length; i++) {
        let char = text.charAt(i);
        if (char == "\n") {
            wants_return = true;
        }
        let sign_iter = find_char(char, last_10, level);
        if (!sign_iter) {
            level.levelNodes.push({
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
            })
        }

        sign_iter = find_char(char, last_10, level)
        last_10.push(sign_iter)

        if (last_10.length > appearance_time / interval) {
            last_10.pop(0)
        }

        level.levelNodes[sign_iter].animations[0].frames.push({
            "position": {
                "z": 1 * foreward_pos,
                "y": height * char_width * -2,
                "x": 1 * active_position * char_width
            },
            "rotation": {
                "w": 1.0
            },
            "time": count * interval
        })
    
        level.levelNodes[sign_iter].animations[0].frames.push({
            "position": {
                "z": 1 * foreward_pos,
                "y": height * char_width * -2,
                "x": 1 * active_position * char_width
            },
            "rotation": {
                "w": 1.0
            },
            "time": count * interval + appearance_time
        })
    
        level.levelNodes[sign_iter].animations[0].frames.push({
            "position": {
            },
            "rotation": {
                "w": 1.0
            },
            "time": count * interval + appearance_time
        })

        active_position += 1;
        if (active_position > visible_length) {
            wants_return = true;
        }
        if (wants_return && char == " ") {
            active_position = 0;
            height += 1;
            wants_return = false;
        }
    }

    for (i = 0; i < level.levelNodes.length; i++) {
        level.levelNodes[i].animations[0].frames.push({
            "position": {
                "x": 0,
                "y": 0,
                "z": 0
            },
            "rotation": {
                "w": 1.0
            },
            "time": count * interval + appearance_time + 1
        })
    }    
    
    protobuf.load("proto/proto.proto", function(err, root) {
        if(err) {throw err};

        let message = root.lookupType("COD.Level.Level");
        let errMsg = message.verify(level);
        if(errMsg) {throw Error(errMsg)};
        let buffer = message.encode(message.fromObject(level)).finish();
        
        let blob = new Blob([buffer], {type: "application/octet-stream"});
        
        let link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = (Date.now()).toString().slice(0, -3)+".level";
        link.click();
    });
}
function TextToSigns() {
    let creators = document.getElementById('signs-creators').value;
    let desc = document.getElementById('signs-desc').value;
    let title = document.getElementById('signs-title').value;
    let wordsper = parseInt(document.getElementById('signs-words').value);
    let text = document.getElementById('signs-text').value;
    let direction = document.getElementById('signs-direction').value;

    let words = text.split(' ');

    let splitStrings = [];
    for (let i = 0; i < words.length; i += wordsper) {
        let chunk = words.slice(i, i + wordsper);
        splitStrings.push(chunk.join(' '));
    }
    let signs = [];
    splitStrings.forEach((str, i) => {
        let sign = {levelNodeSign: {position: {x: 0,y: 0,z: 0},rotation: {w: 1.0},text:str}};
        if (direction == 'horizontal') {
            sign.levelNodeSign.position.x = i;
        } else {
            sign.levelNodeSign.position.y = -i;
        }
        signs.push(sign);
    });

    let obj = {
        "ambienceSettings": {
            "skyHorizonColor": {
                "a": 1.0,
                "b": 0.9574,
                "g": 0.9574,
                "r": 0.916
            },
            "skyZenithColor": {
                "a": 1.0,
                "b": 0.73,
                "g": 0.476,
                "r": 0.28
            },
            "sunAltitude": 45.0,
            "sunAzimuth": 315.0,
            "sunSize": 1.0
        },
        "complexity": 0,
        "creators": creators,
        "description": desc+` - grab-tools.live`,
        "formatVersion": 12,
        "levelNodes": signs,
        "maxCheckpointCount": 10,
        "title": title
    }
    
    
    protobuf.load("proto/proto.proto", function(err, root) {
        if(err) {throw err};

        let message = root.lookupType("COD.Level.Level");
        let errMsg = message.verify(obj);
        if(errMsg) {throw Error(errMsg)};
        let buffer = message.encode(message.fromObject(obj)).finish();
        
        let blob = new Blob([buffer], {type: "application/octet-stream"});
        
        let link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = (Date.now()).toString().slice(0, -3)+".level";
        link.click();
    });
}
function MultiDownload() {
    let links = document.getElementById('smorg-urls').value;
    links = links.split(',');
    for (let i = 0; i < links.length; i++) {
        links[i] = links[i].split('=')[1];
    }
    links = links.join('+');
    window.location.href = `download.html?level=${links}`;
}
function compile(qms=false) {
    let files;
    if (qms) {
        let fileInputs = [];
        for (let i = 0; i < 10; i++) {
            if (document.getElementById(`compile-file${i}`).files.length) {
                fileInputs.push(document.getElementById(`compile-file${i}`));
            }
        }
        files = fileInputs.map((input) => input.files[0]);
    } else {
        files = document.getElementById("compile-file").files;
    }
        
    if (!files.length) {return};
    
    let readers = [];
    for (let i = 0; i < files.length; i++) {
        readers.push(readArrayBufferGroup(files[i]));
    }

    Promise.all(readers).then((values) => {
        let finalNodes = [];
        for (let i = 0; i < values.length; i++) {
            finalNodes = finalNodes.concat(values[i]);
        }
        let creators = document.getElementById('compile-creators').value;
        let description = document.getElementById('compile-description').value + " grab-tools.live";
        let title = document.getElementById('compile-title').value;
        let checkpoints = document.getElementById('compile-checkpoints').value;
        let obj = {
            "ambienceSettings": {
                "skyHorizonColor": {
                    "a": 1.0,
                    "b": 0.9574,
                    "g": 0.9574,
                    "r": 0.916
                },
                "skyZenithColor": {
                    "a": 1.0,
                    "b": 0.73,
                    "g": 0.476,
                    "r": 0.28
                },
                "sunAltitude": 45.0,
                "sunAzimuth": 315.0,
                "sunSize": 1.0
            },
            "complexity": 0,
            "creators": creators,
            "description": description,
            "formatVersion": 12,
            "levelNodes": finalNodes,
            "maxCheckpointCount": parseInt(checkpoints),
            "title": title
        }
        
        protobuf.load("proto/proto.proto", function(err, root) {
            if(err) {throw err};

            let message = root.lookupType("COD.Level.Level");
            let errMsg = message.verify(obj);
            if(errMsg) {throw Error(errMsg)};
            let buffer = message.encode(message.fromObject(obj)).finish();
            
            let blob = new Blob([buffer], {type: "application/octet-stream"});
            
            let link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = (Date.now()).toString().slice(0, -3)+".level";
            link.click();
        });
    });
}
function pixelate() {
    let q = document.getElementById('pixel-num').value;
    if (q == "" || q == null || q < 1) {
        q = 50;
    }
    let file = document.getElementById('pixel-file').files[0];
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
            canvas2.width = q;
            canvas2.height = q;
            let rgbArray = [];
            for (let x = 0; x < q; x++) {
                for (let y = 0; y < q; y++) {
                    let pixel = ctx.getImageData(x*(img.width/q), y*(img.height/q), 1, 1);
                    ctx2.putImageData(pixel, x, y);
                    let rgb = pixel.data;
                    rgbArray.push([rgb[0], rgb[1], rgb[2], x, y*-1]);
                }
            }
  
            let imageData = ctx.getImageData(0, 0, img.width, img.height);
            
            let pixels = rgbArray;
            let pixelNodes = [];
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
                pixelNodes.push({
                    "levelNodeStatic": {
                        "material": "DEFAULT_COLORED",
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
                        "shape": "CUBE"
                    }
                });
            }
            let creators = document.getElementById('pixel-creators').value;
            let desc = document.getElementById('pixel-desc').value+' pixel art credit - .index ';
            let title = document.getElementById('pixel-title').value;
            
            let obj = {
                "ambienceSettings": {
                    "skyHorizonColor": {
                        "a": 1.0,
                        "b": 0.9574,
                        "g": 0.9574,
                        "r": 0.916
                    },
                    "skyZenithColor": {
                        "a": 1.0,
                        "b": 0.73,
                        "g": 0.476,
                        "r": 0.28
                    },
                    "sunAltitude": 45.0,
                    "sunAzimuth": 315.0,
                    "sunSize": 1.0
                },
                "complexity": q**2,
                "creators": creators,
                "description": desc,
                "formatVersion": 12,
                "levelNodes": pixelNodes,
                "maxCheckpointCount": 10,
                "title": title
            }
            protobuf.load("proto/proto.proto", function(err, root) {
                if(err) {throw err};
  
                let message = root.lookupType("COD.Level.Level");
                let errMsg = message.verify(obj);
                let buffer = message.encode(message.fromObject(obj)).finish();
                
                let blob = new Blob([buffer], {type: "application/octet-stream"});
                
                let link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.download = (Date.now()).toString().slice(0, -3)+".level";
                link.click();
            });
        }
        img.src = data;
    }
    reader.readAsDataURL(file);
}
function convertJSON() {
    let file = document.getElementById('json-file').files[0];
    if (file.name.split('.')[1] === 'json') {
        let reader = new FileReader();
        reader.onload = function() {
            let data = reader.result;
            let obj = JSON.parse(data);
            protobuf.load("proto/proto.proto", function(err, root) {
                if(err) {throw err};

                let message = root.lookupType("COD.Level.Level");
                let errMsg = message.verify(obj);
                if(errMsg) {throw Error(errMsg)};
                let buffer = message.encode(message.fromObject(obj)).finish();
                
                let blob = new Blob([buffer], {type: "application/octet-stream"});
                
                let link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.download = file.name.replace('.json', '.level');
                link.click();
            });
        }
        reader.readAsText(file);
    } else if (file.name.split('.')[1] === 'level') {
        readArrayBuffer(file).then((obj) => {
            let json = JSON.stringify(obj, null, 2);
            let blob = new Blob([json], {type: "application/json"});
                
            let link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = file.name.replace('.level', '.json');
            link.click();
        });
    }
}
function generatePointCloud() {
    let file = document.getElementById('pointcloud-file').files[0];
    let reader = new FileReader();
    reader.onload = function() {
        let data = reader.result;
        let level = {
            "ambienceSettings": {
                "skyHorizonColor": {
                    "a": 1.0,
                    "b": 0.9574,
                    "g": 0.9574,
                    "r": 0.916
                },
                "skyZenithColor": {
                    "a": 1.0,
                    "b": 0.73,
                    "g": 0.476,
                    "r": 0.28
                },
                "sunAltitude": 45.0,
                "sunAzimuth": 315.0,
                "sunSize": 1.0
            },
            "creators": "",
            "description": "model by grab-tools.live",
            "formatVersion": 12,
            "levelNodes": [],
            "maxCheckpointCount": 10,
            "title": "pointcloud"
        }
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

        protobuf.load("proto/proto.proto", function(err, root) {
            if(err) {throw err};

            let message = root.lookupType("COD.Level.Level");
            let errMsg = message.verify(level);
            if(errMsg) {throw Error(errMsg)};
            let buffer = message.encode(message.fromObject(level)).finish();
            
            let blob = new Blob([buffer], {type: "application/octet-stream"});
            
            let link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = (Date.now()).toString().slice(0, -3)+".level";
            link.click();
        });
    }
    reader.readAsText(file);

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
function explodeLevel() {
    let file = document.getElementById('explode-file').files[0];
    readArrayBuffer(file).then((level) => {

        let max = [0, 0, 0];
        let min = [0, 0, 0];
        let center = [0, 0, 0];
        runOnNodes(level.levelNodes, (node) => {
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
        runOnNodes(level.levelNodes, (node) => {
            let position = Object.values(node)[0].position;
            position.x += (position.x - center[0])*0.2;
            position.y += (position.y - center[1])*0.2;
            position.z += (position.z - center[2])*0.2;
        }, false);

        level.title += " Exploded"

        protobuf.load("proto/proto.proto", function(err, root) {
            if(err) {throw err};

            let message = root.lookupType("COD.Level.Level");
            let errMsg = message.verify(level);
            if(errMsg) {throw Error(errMsg)};
            let buffer = message.encode(message.fromObject(level)).finish();
            
            let blob = new Blob([buffer], {type: "application/octet-stream"});
            
            let link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = (Date.now()).toString().slice(0, -3)+".level";
            link.click();
        });
    });
}

let buttons = document.querySelectorAll('.tools-button');
buttons.forEach((btn) => {
    let btnId = btn.id;
    btn.addEventListener('click', () => {
        document.querySelectorAll('#other-tools > div').forEach(e => {
            if (e.id != 'advertisement') {
                e.style.display = 'none';
            }
        });
        document.querySelectorAll('.tab-active').forEach(e => {
            e.classList.remove('tab-active');
        });
        document.getElementById(btnId.replace("Button", "")).style.display = "flex";
        btn.classList.add('tab-active');

        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('tab', btnId);
        window.history.replaceState({}, '', `${location.pathname}?${urlParams}`);
    });
});

document.getElementById('questMultiSelectButton').addEventListener('click', () => {
    document.getElementById('questMultiSelect').style.display = 'flex';
    document.getElementById('compile-file').style.display = 'none';
    document.getElementById('compile-btn-qms').style.display = 'flex';
    document.getElementById('compile-btn').style.display = 'none';
});

document.getElementById('pixelate-btn').addEventListener("click", pixelate);
document.getElementById('smorg-btn').addEventListener('click', MultiDownload);
document.getElementById("compile-btn").addEventListener("click", () => {compile()});
document.getElementById("compile-btn-qms").addEventListener("click", () => {compile(true)});
document.getElementById('signs-download').addEventListener("click", TextToSigns);
document.getElementById('Scripture-download').addEventListener("click", scripture);
document.getElementById('json-btn').addEventListener("click", convertJSON);
document.getElementById('pointcloud-btn').addEventListener("click", generatePointCloud);
document.getElementById('explode-btn').addEventListener("click", explodeLevel);
document.getElementById('outline-btn').addEventListener("click", outlineLevel);

const urlParams = new URLSearchParams(window.location.search);
const tab = urlParams.get('tab');
if (tab) {
    document.getElementById(tab).click();
}
