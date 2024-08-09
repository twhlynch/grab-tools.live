let levelJson = {
    "formatVersion": 9,
    "title": "New Level",
    "creators": ".index-cheat-sheet",
    "description": ".index modding - grab-tools.live",
    "levelNodes": [],
    "tags": [],
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
};
let list = [];
let version = "2"
if (location.href.includes("v1")) {
    version = "1";
}
fetch(`stats_data/cheat-sheetv${version}.json`).then((response) => response.json()).then((data) => {
    let table = document.getElementById("data-table");
    let cols = data.shapes.length;
    let rows = data.materials.length;

    let row1 = document.createElement("tr");
    let col1 = document.createElement("td");
    col1.innerText = "*";
    col1.id = "all";
    col1.addEventListener("click", () => {
        document.querySelectorAll('.sheet td:not(.sheet td:nth-child(1)):not(.sheet > tr:nth-child(1) > td)').forEach(el => {
            el.click()
        });
    });
    row1.appendChild(col1);
    for (let i = 0; i < cols; i++) {
        let col = document.createElement("td");
        col.innerHTML = `${data.shapes[i]}`;
        row1.appendChild(col);
    }
    table.appendChild(row1);

    for (let i = 0; i < rows; i++) {
        let row = document.createElement("tr")
        let col_1 = document.createElement("td");
        col_1.innerHTML = `${data.materials[i]}`;
        row.appendChild(col_1);
        for (let j = 0; j < cols; j++) {
            let cell = document.createElement("td")
            cell.id = `${data.materials[i]}_${data.shapes[j]}`;
            if (data.materials[i] < 0) {
                cell.classList.add('unknown');
            }
            let div = document.createElement("div");
            let obj = data.results[j + (i * cols)];
            let shape = document.createElement('img');
            shape.src = `/img/shapes/${obj.attributes.model}.svg`.toLowerCase();
            let hitbox = document.createElement('img');
            hitbox.src = `/img/shapes/${obj.attributes.hitbox}-r.svg`.toLowerCase();
            let interact = document.createElement('img');
            interact.src = `/img/shapes/${obj.attributes.interaction_hitbox}-g.svg`.toLowerCase();
            let texture = document.createElement('img');
            texture.src = `/img/textures/${obj.attributes.texture.split("/")[0]}.png`.toLowerCase();
            shape.draggable = false;
            hitbox.draggable = false;
            interact.draggable = false;
            texture.draggable = false;
            div.appendChild(shape);
            div.appendChild(hitbox);
            div.appendChild(interact);
            cell.appendChild(texture);
            cell.appendChild(div);
            let div2 = document.createElement('div');
            obj.attributes.effects.forEach((effect) => {
                let icon = document.createElement('img');
                icon.draggable = false;
                icon.src = `/img/effects/${effect}.svg`.toLowerCase();
                div2.appendChild(icon);
            });
            cell.append(div2);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    document.querySelectorAll('.sheet td:not(.sheet td:nth-child(1)):not(.sheet > tr:nth-child(1) > td)').forEach(el => {
        el.addEventListener('click', () => {
            if (el.style.backgroundColor == 'rgb(204, 255, 204)') {
                el.style.backgroundColor = '#D5D5D5';
                list = list.filter(e => e !== el.id);
            }
            else {
                el.style.backgroundColor = 'rgb(204, 255, 204)';
                list.push(el.id);
            }
        });
    });
    let params = location.href.split('=');
    if (params.length > 1) {
        params = params[1]
        if (params.length > 0) {
            params.split('+').forEach((value) => {
                document.getElementById(value).click();
            });
        }
    }
    document.getElementById('copy').addEventListener('click', () => {
        let url = `${location.href.split('?')[0]}?data=${list.join('+')}`;
        navigator.clipboard.writeText(url);
    });
    document.getElementById('save').addEventListener('click', () => {
        let url = `${location.href.split('?')[0]}?data=${list.join('+')}`;
        navigator.clipboard.writeText(url);
        for (let i = 0; i < list.length; i++) {
            msArr = list[i].split('_');
            if (msArr[0] == "null") {
                msArr[0] = null;
            } else {
                msArr[0] = parseInt(msArr[0])
            }
            if (msArr[1] == "null") {
                msArr[1] = null;
            } else {
                msArr[1] = parseInt(msArr[1])
            }
            node = {
                "levelNodeStatic": {
                    "material": msArr[0],
                    "shape": msArr[1],
                    "position": {
                        "x": i - Math.floor(i/14) * 14,
                        "y": 0,
                        "z": Math.floor(i/14)
                    },
                    "scale": {
                        "x": 1,
                        "y": 1,
                        "z": 1
                    },
                    "rotation": {
                        "w": 1
                    },
                    "color1": {
                        "r": 0.00001,
                        "g": 0.00001,
                        "b": 0.00001,
                        "a": 1
                    }
                }
            }
            levelJson.levelNodes.push(node);
            group = {
                "levelNodeGroup": {
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
                        "w": 1
                    }, 
                    "childNodes": [{
                        "levelNodeStatic": {
                            "material": msArr[0],
                            "shape": msArr[1],
                            "position": {
                                "x": 16 + i - Math.floor(i/14) * 14,
                                "y": 0,
                                "z": Math.floor(i/14)
                            },
                            "scale": {
                                "x": 1,
                                "y": 1,
                                "z": 1
                            },
                            "rotation": {
                                "w": 1
                            },
                            "color1": {
                                "r": 0.00001,
                                "g": 0.00001,
                                "b": 0.00001,
                                "a": 1
                            }
                        }
                    },{
                        "levelNodeStatic": {
                            "material": 8,
                            "shape": 3,
                            "position": {
                                "x": 16 + i - Math.floor(i/14) * 14,
                                "y": 0.65,
                                "z": Math.floor(i/14)
                            },
                            "scale": {
                                "x": 0.1,
                                "y": 0.1,
                                "z": 0.1
                            },
                            "rotation": {
                                "w": 1
                            },
                            "color1": {
                                "r": 0.00001,
                                "g": 0.00001,
                                "b": 0.00001,
                                "a": 1
                            }
                        }
                    }]
                }
            }
            levelJson.levelNodes.push(group);
        }

        fetch("proto/proto.proto").then(r => {return r.text();}).then(protobufData => {

            let moddedShapes = "";
            let moddedMaterials = "";

            for (let i = -100; i < 0; i++) {
                moddedShapes += `NS${-i}=${i};`;
                moddedMaterials += `NM${-i}=${i};`;
            }
            
            let pb = protobuf.parse(protobufData, { keepCase: true });
            let currentMaterials = Object.values(pb.root.COD.Level.LevelNodeMaterial);
            let currentShapes = Object.values(pb.root.COD.Level.LevelNodeShape);

            for (let i = 0; i < 200; i++) {
                if (!currentMaterials.includes(i)) {
                    moddedMaterials += `M${i}=${i};`;
                }
                if (!currentShapes.includes(i)) {
                    moddedShapes += `S${i}=${i};`;
                }
            }

            for (let i = 900; i < 1100; i++) {
                if (!currentMaterials.includes(i)) {
                    moddedMaterials += `M${i}=${i};`;
                }
                if (!currentShapes.includes(i)) {
                    moddedShapes += `S${i}=${i};`;
                }
            }

            let protobuf_chunks = protobufData.split("enum LevelNodeShape");
            protobuf_chunks[1] = protobuf_chunks[1].replace("{", `{\n//Modded types\n${moddedShapes}\n\n`);
            let newProtobuf = protobuf_chunks.join("enum LevelNodeShape");

            protobuf_chunks = newProtobuf.split("enum LevelNodeMaterial");
            protobuf_chunks[1] = protobuf_chunks[1].replace("{", `{\n//Modded types\n${moddedMaterials}\n\n`);
            newProtobuf = protobuf_chunks.join("enum LevelNodeMaterial");

            let {root} = protobuf.parse(newProtobuf, { keepCase: true });
            let message = root.lookupType("COD.Level.Level");
            let errMsg = message.verify(levelJson);
            if(errMsg) {throw Error(errMsg)};
            let buffer = message.encode(message.fromObject(levelJson)).finish();
            
            let blob = new Blob([buffer], {type: "application/octet-stream"});
    
            let link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = (Date.now()).toString().slice(0, -3)+".level";
            link.click();
        });

    });
});




