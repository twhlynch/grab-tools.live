function levelCard(
    identifier,
    title,
    creators,
    imageThumb,
    verified,
    updatedTimestamp,
    detail
) {
    const levelUrl = `https://grabvr.quest/levels/viewer/?level=${identifier}`;
    const creatorUrl = `https://grabvr.quest/levels?tab=tab_other_user&user_id=${identifier.split(':')[0]}`;
    const creatorsString = creators? creators.join(', ') : '';
    const creator = creators ? creators[0] : '?';
    const daysOld = Math.round((new Date() - new Date(updatedTimestamp)) / (1000 * 60 * 60 * 24));
    const imageUrl = `https://grab-images.slin.dev/${imageThumb}`;

    const cardElement = document.createElement('div');
    cardElement.classList.add('leaderboard-item');
    cardElement.classList.add('leaderboard-item-card');
    verified ? cardElement.classList.add('levelItemOk') : null;

    const imageElement = document.createElement('img');
    imageElement.setAttribute('src', imageUrl);

    const infoElement = document.createElement('div');
    infoElement.classList.add('leaderboard-item-info');
    const titleElement = document.createElement('a');
    titleElement.setAttribute('href', levelUrl);
    titleElement.innerText = title;
    const byElement = document.createElement('span');
    byElement.innerText = 'by ';
    const creatorElement = document.createElement('a');
    creatorElement.setAttribute('href', creatorUrl);
    creatorElement.setAttribute('title', creatorsString);
    creatorElement.innerText = `${creator}`;

    const daysElement = document.createElement('span');
    daysElement.innerText = `${daysOld} days`;
    const detailElement = document.createElement('span');
    detailElement.innerText = detail;

    infoElement.appendChild(titleElement);
    infoElement.appendChild(document.createElement('br'));
    infoElement.appendChild(byElement);
    infoElement.appendChild(creatorElement);

    cardElement.appendChild(imageElement);
    cardElement.appendChild(infoElement);
    cardElement.appendChild(daysElement);
    cardElement.appendChild(detailElement);

    return cardElement;
}


let buttons = document.querySelectorAll('.stats-button');
buttons.forEach((btn) => {
    let btnId = btn.id;
    btn.addEventListener('click', () => {
        document.querySelectorAll('.LeaderboardOutput').forEach(e => {
            e.style.display = 'none';
        });
        document.querySelectorAll('.tab-active').forEach(e => {
            e.classList.remove('tab-active');
        });
        document.getElementById(`${btnId}-out`).style.display = "flex";
        btn.classList.add('tab-active');

        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('tab', btnId);
        window.history.replaceState({}, '', `${location.pathname}?${urlParams}`);
    });
});

function getUnbeatenLevels() {
    fetch('/stats_data/unbeaten_levels.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            const levelDiv = levelCard(
                item?.identifier,
                item?.title,
                item?.creators,
                item?.images?.thumb?.key,
                (item?.tags ? item.tags : []).includes("ok"),
                item?.update_timestamp,
                ''
            );
            document.getElementById('UnbeatenMaps-out').appendChild(levelDiv);
        });
    });
}

async function getTopPlayers() {
    fetch('/stats_data/most_verified.json')
    .then(res => res.json())
    .then(json_data => {
        for (const id in json_data) {
            const value = json_data[id];
            document.getElementById("MostVerifiedMaps-out").innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${id}">${value["user_name"]}<span class="stats-change">+${value["change"]}</span></a><span>${value["count"]} verified${(value["count"] != value["levels"]) ? (" of "+value["levels"]) : ""}</span></div>`;
        }
    });
}

function getPlayedLevels() {
    fetch('/stats_data/most_played_maps.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            const levelDiv = levelCard(
                item?.identifier,
                item?.title,
                item?.creators,
                item?.images?.thumb?.key,
                (item?.tags ? item.tags : []).includes("ok"),
                item?.update_timestamp,
                `${item?.statistics?.total_played} plays`
            );
            document.getElementById('MostPlayedMaps-out').appendChild(levelDiv);
        });
    });
}

function getTopLikes() {
    fetch('/stats_data/most_liked.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            const levelDiv = levelCard(
                item?.identifier,
                item?.title,
                item?.creators,
                item?.images?.thumb?.key,
                (item?.tags ? item.tags : []).includes("ok"),
                item?.update_timestamp,
                `${Math.round(item?.statistics?.liked * item?.statistics?.total_played * (1 - item?.statistics?.difficulty))} (${Math.round(100 * item?.statistics?.liked)}%)`
            );
            document.getElementById('MostLikedMaps-out').appendChild(levelDiv);
        });
    });
}

function getTopDisikes() {
    fetch('/stats_data/most_disliked.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            const levelDiv = levelCard(
                item?.identifier,
                item?.title,
                item?.creators,
                item?.images?.thumb?.key,
                (item?.tags ? item.tags : []).includes("ok"),
                item?.update_timestamp,
                `${Math.round((1 - item?.statistics?.liked) *  item?.statistics?.total_played * (1 - item?.statistics?.difficulty))} (${Math.round(100 - (100 * item?.statistics?.liked))}%)`
            );
            document.getElementById('MostDislikedMaps-out').appendChild(levelDiv);
        });
    });
}

function getTopTimes() {
    fetch('/stats_data/longest_times.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            const levelDiv = levelCard(
                item?.identifier,
                item?.title,
                item?.creators,
                item?.images?.thumb?.key,
                (item?.tags ? item.tags : []).includes("ok"),
                item?.update_timestamp,
                `${Math.round(item?.statistics?.time)}s`
            );
            document.getElementById('MostTimeMaps-out').appendChild(levelDiv);
        });
    });
}

function getPlaysLevels() {
    fetch('/stats_data/most_plays.json')
    .then((response) => response.json())
    .then(json_data => {
        for (const id in json_data) {
            const value = json_data[id];
            document.getElementById('MostPlays-out').innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${id}">${value["user_name"]}<span class="stats-change">+${value["change"]}</span></a><span>${value["plays"]} from ${value["count"]}${(value.count != value.levels) ? (' / '+value["levels"]) : ""} maps</span></div>`;
        }

        const sorted = Object.entries(json_data).sort((a, b) => b[1]["change"] - a[1]["change"]);
        const filtered = sorted.filter(item => item[1]["change"] != 0);

        console.log(filtered);

        for (const [id, value] of filtered) {
            document.getElementById('TodaysPlays-out').innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${id}">${value["user_name"]}</a><span>+${value["change"]}</span></div>`;
        }

    });
}

function getKeyWords() {
    fetch('/stats_data/all_verified.json')
    .then((response) => response.json())
    .then(data => {
        let keywords = {};
        data.forEach(item => {
            all = [];
            if (item.hasOwnProperty('title')) {
                title = item.title.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(" ").filter(word => word.length > 2);
                all = all.concat(title);
            }
            if (item.hasOwnProperty('creators')) {
                creators = item.creators.join(" ").toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(" ").filter(word => word.length > 2);
                all = all.concat(creators);
            }
            if (item.hasOwnProperty('description')) {
                description = item.description.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(" ").filter(word => word.length > 2);
                all = all.concat(description);
            }
            all.forEach(word => {
                if (keywords[word]) {
                    keywords[word] += 1;
                } else {
                    keywords[word] = 1;
                }
            });
        });
        const sorted = Object.entries(keywords).sort((a, b) => b[1] - a[1]);
        let top = sorted.slice(0, 100);
        for (let i = 0; i < top.length; i++) {
            document.getElementById('KeyWords-out').innerHTML += `<div class="leaderboard-item"><div>${top[i][0]}</div><span>${top[i][1]}</span></div>`;
        }
    });
}

const submitBtn = document.getElementById("submit-btn");
addEventListener("click", async (e) => {
    if (e.target.id == submitBtn.id) {
        const idInput = document.getElementById("user-input");
        const keyInput = document.getElementById("key-input");
        const output = document.getElementById("LevelSearch-out");
        let user = idInput.value;

        let id = user;
        if (user && !user.includes(":")) {
            try {
                const userDataResponse = await fetch(`https://api.slin.dev/grab/v1/list?type=user_name&search_term=${user}`);
                const userData = await userDataResponse.json();
                id = userData[0].user_id.toLowerCase();
            } catch (error) {
                console.error("Error fetching user data:", error);
                id = '290oi9frh8eihrh1r5z0q';
            }
        }

        if (user && user.includes(":")) {
            id = user.split(":")[1]
        }

        const keys = keyInput.value.toLowerCase().split("|");

        let array1 = [];
        if (user !== '' && user !== null) {
            try {
                const response1 = await fetch(`https://api.slin.dev/grab/v1/list?max_format_version=7&user_id=${id}`);
                const json_data1 = await response1.json();
                array1 = json_data1.flat()
            } catch (error) {
                console.error("Error fetching user level data:", error);
            }
        }

        const array = array1;

        let levels = array.filter(level => {
            for (var key of keys) {
                if (level["title"].toLowerCase().includes(key) && level["identifier"].split(":")[0].toLowerCase().includes(id)) {
                    return true;
                }
            }
            return false;
        });

        levels = levels.filter(level => level.hasOwnProperty("statistics"));
        levels = levels.filter(level => level.statistics.hasOwnProperty("total_played"));
        levels.sort((a, b) => b.statistics.total_played - a.statistics.total_played);

        output.querySelectorAll('.leaderboard-item').forEach(e => e.remove());
        const fragment = document.createDocumentFragment();

        let total_plays = 0;
        let total_okplays = 0;
        let total_maps = 0;
        let total_ok = 0;
        let average_likes = 0;
        let likes_count = 0;
        let average_difficulty = 0;
        let difficulty_count = 0;
        let average_time = 0;
        let time_count = 0;
        let total_complexity = 0;

        levels.forEach(item => {
            total_maps += 1;
            item?.statistics?.total_played ? total_plays += item?.statistics?.total_played : null;
            item?.tags?.includes("ok") ? total_okplays += item?.statistics?.total_played : null;
            item?.tags?.includes("ok") ? total_ok += 1 : null;
            item?.statistics?.liked ? average_likes += item?.statistics?.liked : null;
            item?.statistics?.liked ? likes_count += 1 : null;
            item?.statistics?.difficulty ? average_difficulty += item?.statistics?.difficulty : null;
            item?.statistics?.difficulty ? difficulty_count += 1 : null;
            item?.statistics?.time ? average_time += item?.statistics?.time : null;
            item?.statistics?.time ? time_count += 1 : null;
            item?.complexity ? total_complexity += item?.complexity : null;

            const levelDiv = levelCard(
                item?.identifier,
                item?.title,
                item?.creators,
                item?.images?.thumb?.key,
                (item?.tags ? item.tags : []).includes("ok"),
                item?.update_timestamp,
                `${item?.statistics?.total_played} plays`
            );
            fragment.appendChild(levelDiv);
        });

        output.appendChild(fragment);

        document.getElementById('plays-results').innerHTML = `<b>Total plays: ${total_plays}</b>`;
        document.getElementById('okplays-results').innerHTML = `<b>Total verified plays: ${total_okplays}</b>`;
        document.getElementById('maps-results').innerHTML = `<b>Total maps: ${total_maps}</b>`;
        document.getElementById('ok-results').innerHTML = `<b>Total verified maps: ${total_ok}</b>`;
        document.getElementById('likes-results').innerHTML = `<b>Average likes: ${Math.round((average_likes * 100) / likes_count)}%</b>`;
        document.getElementById('difficulty-results').innerHTML = `<b>Average difficulty: ${Math.round(100 - ((average_difficulty * 100) / difficulty_count))}%</b>`;
        document.getElementById('time-results').innerHTML = `<b>Average time: ${Math.round(Math.round(average_time / time_count))}s</b>`;
        document.getElementById('complexity-results').innerHTML = `<b>Total complexity: ${total_complexity}</b>`;
    }
});

function getDailyMap() {
    fetch('/stats_data/daily_map.json')
    .then((response) => response.json())
    .then(item => {
        document.getElementById('DailyMap-out').innerHTML += `<h1><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${(item.creators || [""])[0]}</span></h1>`;
        fetch(`https://api.slin.dev/grab/v1/statistics_top_leaderboard/${item['identifier'].replace(':', '/')}`)
        .then((response2) => response2.json())
        .then(leaderboard => {
            leaderboard.forEach( lItem => {
                document.getElementById('DailyMap-out').innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${lItem["user_id"]}">${lItem["user_name"]}</a><span>${lItem["best_time"]}s</span></div>`;
            });
        });
    });
}

function getWeeklyMap() {
    fetch('/stats_data/weekly_map.json')
    .then((response) => response.json())
    .then(item => {
        document.getElementById('WeeklyMap-out').innerHTML += `<h1><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${(item.creators || [""])[0]}</span></h1>`;
        fetch(`https://api.slin.dev/grab/v1/statistics_top_leaderboard/${item['identifier'].replace(':', '/')}`)
        .then((response2) => response2.json())
        .then(leaderboard => {
            leaderboard.forEach( lItem => {
                document.getElementById('WeeklyMap-out').innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${lItem["user_id"]}">${lItem["user_name"]}</a><span>${lItem["best_time"]}s</span></div>`;
            });
        });
    });
}

function getUnbeatenMap() {
    fetch('/stats_data/unbeaten_map.json')
    .then((response) => response.json())
    .then(item => {
        document.getElementById('UnbeatenMap-out').innerHTML += `<h1><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${(item.creators || [""])[0]}</span></h1>`;
        fetch(`https://api.slin.dev/grab/v1/statistics_top_leaderboard/${item['identifier'].replaceAll(':', '/')}`)
        .then((response2) => response2.json())
        .then(leaderboard => {
            leaderboard.forEach( lItem => {
                document.getElementById('UnbeatenMap-out').innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${lItem["user_id"]}">${lItem["user_name"]}</a><span>${lItem["best_time"]}s</span></div>`;
            });
        });
    });
}

function getChallengeScores() {
    fetch('/stats_data/map_winners.json')
    .then((response) => response.json())
    .then(items => {
        leaderboard = {};
        items.forEach( item => {
            if (item[0].length > 0) {

                if (!leaderboard[item[0][0]["user_id"]]) {
                    leaderboard[item[0][0]["user_id"]] = [item[0][0]["user_name"], 0, item[0][0]["user_id"]];
                }
                if (item[3] === "daily_map") {
                    leaderboard[item[0][0]["user_id"]][1] += 3;
                } else if (item[3] === "weekly_map") {
                    leaderboard[item[0][0]["user_id"]][1] += 10;
                } else if (item[3] === "unbeaten_map") {
                    leaderboard[item[0][0]["user_id"]][1] += 3;
                    let updated = item[1]["update_timestamp"];
                    console.log(item[1]);
                    let age = parseInt((item[2] * 1000 - updated) / 1000 / 60 / 60 / 24);
                    leaderboard[item[0][0]["user_id"]][1] += Math.floor(age / 50);
                }

            }
            if (item[0].length > 1) {

                if (!leaderboard[item[0][1]["user_id"]]) {
                    leaderboard[item[0][1]["user_id"]] = [item[0][1]["user_name"], 0, item[0][1]["user_id"]];
                }
                if (item[3] === "daily_map") {
                    leaderboard[item[0][1]["user_id"]][1] += 2;
                } else if (item[3] === "weekly_map") {
                    leaderboard[item[0][1]["user_id"]][1] += 7;
                } else if (item[3] === "unbeaten_map") {
                    leaderboard[item[0][1]["user_id"]][1] += 2;
                    let updated = item[1]["update_timestamp"];
                    let age = parseInt((item[2] * 1000 - updated) / 1000 / 60 / 60 / 24);
                    leaderboard[item[0][1]["user_id"]][1] += Math.floor(age / 100);
                }
            
            }
            if (item[0].length > 2) {

                if (!leaderboard[item[0][2]["user_id"]]) {
                    leaderboard[item[0][2]["user_id"]] = [item[0][2]["user_name"], 0, item[0][2]["user_id"]];
                }
                if (item[3] === "daily_map") {
                    leaderboard[item[0][2]["user_id"]][1] += 1;
                } else if (item[3] === "weekly_map") {
                    leaderboard[item[0][2]["user_id"]][1] += 4;
                } else if (item[3] === "unbeaten_map") {
                    leaderboard[item[0][2]["user_id"]][1] += 1;
                }

            }
        });
        leaderboard = Object.fromEntries(Object.entries(leaderboard).sort((a, b) => b[1][1] - a[1][1]));
        for (const value of Object.values(leaderboard)) {
            document.getElementById('MapChallenges-out').innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${value[2]}">${value[0]}</a><span>${value[1]} Pt</span></div>`;
        }
    });
}

function getGlobalPlays() {
    fetch('/stats_data/all_verified.json')
    .then((response) => response.json())
    .then(data => {
        let total_global_plays = 0;
        for (const level of data) {
            total_global_plays += level?.statistics?.total_played;
        }
        document.getElementById('counter').innerHTML = `<b>Total global plays: ${total_global_plays}</b>`;
    });
}

function getAChallenge() {
    fetch('/stats_data/a_challenge.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            document.getElementById('AChallenge-out').innerHTML += `<div class="leaderboard-item"><div><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${item[0]}">${item[1][1]}</a></div><span>${item[1][0]}</span></div>`;
        });
    });
}

getTopPlayers();
getUnbeatenLevels();
getPlayedLevels();
getPlaysLevels();
getTopTimes();
getTopLikes();
getTopDisikes();
getDailyMap();
getWeeklyMap();
getUnbeatenMap();
getChallengeScores();
getKeyWords();
getGlobalPlays();
getAChallenge();

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
const userName = urlParams.get('userName');
const search = urlParams.get('search');
const tab = urlParams.get('tab');
if (userId) {
    document.getElementById('user-input').value = `userId:${userId}`;
    document.getElementById('submit-btn').click();
    document.getElementById('LevelSearch').click();
} else if (userName) {
    document.getElementById('user-input').value = userName;
    document.getElementById('submit-btn').click();
    document.getElementById('LevelSearch').click();
}
if (search) {
    document.getElementById('key-input').value = search;
    document.getElementById('submit-btn').click();
    document.getElementById('LevelSearch').click();
}
if (tab) {
    document.getElementById(tab).click();
}