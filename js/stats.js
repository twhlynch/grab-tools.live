// helper functions
function numberWithCommas(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
function determineScore(record, length) {
    let position = record.position;
    let score = 1;
    if (position < 3) {
        score += 2 - (position / 2)
    } else if (position < 10) {
        score += 0.5;
    }
    if (length == 1) {
        score += 1;
    }
    
    return score;
}
function getSuffix(number) {
    number = Math.abs(Math.floor(number));

    if (number % 100 >= 11 && number % 100 <= 13) {
        return 'th';
    }

    switch (number % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

// card functions
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
    let daysOld = Math.round((new Date() - new Date(updatedTimestamp)) / (1000 * 60 * 60 * 24));
    const imageUrl = `https://grab-images.slin.dev/${imageThumb}`;

    const cardElement = document.createElement('div');
    cardElement.classList.add('leaderboard-item');
    cardElement.classList.add('leaderboard-item-card');
    verified ? cardElement.classList.add('levelItemOk') : null;

    const imageElement = document.createElement('img');
    imageElement.src = '/img/thumbnail_loading.png';
    imageElement.onload = function() {
        let index = 0;
        for (let i in cardElement.parentNode.childNodes) {
            const node = cardElement.parentNode.childNodes[i];
            if (node.classList && node.classList.contains('leaderboard-item-card')) {
                index++;
            }
            if (node === cardElement) {
                break;
            }
        }
        const force_load = [
            "CheckBestOfGrab-out",
            "CheckBestOfGrabUnbeaten-out",
            "LevelSearch-out"
        ];
        if (index <= 20 || force_load.includes(cardElement.parentElement.id) || cardElement.parentElement.getAttribute('data-forceLoad') == 'true') {
            this.src = imageUrl;
            this.onerror = function() {
                this.src = "/img/thumbnail_error.png";
                this.onload = null;
            }
        } else {
            imageElement.setAttribute('data-src', imageUrl);
        }
        this.onload = null;
    }
    imageElement.onerror = function() {
        this.src = "/img/thumbnail_error.png";
        this.onload = null;
    }

    const infoElement = document.createElement('div');
    infoElement.classList.add('leaderboard-item-info');
    const titleElement = document.createElement('a');
    titleElement.setAttribute('href', levelUrl);
    titleElement.setAttribute('target', '_blank');
    titleElement.innerText = title;
    const byElement = document.createElement('span');
    byElement.innerText = 'by ';
    const creatorElement = document.createElement('a');
    creatorElement.setAttribute('href', creatorUrl);
    creatorElement.setAttribute('target', '_blank');
    creatorElement.setAttribute('title', creatorsString);
    creatorElement.innerText = `${creator}`;

    const daysElement = document.createElement('span');
    if (daysOld) {
        daysElement.innerHTML = `${daysOld} days`;
    }
    const detailElement = document.createElement('span');
    detailElement.innerText = detail;

    infoElement.appendChild(titleElement);
    infoElement.appendChild(document.createElement('br'));
    infoElement.appendChild(byElement);
    infoElement.appendChild(creatorElement);

    cardElement.appendChild(imageElement);
    cardElement.appendChild(infoElement);
    cardElement.appendChild(daysElement);
    if (detail) {
        cardElement.appendChild(detailElement);
    }

    return cardElement;
}
function userCard(
    identifier,
    username,
    isVerified,
    isModerator,
    isAdministrator,
    detail,
    extra
) {
    const userUrl = `https://grabvr.quest/levels?tab=tab_other_user&user_id=${identifier}`;
    const cardElement = document.createElement('div');
    cardElement.classList.add('leaderboard-item');
    isVerified ? cardElement.classList.add('levelItemOk') : null;
    isModerator ? cardElement.classList.add('levelItemModerator') : null;
    isAdministrator ? cardElement.classList.add('levelItemAdministrator') : null;

    const userElement = document.createElement('a');
    userElement.setAttribute('href', userUrl);
    userElement.setAttribute('target', '_blank');
    userElement.innerText = username;

    const extraElement = document.createElement('span');
    extraElement.innerText = extra;
    extraElement.classList.add('stats-change');

    const detailElement = document.createElement('span');
    detailElement.innerText = detail;

    cardElement.appendChild(userElement);
    userElement.appendChild(extraElement);
    cardElement.appendChild(detailElement);

    return cardElement;
}
function genericLevelCard(level, detail, timestamp='') {
    const level_card = levelCard(
        level?.identifier,
        level?.title,
        level?.creators,
        level?.images?.thumb?.key,
        (level?.tags ? level.tags : []).includes("ok"),
        timestamp,
        `${detail}`
    );
    return level_card;
}

// stats functions
function getUnbeatenLevels() {
    document.getElementById('Global-out').innerHTML += `<p>Unbeaten maps: ${statistics.unbeaten_levels.length}</p>`;
    const sortedByUpdated = statistics.unbeaten_levels.sort((a, b) => a.update_timestamp - b.update_timestamp);
    const sortedByCreated = statistics.unbeaten_levels.sort((a, b) => a.creation_timestamp - b.creation_timestamp);

    for (const item of statistics.unbeaten_levels) {
        const detail = `${Math.round((new Date() - new Date(item?.update_timestamp)) / (1000 * 60 * 60 * 24))} days`;
        const level_card = genericLevelCard(item, detail);
        if ("sole" in item) { level_card.style.borderColor = "#ff000055"; }
        document.getElementById('UnbeatenMaps-out').appendChild(level_card);
    }
    
    for (const item of sortedByUpdated) {
        const detail = `${Math.round((new Date() - new Date(item?.update_timestamp)) / (1000 * 60 * 60 * 24))} days`;
        const level_card = genericLevelCard(item, detail);
        if ("sole" in item) { level_card.style.borderColor = "#ff000055"; }
        document.getElementById('UnbeatenMapsUpdated-out').appendChild(level_card);
    }

    for (const item of sortedByCreated) {
        const detail = `${Math.round((new Date() - new Date(item?.creation_timestamp)) / (1000 * 60 * 60 * 24))} days`;
        const level_card = genericLevelCard(item, detail);
        if ("sole" in item) { level_card.style.borderColor = "#ff000055"; }
        document.getElementById('UnbeatenMapsCreated-out').appendChild(level_card);
    }
}
function getTopPlayers() {
    for (const key in statistics.most_verified) {
        const value = statistics.most_verified[key];
        const user_card = userCard(
            key, 
            value["user_name"], 
            false, 
            false, 
            false,  
            `${value["count"]}${(value["count"] != value["levels"]) ? (" / "+value["levels"]) : ""}`, 
            `+${value["change"]}`
        );
        document.getElementById('MostVerifiedMaps-out').appendChild(user_card);
    }
}
function getPlayedLevels() {
    for (const item of statistics.most_played_maps) {
        const detail = `${item?.statistics?.total_played} plays`;
        const level_card = genericLevelCard(item, detail, timestamp=item?.update_timestamp);
        document.getElementById('MostPlayedMaps-out').appendChild(level_card);
    }
}
function getTopLikes() {
    for (const item of statistics.most_liked) {
        const detail = `${Math.round(item?.statistics?.liked * item?.statistics?.total_played * (1 - item?.statistics?.difficulty))} (${Math.round(100 * item?.statistics?.liked)}%)`;
        const level_card = genericLevelCard(item, detail);
        document.getElementById('MostLikedMaps-out').appendChild(level_card);
    }
}
function getTopDislikes() {
    for (const item of statistics.most_disliked) {
        const detail = `${Math.round((1 - item?.statistics?.liked) * item?.statistics?.total_played * (1 - item?.statistics?.difficulty))} (${Math.round(100 - (100 * item?.statistics?.liked))}%)`;
        const level_card = genericLevelCard(item, detail);
        document.getElementById('MostDislikedMaps-out').appendChild(level_card);
    }
}
function getTopTimes() {
    for (const item of statistics.longest_times) {
        const detail = `${Math.round(item?.statistics?.time)}s`;
        const level_card = genericLevelCard(item, detail);
        document.getElementById('MostTimeMaps-out').appendChild(level_card);
    }
}
function getSoleLevels() {
    for (const item of statistics.sole_victors) {
        const detail = `${Math.round((new Date() - new Date(item?.update_timestamp)) / (1000 * 60 * 60 * 24))} days`;
        const level_card = genericLevelCard(item, detail);
        document.getElementById('SoleBeatenMaps-out').appendChild(level_card);
    }
}
function getPlaysLevels() {
    for (const key in statistics.most_plays) {
        const value = statistics.most_plays[key];
        const user_card = userCard(
            key, 
            value["user_name"], 
            false, 
            false, 
            false, 
            `${value["plays"]} (${value["count"]} maps)`, 
            `+${value["change"]}`
        );
        document.getElementById('MostPlays-out').appendChild(user_card);
    }

    const trending = Object.entries(statistics.most_plays).sort((a, b) => b[1]["change"] - a[1]["change"]).filter(item => item[1]["change"] != 0);

    for (const [id, value] of trending) {
        const user_card = userCard(
            id, 
            value["user_name"], 
            false, 
            false, 
            false, 
            `+${value["change"]}`, 
            ''
        );
        document.getElementById('TodaysPlays-out').appendChild(user_card);
    }
}
function getTrendingLevels() {
    for (const item of statistics.trending_levels) {
        const detail = `${item?.change} plays`;
        const level_card = genericLevelCard(item, detail, timestamp=item?.creation_timestamp);
        if (item?.identifier != "2ap647di3dc1k42jf4o2o:1682810607" && item?.identifier != "29t798uon2urbra1f8w2q:1693775768") {
            document.getElementById('Trending-out').appendChild(level_card);
        }
    }
}
function makeFeaturedButtons() {
    document.getElementById('Global-out').innerHTML += `<p>Featured creators: ${statistics.featured_creators.length}</p>`;

    const output = document.getElementById('other-user-options');
    for (const creator of statistics.featured_creators) {
        let creatorUserName = creator.title;
        let creatorUserId = creator.list_key.split(':')[1];
        
        const optionElement = document.createElement('button');
        optionElement.addEventListener('click', () => {
            document.getElementById("user-input").value = `userId:${creatorUserId}`;
            document.getElementById("submit-btn").click();
        });
        optionElement.innerText = creatorUserName;
        optionElement.classList.add('button-sml');
        output.appendChild(optionElement);
    }
}
function getDailyMap() {
    document.getElementById('DailyMap-out').innerHTML += `<h1><a target="_blank" href="https://grabvr.quest/levels/viewer/?level=${statistics.daily_map["identifier"]}">${statistics.daily_map["title"]}</a><br>by <span title="${statistics.daily_map["creators"]}">${(statistics.daily_map.creators || [""])[0]}</span></h1>`;
    fetch(`https://api.slin.dev/grab/v1/statistics_top_leaderboard/${statistics.daily_map['identifier'].replace(':', '/')}`)
    .then((response2) => response2.json())
    .then(leaderboard => {
        leaderboard.forEach( lItem => {
            const user_card = userCard(
                lItem["user_id"], 
                lItem["user_name"], 
                false, 
                false, 
                false, 
                `${lItem["best_time"]}s`, 
                ''
            );
            document.getElementById('DailyMap-out').appendChild(user_card);
        });
    });
}
function getWeeklyMap() {
    document.getElementById('WeeklyMap-out').innerHTML += `<h1><a target="_blank" href="https://grabvr.quest/levels/viewer/?level=${statistics.weekly_map["identifier"]}">${statistics.weekly_map["title"]}</a><br>by <span title="${statistics.weekly_map["creators"]}">${(statistics.weekly_map.creators || [""])[0]}</span></h1>`;
    fetch(`https://api.slin.dev/grab/v1/statistics_top_leaderboard/${statistics.weekly_map['identifier'].replace(':', '/')}`)
    .then((response2) => response2.json())
    .then(leaderboard => {
        leaderboard.forEach( lItem => {
            const user_card = userCard(
                lItem["user_id"], 
                lItem["user_name"], 
                false, 
                false, 
                false, 
                `${lItem["best_time"]}s`, 
                ''
            );
            document.getElementById('WeeklyMap-out').appendChild(user_card);
        });
    });
}
function getUnbeatenMap() {
    document.getElementById('UnbeatenMap-out').innerHTML += `<h1><a target="_blank" href="https://grabvr.quest/levels/viewer/?level=${statistics.unbeaten_map["identifier"]}">${statistics.unbeaten_map["title"]}</a><br>by <span title="${statistics.unbeaten_map["creators"]}">${(statistics.unbeaten_map.creators || [""])[0]}</span></h1>`;
    fetch(`https://api.slin.dev/grab/v1/statistics_top_leaderboard/${statistics.unbeaten_map['identifier'].replaceAll(':', '/')}`)
    .then((response2) => response2.json())
    .then(leaderboard => {
        leaderboard.forEach( lItem => {
            const user_card = userCard(
                lItem["user_id"], 
                lItem["user_name"], 
                false, 
                false, 
                false, 
                `${lItem["best_time"]}s`, 
                ''
            );
            document.getElementById('UnbeatenMap-out').appendChild(user_card);
        });
    });
}
function getChallengeScores() {
    leaderboard = {};
    for (const item of statistics.map_winners) {
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
    }

    leaderboard = Object.fromEntries(Object.entries(leaderboard).sort((a, b) => b[1][1] - a[1][1]));
    for (const value of Object.values(leaderboard)) {
        const user_card = userCard(
            value[2], 
            value[0], 
            false, 
            false, 
            false, 
            `${value[1]} Pt`, 
            ''
        );
        document.getElementById('MapChallenges-out').appendChild(user_card);
    }
}
function getGlobalPlays() {
    document.getElementById('Global-out').innerHTML += `<p>Total maps: ${numberWithCommas(statistics.total_level_count.levels)}</p>`;
    
    let globalData = {
        "plays": 0,
        "verified_maps": 0,
        "todays_plays": 0,
        "average_difficulty": 0,
        "average_plays": 0,
        "average_likes": 0,
        "average_time": 0,
        "complexity": 0,
        "iterations": 0,
        "average_complexity": 0,
    };
    for (const level of statistics.all_verified) {
        globalData.plays += level?.statistics?.total_played;
        globalData.verified_maps += 1;
        globalData.todays_plays += level?.change;
        globalData.average_difficulty += level?.statistics?.difficulty;
        globalData.average_likes += level?.statistics?.liked;
        globalData.average_time += level?.statistics?.time;
        globalData.complexity += level?.complexity;
        globalData.iterations += parseInt(level?.data_key?.split(':')[3]);
    }
    globalData.average_difficulty /= globalData.verified_maps;
    globalData.average_likes /= globalData.verified_maps;
    globalData.average_time /= globalData.verified_maps;
    globalData.average_plays = globalData.plays / globalData.verified_maps;
    globalData.average_complexity = globalData.complexity / globalData.verified_maps;

    document.getElementById('counter').innerHTML = `<b>Total global plays: ${numberWithCommas(globalData.plays)}</b>`;
    document.getElementById('Global-out').innerHTML += `<p>Total plays: ${numberWithCommas(globalData.plays)}</p>`;
    document.getElementById('Global-out').innerHTML += `<p>Verified maps: ${numberWithCommas(globalData.verified_maps)}</p>`;
    document.getElementById('Global-out').innerHTML += `<p>Todays plays: ${numberWithCommas(globalData.todays_plays)}</p>`;
    document.getElementById('Global-out').innerHTML += `<p>Total complexity: ${numberWithCommas(globalData.complexity)}</p>`;
    document.getElementById('Global-out').innerHTML += `<p>Iterations: ${numberWithCommas(globalData.iterations)}</p>`;
    document.getElementById('Global-out').innerHTML += `<p>Average difficulty: ${Math.round(globalData.average_difficulty*100)}%</p>`;
    document.getElementById('Global-out').innerHTML += `<p>Average plays: ${numberWithCommas(Math.round(globalData.average_plays*100)/100)}</p>`;
    document.getElementById('Global-out').innerHTML += `<p>Average likes: ${Math.round(globalData.average_likes*100)}%</p>`;
    document.getElementById('Global-out').innerHTML += `<p>Average time: ${Math.round(globalData.average_time*100)/100}s</p>`;
    document.getElementById('Global-out').innerHTML += `<p>Average complexity: ${numberWithCommas(Math.round(globalData.average_complexity*100)/100)}</p>`;
}
function getBestOfGrab() {
    document.getElementById('Global-out').innerHTML += `<p>Featured maps: ${statistics.best_of_grab.length}</p>`;

    let list_keys = [];
    let key_lengths = {};
    statistics.best_of_grab.forEach(item => {
        let list_key = item.list_key;
        let list_key_split = list_key.split(":");
        list_key_split.forEach( key => {
            if (list_keys.indexOf(key) == -1) {
                list_keys.push(key);
            }
            if (key_lengths[key]) {
                key_lengths[key] += 1;
            } else {
                key_lengths[key] = 1;
            }
        } );
    });
    let playerFeatures = {};
    let playerCompletions = {};
    let playerCompletionsByKey = {};
    list_keys.forEach(key => {
        playerCompletionsByKey[key] = {};
    });
    statistics.best_of_grab.forEach(item => {
        if (playerFeatures[item.identifier.split(':')[0]]) {
            playerFeatures[item.identifier.split(':')[0]].score += 1;
            if (playerFeatures[item.identifier.split(':')[0]].user_name == "undefined") {
                playerFeatures[item.identifier.split(':')[0]].user_name = (""+item?.creators).split(',')[0];
            }
        } else {
            playerFeatures[item.identifier.split(':')[0]] = {score: 1, user_name: (""+item?.creators).split(',')[0]}
        }

        let leaderboard = item.leaderboard;
        let list_key = item.list_key.split(":");
        leaderboard.forEach( lItem => {
            let score = determineScore(lItem, leaderboard.length);
            if (playerCompletions[lItem.user_id]) {
                playerCompletions[lItem.user_id].maps += 1;
                playerCompletions[lItem.user_id].score += score;
            } else {
                playerCompletions[lItem.user_id] = {
                    user_name: lItem.user_name,
                    maps: 1,
                    firsts: 0,
                    score: score
                }
            }
            if (lItem.position == 0) {
                playerCompletions[lItem.user_id].firsts += 1;
            }
            list_key.forEach( lKey => {
                if (playerCompletionsByKey[lKey][lItem.user_id]) {
                    playerCompletionsByKey[lKey][lItem.user_id].maps += 1;
                    playerCompletionsByKey[lKey][lItem.user_id].score += score;
                } else {
                    playerCompletionsByKey[lKey][lItem.user_id] = {
                        user_name: lItem.user_name,
                        firsts: 0,
                        maps: 1,
                        score: score
                    }
                }
                if (lItem.position == 0) {
                    playerCompletionsByKey[lKey][lItem.user_id].firsts += 1;
                }
            });
        });
    });

    playerFeatures = Object.entries(playerFeatures).sort((a, b) => b[1].score - a[1].score);
    playerFeatures.forEach( item => {
        const user_card = userCard(
            item[0],
            item[1].user_name,
            false,
            false,
            false,
            `${item[1].score} maps`,
            ''
        );
        document.getElementById('Featured-out').appendChild(user_card);
    });

    let sortingContainer = document.getElementById('BestOfGrab-sort');
    let listsContainer = document.getElementById('statistics');
    list_keys.forEach( list_key => {
        let outputElement = document.createElement('div');
        outputElement.id = 'BestOfGrab'+list_key+'-out';
        outputElement.classList.add('LeaderboardOutput');
        outputElement.style.display = 'none';
        listsContainer.appendChild(outputElement);

        let buttonElement = document.createElement('button');
        buttonElement.className = 'sort-btn button-sml';
        buttonElement.id = 'BestOfGrab'+list_key+'-sort-btn';
        buttonElement.innerText = list_key.replace("curated_", "").replaceAll("_", " ");
        buttonElement.addEventListener('click', () => {
            document.querySelectorAll('.sort-active').forEach(e => {
                e.classList.remove('sort-active');
            });
            buttonElement.classList.add('sort-active');
            document.querySelectorAll('.LeaderboardOutput').forEach(e => {
                e.style.display = 'none';
            });
            outputElement.style.display = 'flex';
        });
        sortingContainer.appendChild(buttonElement);
    });

    list_keys.forEach(key=>{
        const sorted = Object.entries(playerCompletionsByKey[key]).sort((a, b) => {
            if (b[1].maps === a[1].maps) {
                return b[1].score - a[1].score;
            }
            return b[1].maps - a[1].maps;
        });
        const top = sorted.slice(0, 200);
        for (const [id, value] of top) {
            const user_card = userCard(
                id, 
                value.user_name, 
                value.maps == key_lengths[key] ? true : false, 
                false, 
                false, 
                `${value.maps} Maps (${value.score} Pt)`, 
                ''
            );
            user_card.childNodes[1].title = value.firsts;
            let checkUnbeatenButton = document.createElement('button');
            checkUnbeatenButton.innerText = "Check";
            checkUnbeatenButton.classList.add('button-super-sml');
            checkUnbeatenButton.addEventListener('click', () => {
                document.querySelectorAll('.LeaderboardOutput').forEach(e => {
                    e.style.display = 'none';
                });
                let output = document.getElementById('CheckBestOfGrab-out')
                let unbeatenOutput = document.getElementById('CheckBestOfGrabUnbeaten-out')
                let defaultText = document.createElement('p');
                defaultText.innerText = `${value.user_name}'s progress on ${key.replace("curated_", "").replaceAll("_", " ")}`;
                output.innerHTML = '';
                defaultText.classList.add('default-progress-text');
                output.appendChild(defaultText);

                let defaultUnbeatenText = document.createElement('p');
                defaultUnbeatenText.innerText = `${value.user_name}'s unbeaten of ${key.replace("curated_", "").replaceAll("_", " ")}`;
                unbeatenOutput.innerHTML = '';
                defaultUnbeatenText.classList.add('default-progress-text');
                unbeatenOutput.appendChild(defaultUnbeatenText);

                let showUnbeatenButton = document.createElement('button');
                showUnbeatenButton.innerText = "Show unbeaten";
                showUnbeatenButton.classList.add('button-sml');
                showUnbeatenButton.addEventListener('click', () => {
                    output.style.display = 'none';
                    unbeatenOutput.style.display = 'flex';
                });
                defaultText.appendChild(showUnbeatenButton);

                let showAllButton = document.createElement('button');
                showAllButton.innerText = "Show all";
                showAllButton.classList.add('button-sml');
                showAllButton.addEventListener('click', () => {
                    output.style.display = 'flex';
                    unbeatenOutput.style.display = 'none';
                });
                    let unbeatenCount = 0;
                statistics.best_of_grab.forEach(e => {
                    if (e.list_key.includes(key)) {
                        let found = false;
                        let time = 0.0;
                        let position = 0;
                        let suffix = '';
                        eLeaderboard = e.leaderboard;
                        eLeaderboard.forEach( lItem => {
                            if (lItem.user_id == id) {
                                found = true;
                                time = lItem.best_time;
                                position = lItem.position + 1;
                                suffix = getSuffix(lItem.position + 1);
                            }
                        });
                        let level_card = levelCard(
                            e?.identifier,
                            e?.title,
                            e?.creators,
                            e?.images?.thumb?.key,
                            false,
                            '',
                            found ? `${position+suffix} - ${time}s` : 'Unbeaten'
                        );
                        if (!found) {
                            level_card.style.backgroundColor = "#ff000055";
                            let level_card_copy = levelCard(
                                e?.identifier,
                                e?.title,
                                e?.creators,
                                e?.images?.thumb?.key,
                                false,
                                '',
                                ''
                                );
                                level_card_copy.style.backgroundColor = "#ff000055";
                                unbeatenCount++;
                            unbeatenOutput.appendChild(level_card_copy);
                            unbeatenOutput.appendChild(level_card);
                        } else if (position == 1) {
                            level_card.style.backgroundColor = "#d4982955";
                        }
                        output.appendChild(level_card);
                    }
                });
                showUnbeatenButton.innerText = `Show unbeaten (${unbeatenCount})`;
                defaultUnbeatenText.innerText = `${value.user_name}'s unbeaten of ${key.replace("curated_", "").replaceAll("_", " ")} (${unbeatenCount})`;
                defaultUnbeatenText.appendChild(showAllButton);
                output.style.display = 'flex';
            });                
            user_card.insertBefore(checkUnbeatenButton, user_card.childNodes[1]);
            document.getElementById('BestOfGrab'+key+'-out').appendChild(user_card);
        }
    });
    const sorted = Object.entries(playerCompletions).sort((a, b) => {
        if (b[1].maps === a[1].maps) {
            return b[1].score - a[1].score;
        }
        return b[1].maps - a[1].maps;
    });
    const top = sorted.slice(0, 200);
    for (const [id, value] of top) {
        const user_card = userCard(
            id, 
            value.user_name, 
            value.maps == statistics.best_of_grab.length ? true : false, 
            false, 
            false, 
            `${value.maps} Maps (${value.score} Pt)`, 
            ''
        );
        user_card.childNodes[1].title = value.firsts;
        let checkUnbeatenButton = document.createElement('button');
        checkUnbeatenButton.innerText = "Check";
        checkUnbeatenButton.classList.add('button-super-sml');
        checkUnbeatenButton.addEventListener('click', () => {
            document.querySelectorAll('.LeaderboardOutput').forEach(e => {
                e.style.display = 'none';
            });
            let output = document.getElementById('CheckBestOfGrab-out')
            let unbeatenOutput = document.getElementById('CheckBestOfGrabUnbeaten-out')

            let defaultText = document.createElement('p');
            defaultText.innerText = `${value.user_name}'s progress`;
            output.innerHTML = '';
            defaultText.classList.add('default-progress-text');
            output.appendChild(defaultText);

            let defaultUnbeatenText = document.createElement('p');
            defaultUnbeatenText.innerText = `${value.user_name}'s unbeaten`;
            unbeatenOutput.innerHTML = '';
            defaultUnbeatenText.classList.add('default-progress-text');
            unbeatenOutput.appendChild(defaultUnbeatenText);

            let showUnbeatenButton = document.createElement('button');
            showUnbeatenButton.innerText = "Show unbeaten";
            showUnbeatenButton.classList.add('button-sml');
            showUnbeatenButton.addEventListener('click', () => {
                output.style.display = 'none';
                unbeatenOutput.style.display = 'flex';
            });
            defaultText.appendChild(showUnbeatenButton);

            let showAllButton = document.createElement('button');
            showAllButton.innerText = "Show all";
            showAllButton.classList.add('button-sml');
            showAllButton.addEventListener('click', () => {
                output.style.display = 'flex';
                unbeatenOutput.style.display = 'none';
            });
            let unbeatenCount = 0;
            statistics.best_of_grab.forEach(e => {
                let found = false;
                let time = 0.0;
                let position = 0;
                let suffix = '';
                eLeaderboard = e.leaderboard;
                eLeaderboard.forEach( lItem => {
                    if (lItem.user_id == id) {
                        found = true;
                        time = lItem.best_time;
                        position = lItem.position + 1;
                        suffix = getSuffix(lItem.position + 1);
                    }
                });
                let level_card = levelCard(
                    e?.identifier,
                    e?.title,
                    e?.creators,
                    e?.images?.thumb?.key,
                    false,
                    '',
                    found ? `${position+suffix} - ${time}s` : 'Unbeaten'
                    );
                if (!found) {
                    level_card.style.backgroundColor = "#ff000055";
                    let level_card_copy = levelCard(
                        e?.identifier,
                        e?.title,
                        e?.creators,
                        e?.images?.thumb?.key,
                        false,
                        '',
                        ''
                        );
                        level_card_copy.style.backgroundColor = "#ff000055";
                        unbeatenCount++;
                    unbeatenOutput.appendChild(level_card_copy);
                } else if (position == 1) {
                    level_card.style.backgroundColor = "#d4982955";
                }
                output.appendChild(level_card);
            });
            showUnbeatenButton.innerText = `Show unbeaten (${unbeatenCount})`;
            defaultUnbeatenText.innerText = `${value.user_name}'s unbeaten (${unbeatenCount})`;
            defaultUnbeatenText.appendChild(showAllButton);
            output.style.display = 'flex';
        });                
        user_card.insertBefore(checkUnbeatenButton, user_card.childNodes[1]);
        document.getElementById('BestOfGrab-out').appendChild(user_card);
    }
}
function getTipping() {
    let levels_data = statistics.all_verified;
    let statistics_data = statistics.statistics;
    let user_data = {};

    for (const level of levels_data) {
        if (!(level.identifier in statistics_data)) {
            level.tipped_amount = 0;
            continue;
        }
        let user_id = level.identifier.split(":")[0];
        if (!(user_id in user_data)) {
            let creator = "";
            if (level.creators && level.creators.length > 0) {
                creator = level.creators[0];
            }
            user_data[user_id] = {
                user_name: creator,
                tipped_amount: 0
            };
        }
        level_stats = statistics_data[level.identifier];
        user_data[user_id].tipped_amount += level_stats.tipped_amount;
        level.tipped_amount = level_stats.tipped_amount;
    }

    const sorted_levels = levels_data.sort((a, b) => b.tipped_amount - a.tipped_amount).slice(0, 200);
    for (const item of sorted_levels) {
        if (item.tipped_amount > 0) {
            const detail = `${item.tipped_amount}`;
            const level_card = genericLevelCard(item, detail);
            document.getElementById('Tipping-out').appendChild(level_card);
        }
    }

    const sorted_users = Object.keys(user_data).sort((a, b) => user_data[b].tipped_amount - user_data[a].tipped_amount).slice(0, 200);
    for (let user of sorted_users) {
        let item = user_data[user];
        if (item.tipped_amount > 0) {
            const user_card = userCard(
                user,
                item.user_name,
                false, 
                false, 
                false, 
                `${item.tipped_amount}`, 
                ''
            );
            document.getElementById('TippingCreators-out').appendChild(user_card);
        }
    }
}
function getRecords() {
    let lows = 0;
    let totalLow = 0;
    for (let key in statistics.sorted_leaderboard_records) {
        if (statistics.sorted_leaderboard_records.hasOwnProperty(key)) {
            if (statistics.sorted_leaderboard_records[key][0] >= 10) {
                const user_card = userCard(
                    key.split(':')[0], 
                    key.split(':')[1], 
                    false, 
                    false, 
                    false, 
                    `${statistics.sorted_leaderboard_records[key][0]}`, 
                    ''
                );
                document.getElementById('Records-out').appendChild(user_card);
            } else {
                lows += 1;
                totalLow += statistics.sorted_leaderboard_records[key][0];
            }
        }
    }
    document.getElementById('Records-out').innerHTML += `<div class="leaderboard-item"><p>+ ${lows}</p><span>${totalLow}</span></div>`;
}
function getTop100s() {
    const data = Object.entries(statistics.user_finishes).sort((a, b) => {return b[1][0] - a[1][0]}).slice(0, 200);
    for (let [key, value] of data) {
        const user_card = userCard(
            key, 
            value[2], 
            false, 
            false, 
            false, 
            `${value[0]}`, 
            ''
        );
        document.getElementById('Finishes-out').appendChild(user_card);
    }
}
function getEmptyLeaderboards() {
    const data = statistics.empty_leaderboards.sort((a, b) => {return a?.creation_timestamp - b?.creation_timestamp});
    for (const level of data) {
        const detail = `${Math.round((new Date() - new Date(level?.update_timestamp)) / (1000 * 60 * 60 * 24))} days`;
        const level_card = genericLevelCard(level, detail);
        document.getElementById('Empty-out').appendChild(level_card);
    }
}
// unused
function getKeyWords() {
    let keywords = {};
    for (const item of statistics.all_verified) {
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
    }
    const sorted = Object.entries(keywords).sort((a, b) => b[1] - a[1]);
    let top = sorted.slice(0, 100);
    for (let i = 0; i < top.length; i++) {
        document.getElementById('KeyWords-out').innerHTML += `<div class="leaderboard-item"><div>${top[i][0]}</div><span>${top[i][1]}</span></div>`;
    }
}
function getAChallenge() {
    for (const item of statistics.a_challenge) {
        const user_card = userCard(
            item[0], 
            item[1][1], 
            false, 
            false, 
            false, 
            `${item[1][0]} Pt (${item[1][2]} maps)`, 
            ''
        );
        document.getElementById('AChallenge-out').appendChild(user_card);
    }
    
    const sorted = data.sort((a, b) => b[1][2] - a[1][2]);
    for (const item of sorted) {
        const user_card = userCard(
            item[0], 
            item[1][1], 
            false, 
            false, 
            false, 
            `${item[1][2]} Maps`, 
            ''
        );
        document.getElementById('AChallengeMaps-out').appendChild(user_card);
    }
}

// setup
let statistics = {
    all_verified: undefined,
    unbeaten_levels: undefined,
    most_verified: undefined,
    most_played_maps: undefined,
    most_liked: undefined,
    most_disliked: undefined,
    longest_times: undefined,
    sole_victors: undefined,
    most_plays: undefined,
    trending_levels: undefined,
    featured_creators: undefined,
    daily_map: undefined,
    weekly_map: undefined,
    unbeaten_map: undefined,
    map_winners: undefined,
    best_of_grab: undefined,
    statistics: undefined,
    sorted_leaderboard_records: undefined,
    user_finishes: undefined,
    empty_leaderboards: undefined,
    total_level_count: undefined
};

function initStats() {
    let promises = [];

    for (const key in statistics) {
        promises.push(
            fetch(`/stats_data/${key}.json`)
            .then(res => res.json())
            .then(data => statistics[key] = data)
        );
    }
    
    Promise.all(promises).then(() => {

        statistics.sole_victors.reverse();

        getGlobalPlays();
        getTopPlayers();
        getUnbeatenLevels();
        getPlayedLevels();
        getPlaysLevels();
        getTopTimes();
        getTopLikes();
        getTopDislikes();
        getDailyMap();
        getWeeklyMap();
        getUnbeatenMap();
        getChallengeScores();
        getRecords();
        getTrendingLevels();
        getBestOfGrab();
        makeFeaturedButtons();
        getTop100s();
        getEmptyLeaderboards();
        getSoleLevels();
        getTipping();
    });
}
function initButtons() {
    let buttons = document.querySelectorAll('.stats-button');
    buttons.forEach((btn) => {
        let btnId = btn.id;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.LeaderboardOutput, .stats-sorting, #advertisement').forEach(e => {
                e.style.display = 'none';
            });
            document.querySelectorAll('.tab-active').forEach(e => {
                e.classList.remove('tab-active');
            });
            let container = document.getElementById(`${btnId}-out`);
            container.style.display = "flex";
            container.setAttribute('data-forceLoad', true);
            container.querySelectorAll('[data-src]').forEach(e => {
                e.src = e.getAttribute('data-src');
            });
            
            let sorter = document.getElementById(`${btnId}-sort`);
            if (sorter) {
                sorter.style.display = "flex";
            }
            document.querySelectorAll('.sort-active').forEach(e => {
                e.classList.remove('sort-active');
            });
            let sortBtn = document.getElementById(`${btnId}-sort-btn`);
            if (sortBtn) {
                sortBtn.classList.add('sort-active');
            }
            btn.classList.add('tab-active');

            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('tab', btnId);
            window.history.replaceState({}, '', `${location.pathname}?${urlParams}`);
        });
    });
    let sort_buttons = document.querySelectorAll('.sort-btn');
    sort_buttons.forEach((btn) => {
        let btnId = btn.id;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sort-active').forEach(e => {
                e.classList.remove('sort-active');
            });
            btn.classList.add('sort-active');
            document.querySelectorAll('.LeaderboardOutput').forEach(e => {
                e.style.display = 'none';
            });
            let container = document.getElementById(`${btnId.replace('sort-btn', 'out')}`);
            container.style.display = "flex";
            container.setAttribute('data-forceLoad', true);
            container.querySelectorAll('[data-src]').forEach(e => {
                e.src = e.getAttribute('data-src');
            });
        });
    });
}
function initSearch() {
    const submitBtn = document.getElementById("submit-btn");
    const userInput = document.getElementById("user-input");
    userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            submitBtn.click();
        }
    });
    userInput.addEventListener("change", () => {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('userId');
        urlParams.delete('userName');
        window.history.replaceState({}, '', `${location.pathname}?${urlParams}`);
    });
    addEventListener("click", async (e) => {
        if (e.target.id == submitBtn.id) {
            const idInput = document.getElementById("user-input");
            const keyInput = document.getElementById("key-input");
            const output = document.getElementById("LevelSearch-out");
            let user = idInput.value;

            let id = user;

            let options = [];

            if (user && !user.includes(":")) {
                const userDataResponse = await fetch(`https://api.slin.dev/grab/v1/list?type=user_name&search_term=${user}`);
                const userData = await userDataResponse.json();
                if (userData.length > 0) {
                    let foundExact = false;
                    userData.forEach((item) => {
                        if (item.is_creator && userData[0].user_id.toLowerCase() !== item.user_id.toLowerCase()) {
                            options.push(item);
                        }
                        if (!foundExact && item.user_name.toLowerCase() == user.toLowerCase()) {
                            id = item.user_id.toLowerCase();
                            foundExact = true;
                        }
                    });
                    if (!foundExact) {
                        id = userData[0].user_id.toLowerCase();
                    }
                } else {
                    id = null;
                }
            }

            if (user && user.includes(":")) {
                id = user.split(":")[1]
            }
            if (id) {
                let userIDInt = [...id.toString()].reduce((r,v) => r * BigInt(36) + BigInt(parseInt(v,36)), 0n);
                userIDInt >>= BigInt(32);
                userIDInt >>= BigInt(32);
                const joinDate = new Date(Number(userIDInt));
                const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (!localTimeZone) { localTimeZone = "UTC"; }
                const timeString = joinDate.toLocaleString('en-US', { timeZone: localTimeZone });

                const keys = keyInput.value.toLowerCase().split("|");

                let array1 = [];
                if (user !== '' && user !== null) {
                    try {
                        const response1 = await fetch(`https://api.slin.dev/grab/v1/list?max_format_version=100&user_id=${id}`);
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

                document.getElementById('other-user-options').innerText = '';
                if (options && options.length > 0) {
                    document.getElementById('other-user-options').innerText = 'Did you mean?';
                }
                options.forEach(option => {
                    const optionElement = document.createElement('button');
                    optionElement.addEventListener('click', () => {
                        idInput.value = `userId:${option.user_id}`;
                        submitBtn.click();
                    });
                    optionElement.innerText = option.user_name;
                    optionElement.classList.add('button-sml');
                    document.getElementById('other-user-options').appendChild(optionElement);
                });
                document.getElementById('plays-results').innerHTML = `<b>Total plays: ${numberWithCommas(total_plays)}</b>`;
                document.getElementById('okplays-results').innerHTML = `<b>Total verified plays: ${numberWithCommas(total_okplays)}</b>`;
                document.getElementById('maps-results').innerHTML = `<b>Total maps: ${total_maps}</b>`;
                document.getElementById('ok-results').innerHTML = `<b>Total verified maps: ${total_ok}</b>`;
                document.getElementById('likes-results').innerHTML = `<b>Average likes: ${Math.round((average_likes * 100) / likes_count)}%</b>`;
                document.getElementById('difficulty-results').innerHTML = `<b>Average difficulty: ${Math.round(100 - ((average_difficulty * 100) / difficulty_count))}%</b>`;
                document.getElementById('time-results').innerHTML = `<b>Average time: ${Math.round(Math.round(average_time / time_count))}s</b>`;
                document.getElementById('complexity-results').innerHTML = `<b>Total complexity: ${numberWithCommas(total_complexity)}</b>`;
                document.getElementById('join-date').innerHTML = `<b>Join date: ${timeString}</b>`;
            } else {
                output.querySelectorAll('.leaderboard-item').forEach(e => e.remove());
                output.querySelectorAll('span').forEach(e => e.innerText = '');
            }
        }
    });
}
function initLocation() {
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
        let container = document.getElementById(`${tab}-out`);
        container.querySelectorAll('[data-src]').forEach(e => {
            e.src = e.getAttribute('data-src');
        });
        container.setAttribute('data-forceLoad', true);
    }
}

initStats();
initButtons();
initSearch();
initLocation();