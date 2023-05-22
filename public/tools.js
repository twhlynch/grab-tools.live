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