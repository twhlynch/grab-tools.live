const maps = document.getElementById('maps');
const players = document.getElementById('players');

document.getElementById('sorters').addEventListener('click', (e) => {
    const id = e.target.id;
    if (id.includes('sort-btn')) {
        document.querySelector('.sort-active').classList.remove('sort-active');
        maps.style.display = 'none';
        players.style.display = 'none';
        const list = document.getElementById(id.split('-')[0]);
        list.style.display = 'flex';
        e.target.classList.add('sort-active');
    }
});

fetch("/stats_data/hardest_levels_list.json")
.then(r => r.json()).then(data => {
    for (let i = 0; i < data.length; i++) {
        let level = data[i];

        maps.innerHTML += `
        <div class="leaderboard-item list-item">
            <p>${i+1}</p>
            <a href="https://grabvr.quest/levels/viewer?level=${level.id}" target="_blank">${level.title}</a>
            <p>${level.creator}</p>
        </div>
        `;
    }
});

let metrics = {};

function checkMetric(id, username) {
    if (!(id in metrics)) {
        metrics[id] = {
            score: 0,
            records: 0,
            finishes: 0,
            challengeScore: 0,
            challengeFinishes: 0,
            challengeFirsts: 0,
            challengeMaps: 0,
            maps: 0,
            verifiedMaps: 0,
            difficulty: 0,
            verifiedDifficulty: 0,
            averageDifficulty: 0,
            averageVerifiedDifficulty: 0,
            username: username
        };
    }
}

(async () => {

    await fetch('/stats_data/user_finishes.json')
    .then(r => r.json()).then(data => {
        for (let key in data) {

            const id = key;
            const username = data[key][2];

            checkMetric(id, username);

            metrics[id].finishes += data[key][0];
        }
    });

    await fetch('/stats_data/sorted_leaderboard_records.json')
    .then(r => r.json()).then(data => {
        for (let key in data) {

            const id = key.split(':')[0];
            const username = key.split(':')[1];

            checkMetric(id, username);

            metrics[id].records += data[key][0];

        }
    });

    await fetch('/stats_data/a_challenge.json')
    .then(r => r.json()).then(data => {
        for (let item of data) {

            const id = item[0];
            const username = item[1][1];

            checkMetric(id, username);

            metrics[id].challengeScore = item[1][0];
            metrics[id].challengeFinishes = item[1][2];
            
        }
    });

    // manual username
    await fetch('/stats_data/best_of_grab.json')
    .then(r => r.json()).then(data => {
        for (let level of data) {

            if (level.list_key.includes("curated_challenge")) {
                const leaderboard = level.leaderboard;
                if (leaderboard.length > 0) {
                    const item = leaderboard[0];
                    checkMetric(item.user_id, item.user_name);
                    metrics[item.user_id].challengeFirsts += 1;
                }
            }

            const id = level.identifier.split(':')[0]
            const username = level?.creators?.length ? level.creators[0] : 'Unknown';

            checkMetric(id, username);

            if (level.list_key.includes("curated_challenge")) {
                metrics[id].challengeMaps += 1;
            }

        }
    });

    await fetch('/stats_data/all_verified.json')
    .then(r => r.json()).then(data => {
        for (let level of data) {

            const id = level.identifier.split(':')[0]
            const username = level?.creators?.length ? level.creators[0] : 'Unknown';

            checkMetric(id, username);
            
            metrics[id].difficulty += 1 - (level?.statistics?.difficulty || 1);
            metrics[id].maps += 1;
            if (level?.tags?.length && level.tags.includes("ok")) {
                metrics[id].verifiedMaps += 1
                metrics[id].verifiedDifficulty += 1 - (level?.statistics?.difficulty || 1);
            }
        }
    });

    // averages

    for (let key in metrics) {
        const d = metrics[key];
        if (d.maps > 0) {
            d.averageDifficulty = d.difficulty / d.maps;
            d.averageVerifiedDifficulty = d.verifiedDifficulty / d.verifiedMaps;
        }
    }

    // adjust metrics

    const adjustmentMetrics = {
        records: 1,
        finishes: 1,
        challengeScore: 1,
        challengeFinishes: 1,
        challengeFirsts: 1,
        challengeMaps: 1,
        averageDifficulty: 1,
        averageVerifiedDifficulty: 1
    }

    for (let key in adjustmentMetrics) {
        for (let id in metrics) {
            const d = metrics[id];
            if (d[key] > adjustmentMetrics[key]) {
                adjustmentMetrics[key] = d[key];
            }
        }
    }

    console.log(adjustmentMetrics);

    for (let key in adjustmentMetrics) {
        for (let id in metrics) {
            const d = metrics[id];
            d[key] /= adjustmentMetrics[key];
        }
    }

    // calculation
    for (let key in metrics) {
        const d = metrics[key];

        // d.score = d.records/20 
        //         + d.finishes/50 
        //         + d.challengeScore 
        //         + d.challengeFinishes*1.2
        //         + d.challengeFirsts*4
        //         + d.challengeMaps*2
        //         + d.averageDifficulty*30
        //         + d.averageVerifiedDifficulty*50;

        d.score = d.records
                + d.finishes
                + d.challengeScore 
                + d.challengeFinishes
                + d.challengeFirsts
                + d.challengeMaps
                + d.averageDifficulty
                + d.averageVerifiedDifficulty;

    }

    // display
    const sorted = Object.entries(metrics).sort((a, b) => {return b[1].score - a[1].score});
    metrics = sorted.slice(0, 100);
    for (let i = 0; i < metrics.length; i++) {
        const item = metrics[i];
        const id = item[0];
        const data = item[1];

        players.innerHTML += `
        <div class="leaderboard-item list-item">
            <p>${i + 1}</p>
            <a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${id}" target="_blank">${data.username}</a>
            <p>${Math.round(data.score*100)/100}</p>
        </div>
        `;
    }

})();