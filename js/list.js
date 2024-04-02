list = document.getElementById('list');
fetch("/stats_data/hardest_levels_list.json")
.then(response => response.json())
.then(data => {
    for (let i = 0; i < data.length; i++) {
        let level = data[i];

        list.innerHTML += `
        <div class="leaderboard-item list-item">
            <p>${i+1}</p>
            <a href="https://grabvr.quest/levels/viewer?level=${level.id}">${level.title}</a>
            <p>${level.creator}</p>
        </div>
        `;
    }
});