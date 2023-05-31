
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
            let obj = data.results[j + (i * cols)];
            cell.className = `t-${obj.attributes.texture} m-${obj.attributes.model} h-${obj.attributes.hitbox} i-${obj.attributes.interaction_hitbox}`;
            cell.innerHTML = `${`${obj.attributes.effects}`.split(',').join("<br>")}<br>${obj.attributes.texture}<br>${obj.attributes.model}<br>${obj.attributes.hitbox}<br>${obj.attributes.interaction_hitbox}`;
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
});