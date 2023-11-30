fetch("/stats_data/list.json")
.then(response => response.json())
.then(data => {
    if (data.judges.length > 0) {
        const list = document.getElementById('list');
        const judges = document.getElementById('judges');
        const dataElement = document.getElementById('data');
        for (let i = 0; i < data.levels.length; i++) {
            let item = data.levels[i];
            let {level, identifier, title, creator} = item.level;
            let mapLink = `https://grabvr.quest/levels/viewer/?level=${identifier}`;
            let userLink = `https://grabvr.quest/levels?tab=tab_other_user&user_id=${identifier.split(":")[0]}`;

            list.innerHTML += `
            <div class="leaderboard-item">
                <a href="${mapLink}">${title}</a><a href="${userLink}">${creator}</a>
            </div>
            `;
        }
        judges.innerHTML = data.judges.join('&nbsp;•&nbsp;');
        dataElement.style.display = 'flex';
        dataElement.style.flexDirection = 'column';
    }
});