list = document.getElementById('list');

fetch("/stats_data/list.csv")
.then(response => response.text())
.then(data => {

    let rows = data.split('\n');
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i].split(';');

        let title = row[0];
        let creator = row[1];

        list.innerHTML += `
        <div class="leaderboard-item list-item">
            <p>${i+1}</p>
            <p>${title}</p>
            <p>${creator}</p>
        </div>
        `;
    }

});