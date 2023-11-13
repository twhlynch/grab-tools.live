
let buttons = document.querySelectorAll('.tools-button');
buttons.forEach((btn) => {
    let btnId = btn.id;
    btn.addEventListener('click', () => {
        document.querySelectorAll('#other-tools > div').forEach(e => {
            e.style.display = 'none';
        });
        document.querySelectorAll('.tab-active').forEach(e => {
            e.classList.remove('tab-active');
        });
        document.getElementById(btnId.replace("Button", "")).style.display = "flex";
        btn.classList.add('tab-active');
    });
});

function readArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        let reader = new FileReader();
        reader.onload = function() {
            let data = reader.result;
            protobuf.load("proto/level.proto", function(err, root) {
                if(err) throw err;
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
                        "childNodes": object.levelNodes, 
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

document.getElementById('pixelate-btn').addEventListener("click", pixelate);
document.getElementById('smorg-btn').addEventListener('click', MultiDownload);
document.getElementById("compile-btn").addEventListener("click", compile);
document.getElementById('signs-download').addEventListener("click", TextToSigns);

// model, explode, explode-anim, outline, magic-outline, randomizer, to model, to json

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
        "formatVersion": 6,
        "levelNodes": signs,
        "maxCheckpointCount": 10,
        "title": title
    }
    
    
    protobuf.load("proto/level.proto", function(err, root) {
        if(err) throw err;

        let message = root.lookupType("COD.Level.Level");
        let errMsg = message.verify(obj);
        if(errMsg) throw Error(errMsg);
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
function compile() {
    const files = document.getElementById("compile-file").files;
    if (!files.length) return;
    
    let readers = [];
    for (let i = 0; i < files.length; i++) {
        readers.push(readArrayBuffer(files[i]));
    }

    Promise.all(readers).then((values) => {
        var finalNodes = [];
        for (let i = 0; i < values.length; i++) {
            finalNodes = finalNodes.concat(values[i]);
        }
        let creators = document.getElementById('compile-creators').value;
        let description = document.getElementById('compile-description').value + " grab-tools.live";
        let title = document.getElementById('compile-title').value;
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
            "formatVersion": 6,
            "levelNodes": finalNodes,
            "maxCheckpointCount": 10,
            "title": title
        }
        
        protobuf.load("proto/level.proto", function(err, root) {
            if(err) throw err;

            let message = root.lookupType("COD.Level.Level");
            let errMsg = message.verify(obj);
            if(errMsg) throw Error(errMsg);
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
            
            var pixels = rgbArray;
            var pixelNodes = [];
            for (var i = 0; i < pixels.length; i++) {
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
                "formatVersion": 6,
                "levelNodes": pixelNodes,
                "maxCheckpointCount": 10,
                "title": title
            }
            protobuf.load("proto/level.proto", function(err, root) {
                if(err) throw err;
  
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

/*
javascript:(function() {
    var popupContainer = document.createElement('div');
    popupContainer.style.position = 'fixed';
    popupContainer.style.top = '50%';
    popupContainer.style.left = '50%';
    popupContainer.style.transform = 'translate(-50%, -50%)';
    popupContainer.style.padding = '20px';
    popupContainer.style.background = '#ffffff';
    popupContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    popupContainer.style.zIndex = '9999';
  
    var colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.style.marginBottom = '10px';

    var colorPicker2 = document.createElement('input');
    colorPicker2.type = 'color';
    colorPicker2.style.marginBottom = '10px';
  
    var sendButton = document.createElement('button');
    sendButton.textContent = 'Send RGB Values';
    sendButton.style.padding = '8px 16px';
    sendButton.style.cursor = 'pointer';
  
    popupContainer.appendChild(colorPicker);
    popupContainer.appendChild(colorPicker2);
    popupContainer.appendChild(sendButton);
  
    sendButton.addEventListener('click', function() {
      var color = colorPicker.value;
      var color2 = colorPicker2.value;
      var red = parseInt(color.substring(1, 3), 16) / 255;
      var green = parseInt(color.substring(3, 5), 16) / 255;
      var blue = parseInt(color.substring(5, 7), 16) / 255;
  
      var red2 = parseInt(color2.substring(1, 3), 16) / 255;
      var green2 = parseInt(color2.substring(3, 5), 16) / 255;
      var blue2 = parseInt(color2.substring(5, 7), 16) / 255;
  

      const requestBody = JSON.parse(localStorage.user).user.info.active_customizations;
      requestBody.player_color_primary.color = [red, green, blue];
      requestBody.player_color_secondary.color = [red2, green2, blue2];
      fetch(`https://api.slin.dev/grab/v1/set_active_customizations?access_token=${JSON.parse(localStorage.user).user.access_token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }).then(function(response) {
        return response;
      })
      .then(function(data) {
        console.log(data);
      })
      .catch(function(error) {
        console.error('Error:', error);
      });
      
    });
  
    document.body.appendChild(popupContainer);
  })();
  */