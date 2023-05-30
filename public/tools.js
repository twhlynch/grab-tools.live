function konami(callback) {
    let kkeys = [];
    // up,up,down,down,left,right,left,right,B,A
    const konami = '38,38,40,40,37,39,37,39,66,65,13';
    return event => {
        kkeys.push(event.keyCode);
        if (kkeys.toString().indexOf(konami) >= 0) {
            callback(event);
            kkeys = [];
        }
    };
}

window.addEventListener('keydown', konami(event => {
    document.getElementById('secret').style.display = 'flex';
}));

if (window.location.href.includes('?secret=true')) {
    document.getElementById('secret').style.display = 'flex';
}

async function download(link) {
  let SERVER_URL = 'https://api.slin.dev/grab/v1/';
  let id = link.split('=')[1];
  let response = await fetch(SERVER_URL + 'details/' + id.replace(':', '/'));
  let details = await response.json();
  let iteration = await details.iteration;
  link = SERVER_URL + 'download/' + id.replace(':', '/') + '/' + iteration;

  let fileResponse = await fetch(link);
  let fileBlob = await fileResponse.blob();
  let url = window.URL.createObjectURL(fileBlob);
  let a = document.createElement('a');
  a.href = url;
  a.download = iteration + '.level';
  a.click();
}

async function smorgasbord(links) {
  let promises = links.map(link => download(link));
  await Promise.all(promises);
}

document.getElementById('smorg-btn').addEventListener('click', () => {
    let links = document.getElementById('smorg-urls').value;
    links = links.split(',');
    console.log(links);
    smorgasbord(links);
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

function compile(level) {
  let files = level;
  let readers = [];

  if (!files.length) return;

  for (let i = 0; i < files.length; i++) {
      readers.push(readArrayBuffer(files[i]));
  }

  Promise.all(readers).then((values) => {
      var finalNodes = [];
      for (let i = 0; i < values.length; i++) {
          finalNodes = finalNodes.concat(values[i]);
      }
      let creators = document.getElementById('compile-creators').value;
      let desc = document.getElementById('compile-desc').value;
      let title = document.getElementById('compile-title').value;
      let name = (Date.now()).toString().slice(0, -3);
      if (title == '') {
          title = 'Untitled';
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
          "complexity": 0,
          "creators": "`+creators+`",
          "description": "`+desc+`",
          "formatVersion": 6,
          "levelNodes": `+JSON.stringify(finalNodes)+`,
          "maxCheckpointCount": 10,
          "title": "`+title+`"
      }
      `
      var obj = JSON.parse(json);
      //document.getElementById('out').innerText = json;
      //console.log(obj);
      
      protobuf.load("proto/level.proto", function(err, root) {
          if(err) throw err;

          let message = root.lookupType("COD.Level.Level");
          let errMsg = message.verify(obj);
          if(errMsg) throw Error(errMsg);
          let buffer = message.encode(message.fromObject(obj)).finish();
          
          let blob = new Blob([buffer], {type: "application/octet-stream"});
          
          let link = document.createElement("a");
          link.href = window.URL.createObjectURL(blob);
          link.download = name+".level";
          link.click();
      });
  });
}

document.getElementById("compile-btn").addEventListener("click", (e) => {
  compile(document.getElementById("compile-file").files);
});

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