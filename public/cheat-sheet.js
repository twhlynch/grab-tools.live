levelJson = {
    "formatVersion": 6,
    "title": "New Level",
    "creators": ".index-cheat-sheet",
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
};
fetch("cheat-sheet.json").then((response) => response.json()).then((data) => {
    var table = document.getElementById("data-table");
    let cols = data.shapes.length;
    let rows = data.materials.length;

    let row1 = document.createElement("tr");
    let col1 = document.createElement("td");
    row1.appendChild(col1);
    for (var i = 0; i < cols; i++) {
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
            let div = document.createElement("div");
            let obj = data.results[j + (i * cols)];
            let shape = document.createElement('img');
            shape.src = `shapes/${obj.attributes.model}.svg`.toLowerCase();
            let hitbox = document.createElement('img');
            hitbox.src = `shapes/${obj.attributes.hitbox}-r.svg`.toLowerCase();
            let interact = document.createElement('img');
            interact.src = `shapes/${obj.attributes.interaction_hitbox}-g.svg`.toLowerCase();
            let texture = document.createElement('img');
            texture.src = `textures/${obj.attributes.texture.split("/")[0]}.png`.toLowerCase();
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
                icon.src = `effects/${effect}.svg`.toLowerCase();
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
            }
            else {
                el.style.backgroundColor = 'rgb(204, 255, 204)';
                console.log(el.id);
            }
        });
    });
});




