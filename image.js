let nodes;
let quality;
let title;
let desc;
let creators;
let name;
let file;
let image;
let background;
let ctx;
let ictx;

document.getElementById('choose-file').addEventListener("click", () => {
    document.getElementById('file').click();
}, false);
document.getElementById('pixelate-btn').addEventListener("click", pixelate, false);

function pixelate() {
    nodes = [];
    quality = document.getElementById('quality').value;
    title = document.getElementById('title').value;
    desc = document.getElementById('desc').value;
    creators = document.getElementById('creators').value;
    name = (Date.now()).toString().slice(0, -3);
    file = document.getElementById('file').files[0];
    image = document.getElementById('image');
    background = document.getElementById('background');
    ctx = background.getContext('2d');
    ictx = image.getContext('2d');
    if (quality < 1) {
        quality = 50;
    }

    let reader = new FileReader();

    reader.onload = function() {
        let data = reader.result;
        let img = new Image();
        img.onload = function() {
            image.width = img.width;
            image.height = img.height;
            ictx.drawImage(img, 0, 0);
            background.width = quality;
            background.height = quality;
            background.style.display = 'block';
            let pixels = [];
            for (let x = 0; x < quality; x++) {
                for (let y = 0; y < quality; y++) {
                    let pixel = ictx.getImageData(x*(img.width/quality), y*(img.height/quality), 1, 1);
                    ctx.putImageData(pixel, x, y);
                    let rgb = pixel.data;
                    pixels.push([rgb[0], rgb[1], rgb[2], x, y*-1]);
                }
            }
            let obj = pixelsToLevel(pixels);
            
            protobuf.load("proto/level.proto", function(err, root) {
                if(err) {throw err};
  
                let message = root.lookupType("COD.Level.Level");
                let errMsg = message.verify(obj);
                
                let buffer = message.encode(message.fromObject(obj)).finish();
                
                let blob = new Blob([buffer], {type: "application/octet-stream"});
                
                let link = document.getElementById("download");
                link.href = window.URL.createObjectURL(blob);
                link.download = name+".level";
            });
        }
        img.src = data;
    }
    reader.readAsDataURL(file);
}

function pixelsToLevel(pixels) {
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
    desc += ' pixel art credit - .index ';
    if (title == '') {
        title = 'Untitled Pixel Art';
    }
    let json = `
    {
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
        "complexity": `+quality**2*2+`,
        "creators": "`+creators+`",
        "description": "`+desc+`",
        "formatVersion": 6,
        "levelNodes": `+JSON.stringify(pixelNodes)+`,
        "maxCheckpointCount": 10,
        "title": "`+title+`"
    }
    `
    return JSON.parse(json);
}