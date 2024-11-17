const maps = document.getElementById('maps');
const players = document.getElementById('players');

const user_id = localStorage.getItem('user_id');
const user_name = localStorage.getItem('user_name');
const isLoggedIn = (user_id && user_name);

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

let featured_creators = [];

let metrics = {};

function checkMetric(id, username) {
    for (let featured_creator of featured_creators) {
        if (featured_creator.list_key.split(":")[1] == id) {
            username = featured_creator.title;
        }
    }
    if (!(id in metrics)) {
        metrics[id] = {
            score: 0,
            rank: 0,
            records: 0,
            finishes: 0,
            challengeScore: 0,
            challengeFinishes: 0,
            challengeFirsts: 0,
            challengeMaps: 0,
            maps: 0,
            verifiedMaps: 0,
            verifiedVeryHardMaps: 0,
            verifiedImpossibleMaps: 0,
            difficulty: 0,
            verifiedDifficulty: 0,
            averageDifficulty: 0,
            averageVerifiedDifficulty: 0,
            soleVictories: 0,
            featuredRecords: 0,
            unbeatenMapPlays: 0,
            unbeatenMaps: 0,
            hardestMaps: 0,
            positions: {},
            username: username
        };
    }
}

function GetSuffix(number) {
    const suffixes = ['th','st','nd','rd'];
    const lastDigit = Math.abs(number) % 10;
    return suffixes[lastDigit < 4? lastDigit : 0];
}

function expand(element) {
    document.querySelectorAll('.list-item-expanded').forEach((e)=>{
        e.classList.remove('list-item-expanded');
    });
    element.classList.add('list-item-expanded');
}

(async () => {

    await fetch('/stats_data/featured_creators.json')
    .then(r => r.json()).then(data => {
        featured_creators = data;
    });

    await fetch("/stats_data/hardest_levels_list.json")
    .then(r => r.json()).then(data => {
        for (let i = 0; i < data.length; i++) {
            let level = data[i];

            maps.innerHTML += `
            <div class="leaderboard-item list-item${
                isLoggedIn && level.id.split(':')[0] === user_id ? ' card-personal' : ''
            }">
                <p>${i+1}</p>
                <a href="https://grabvr.quest/levels/viewer?level=${level.id}" target="_blank">${level.title}</a>
                <p>${level.creator}</p>
            </div>
            `;

            const id = level.id.split(':')[0]
            const username = level.creator || 'Unknown';

            checkMetric(id, username);

            metrics[id].hardestMaps += 1;
        }
    });

    await fetch('/stats_data/user_finishes.json')
    .then(r => r.json()).then(data => {
        for (let key in data) {

            const id = key;
            const username = data[key][1];

            checkMetric(id, username);

            metrics[id].finishes += data[key][0];
        }
    });

    await fetch('/stats_data/sorted_leaderboard_records.json')
    .then(r => r.json()).then(data => {
        for (let key in data) {

            const id = key.split(':')[0];
            const username = data[key][2];

            checkMetric(id, username);

            metrics[id].records += data[key][0];

        }
    });

    await fetch('/stats_data/sole_victors.json')
    .then(r => r.json()).then(data => {
        for (let level of data) {
            if (level?.leaderboard?.length == 1) {
                const item = level.leaderboard[0];

                const id = item.user_id;
                const username = item.user_name;

                checkMetric(id, username);

                metrics[id].soleVictories += 1;
            
            }
        }
    });

    await fetch('/stats_data/unbeaten_levels.json')
    .then(r => r.json()).then(data => {
        for (let level of data) {
            if (!("sole" in level)) {
                const id = level.identifier.split(':')[0]
                const username = level?.creators?.length ? level.creators[0] : 'Unknown';

                checkMetric(id, username);

                metrics[id].unbeatenMaps += 1;
                metrics[id].unbeatenMapPlays += level?.statistics?.total_played || 0;
            }
        }
    });

    // manual username
    await fetch('/stats_data/best_of_grab.json')
    .then(r => r.json()).then(data => {
        for (let level of data) {

            const leaderboard = level.leaderboard;
            const id = level.identifier.split(':')[0]
            const username = level?.creators?.length ? level.creators[0] : 'Unknown';

            if (leaderboard.length > 0) {
                const item = leaderboard[0];
                checkMetric(item.user_id, item.user_name);

                if (level.list_key.includes("curated_challenge")) {
                    metrics[item.user_id].challengeFirsts += 1;
                }
                metrics[item.user_id].featuredRecords += 1;
            }

            checkMetric(id, username);

            if (level.list_key.includes("curated_challenge")) {
                metrics[id].challengeMaps += 1;

                let creatorFinished = false;
                for (let i = 0; i < leaderboard.length; i++) {
                    const item = leaderboard[i];
                    if (item.user_id === id) {
                        creatorFinished = true;
                    }

                    checkMetric(item.user_id, item.user_name);
                    metrics[item.user_id].challengeFinishes += 1;
                }
                if (!creatorFinished) {
                    metrics[id].challengeFinishes += 1;
                }
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
                if (level?.statistics?.difficulty_string == 'veryhard') {
                    metrics[id].verifiedVeryHardMaps += 1
                } else if (level?.statistics?.difficulty_string == 'impossible') {
                    metrics[id].verifiedImpossibleMaps += 1
                }
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
        averageVerifiedDifficulty: 1,
        verifiedVeryHardMaps: 1,
        verifiedImpossibleMaps: 1,
        soleVictories: 1,
        featuredRecords: 1,
        unbeatenMapPlays: 1,
        unbeatenMaps: 1,
        hardestMaps: 1,
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

    const usedMetrics = {
        records: undefined, // beating maps
        finishes: undefined, // beating maps
        challengeFinishes: undefined, // beating hard maps
        challengeFirsts: undefined, // beating hard maps
        featuredRecords: undefined, // beating popular maps
        soleVictories: undefined, // beating hard maps
        challengeMaps: undefined, // making hard maps
        unbeatenMaps: undefined, // making hard maps
        hardestMaps: undefined, // making hard maps
        // verifiedVeryHardMaps: undefined, // making hard maps
        unbeatenMapPlays: undefined, // making hard maps
        // averageVerifiedDifficulty: undefined // making hard maps
        // verifiedImpossibleMaps: undefined, // making hard maps
    };
    const labels = {
        records: "Records",
        finishes: "Finishes",
        featuredRecords: "BOG Records",
        challengeFinishes: "Challenge Finishes",
        challengeFirsts: "Challenge Records",
        challengeMaps: "Challenge Maps",
        soleVictories: "Sole Finishes",
        averageVerifiedDifficulty: "AVG Maps Difficulty",
        verifiedVeryHardMaps: "Very Hard Maps",
        unbeatenMapPlays: "Unbeaten Maps Plays",
        unbeatenMaps: "Unbeaten Maps",
        hardestMaps: "Hardest Maps",
        // verifiedImpossibleMaps: "Impossible Maps"
    };

    const entries = Object.entries(metrics);
    const metric_length = entries.length;

    for (let key in usedMetrics) {
        const sorted = entries.sort((a, b) => {return b[1][key] - a[1][key]});
        sorted.forEach(([id], i) => {
            metrics[id].positions[key] = i;
        });
    }
    
    for (let id in metrics) {
        const d = metrics[id];
        for (let key in usedMetrics) {
            d.score += d[key];
            d.rank += (1 - d.positions[key] / metric_length) / Object.entries(usedMetrics).length;
        }
        d.score += d.rank;
    }

    // display
    const sorted = Object.entries(metrics).sort((a, b) => {return b[1].score - a[1].score});
    top_metrics = sorted.slice(0, 100);

    let isTop100 = false;
    for (let i = 0; i < top_metrics.length; i++) {
        const item = top_metrics[i];
        const id = item[0];
        const data = item[1];

        players.innerHTML += `
        <div class="leaderboard-item list-item${
            isLoggedIn && id === user_id ? ' card-personal' : ''
        }" onclick="expand(this)">
            <p>${i + 1}</p>
            <a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${id}" target="_blank">${data.username}</a>
            <div class="list-chart">
                ${
                    (()=>{
                        let bars = '';
                        for (let key in metrics[id].positions) {
                            bars += `<div class="metric-bar">
                                <div class="metric-bar-fill${metrics[id].positions[key] == 0 ? ' metric-bar-first' : ''}" style="height: ${100 * metrics[id][key]}%"></div>
                                <span class="metric-bar-label">${labels[key]}<br>${metrics[id][key] == 0 ? "N/a" : metrics[id].positions[key]+1}${metrics[id][key] == 0 ? "" : GetSuffix(metrics[id].positions[key]+1)}</span>
                            </div>`;
                        }
                        return bars;
                    })()
                }
            </div>
            <p>${(Math.round(data.score*100)/100).toString().padEnd(2, '.').padEnd(4, '0')}
                <span class="metric-data">${JSON.stringify(metrics[id], null, 2)}</span>
            </p>
            <div class="list-item-expanded-content">
                <div class="list-chart">
                ${
                    (()=>{
                        let bars = '';
                        for (let key in metrics[id].positions) {
                            bars += `<span class="metric-bar-label">${labels[key]}: ${metrics[id][key] == 0 ? "N/a" : metrics[id].positions[key]+1}${metrics[id][key] == 0 ? "" : GetSuffix(metrics[id].positions[key]+1)} [${"+"+(Math.round(metrics[id][key]*100)/100).toString().padEnd(2, '.').padEnd(4, '0')}] ${metrics[id][key] == 0 ? "" : ("("+(Math.round(metrics[id][key] * adjustmentMetrics[key]*100)/100).toString()+")")}</span>`;
                            bars += `<div class="metric-bar">
                                <div class="metric-bar-fill${metrics[id].positions[key] == 0 ? ' metric-bar-first' : ''}" style="width: ${100 * metrics[id][key]}%"></div>
                            </div>`;
                        }
                        return bars;
                    })()
                }
            </div>
            </div>
        </div>
        `;
        isLoggedIn && id === user_id ? isTop100 = true : null;
    }

    if (isLoggedIn && user_id in metrics) {
        console.log(metrics[user_id]);
    }

    if (isLoggedIn && !isTop100) {
        if (user_id in metrics) {
            const index = sorted.findIndex((item) => item[0] === user_id);
            players.innerHTML += `
            <div class="leaderboard-item list-item card-personal">
                <p>${index + 1}</p>
                <a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${user_id}" target="_blank">${user_name}</a>
                <p>${Math.round(metrics[user_id].score*100)/100}
                    <span class="metric-data">${JSON.stringify(metrics[user_id], null, 2)}</span>
                </p>
            </div>
        `;
        }
    }

})();