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
            let div = document.createElement("div");
            let obj = data.results[j + (i * cols)];
            cell.className = `m-${obj.attributes.model} h-${obj.attributes.hitbox} i-${obj.attributes.interaction_hitbox}`;
            let shape = document.createElement('img');
            shape.src = `shapes/${obj.attributes.model}.svg`;
            let hitbox = document.createElement('img');
            hitbox.src = `shapes/${obj.attributes.hitbox}-r.svg`;
            let interact = document.createElement('img');
            interact.src = `shapes/${obj.attributes.interaction_hitbox}-g.svg`;
            let texture = document.createElement('img');
            texture.src = `textures/${obj.attributes.texture.split("/")[0]}.png`;
            div.appendChild(shape);
            div.appendChild(hitbox);
            div.appendChild(interact);
            cell.appendChild(texture);
            cell.appendChild(div);
            let div2 = document.createElement('div');
            obj.attributes.effects.forEach((effect) => {
                let icon = document.createElement('img');
                icon.src = `effects/${effect}.svg`;
                div2.appendChild(icon);
            });
            cell.append(div2);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
});




