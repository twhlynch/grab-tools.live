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
function getFeaturedName(id) {
    for (let featured_creator of statistics.featured_creators || []) {
        if (featured_creator.list_key.split(":")[1] == id) {
            return featured_creator.title;
        }
    }
    return undefined;
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
    const creator = getFeaturedName(identifier) || creators ? creators[0] : '?';
    let daysOld = Math.round((new Date() - new Date(updatedTimestamp)) / (1000 * 60 * 60 * 24));
    const imageUrl = `https://grab-images.slin.dev/${imageThumb}`;

    const cardElement = document.createElement('div');
    cardElement.classList.add('leaderboard-item');
    cardElement.classList.add('leaderboard-item-card');
    verified ? cardElement.classList.add('levelItemOk') : null;
    if (session.isLoggedIn && identifier.split(":")[0] == session.user_id) {
        cardElement.classList.add('card-personal');
    }

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
    cardElement.classList.add('user-card');
    isVerified ? cardElement.classList.add('levelItemOk') : null;
    isModerator ? cardElement.classList.add('levelItemModerator') : null;
    isAdministrator ? cardElement.classList.add('levelItemAdministrator') : null;
    if (session.isLoggedIn && identifier == session.user_id) {
        cardElement.classList.add('card-personal');
    }
    username = getFeaturedName(identifier) || username;

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
    const sortedByUpdated = [...statistics.unbeaten_levels].sort((a, b) => a.update_timestamp - b.update_timestamp);
    const sortedByCreated = [...statistics.unbeaten_levels].sort((a, b) => a.creation_timestamp - b.creation_timestamp);
    let unbeatenCreators = {};

    for (const item of statistics.unbeaten_levels) {
        const detail = `${Math.round((new Date() - new Date(item?.update_timestamp)) / (1000 * 60 * 60 * 24))} days`;
        const level_card = genericLevelCard(item, detail);
        if ("sole" in item) { level_card.style.borderColor = "#ff000055"; }
        document.getElementById('UnbeatenMaps-out').appendChild(level_card);
        checkNotification(item.identifier, "UnbeatenMaps");
        const user_identifier = item.identifier.split(':')[0];
        const level_age = new Date() - new Date(item?.creation_timestamp);
        if (user_identifier in unbeatenCreators) {
            unbeatenCreators[user_identifier].score += 1;
            unbeatenCreators[user_identifier].creator = item.creators ? item.creators[0].split(' ')[0] : unbeatenCreators[user_identifier].creator;
            unbeatenCreators[user_identifier].age += level_age;
        } else {
            unbeatenCreators[user_identifier] = {
                score: 1,
                creator: item.creators ? item.creators[0].split(' ')[0] : '?',
                age: level_age
            }
        }
    }

    // sort by score then age
    unbeatenCreators = Object.fromEntries(Object.entries(unbeatenCreators).sort((a, b) => {
        if (a[1].score == b[1].score) {
            return b[1].age - a[1].age;
        } else {
            return b[1].score - a[1].score;
        }
    }));
    for (const key in unbeatenCreators) {
        const user_card = userCard(
            key, 
            unbeatenCreators[key].creator, 
            false, 
            false, 
            false, 
            `${unbeatenCreators[key].score} maps`, 
            ''
        );
        document.getElementById('UnbeatenCreators-out').appendChild(user_card);
        checkNotification(key, "UnbeatenCreators");
    }
    
    for (const item of sortedByUpdated) {
        const detail = `${Math.round((new Date() - new Date(item?.update_timestamp)) / (1000 * 60 * 60 * 24))} days`;
        const level_card = genericLevelCard(item, detail);
        if (!("sole" in item)) {
            document.getElementById('UnbeatenMapsUpdated-out').appendChild(level_card);
            checkNotification(item.identifier, "UnbeatenMapsUpdated");
        }
    }

    for (const item of sortedByCreated) {
        const detail = `${Math.round((new Date() - new Date(item?.creation_timestamp)) / (1000 * 60 * 60 * 24))} days`;
        const level_card = genericLevelCard(item, detail);
        if (!("sole" in item)) {
            document.getElementById('UnbeatenMapsCreated-out').appendChild(level_card);
            checkNotification(item.identifier, "UnbeatenMapsCreated");
        }
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
        checkNotification(key, "MostVerifiedMaps");
    }
}
function getPlayedLevels() {
    for (const item of statistics.most_played_maps) {
        const detail = `${numberWithCommas(item?.statistics?.total_played)} plays`;
        const level_card = genericLevelCard(item, detail, timestamp=item?.update_timestamp);
        document.getElementById('MostPlayedMaps-out').appendChild(level_card);
        checkNotification(item.identifier, "MostPlayedMaps");
    }
}
function getTopLikes() {
    for (const item of statistics.most_liked) {
        const detail = `${numberWithCommas(Math.round(item?.statistics?.liked * item?.statistics?.total_played * item?.statistics?.difficulty))} (${Math.round(100 * item?.statistics?.liked)}%)`;
        const level_card = genericLevelCard(item, detail);
        document.getElementById('MostLikedMaps-out').appendChild(level_card);
        checkNotification(item.identifier, "MostLikedMaps");
    }
}
function getTopDislikes() {
    for (const item of statistics.most_disliked) {
        const detail = `${numberWithCommas(Math.round((numberWithCommas(1 - item?.statistics?.liked) * item?.statistics?.total_played * item?.statistics?.difficulty)))} (${Math.round(100 - (100 * item?.statistics?.liked))}%)`;
        const level_card = genericLevelCard(item, detail);
        document.getElementById('MostDislikedMaps-out').appendChild(level_card);
        checkNotification(item.identifier, "MostDislikedMaps");
    }
}
function getTopTimes() {
    for (const item of statistics.longest_times) {
        const detail = `${Math.round(item?.statistics?.time)}s`;
        const level_card = genericLevelCard(item, detail);
        document.getElementById('MostTimeMaps-out').appendChild(level_card);
        checkNotification(item.identifier, "MostTimeMaps");
    }
}
function getSoleLevels() {
    let users = {};
    for (const item of statistics.sole_victors) {
        const detail = `${Math.round((new Date() - new Date(item?.update_timestamp)) / (1000 * 60 * 60 * 24))} days`;
        const level_card = genericLevelCard(item, detail);
        document.getElementById('SoleBeatenMaps-out').appendChild(level_card);
        checkNotification(item.identifier, "SoleBeatenMaps");

        let first_identifier = item.leaderboard[0].user_id;
        let first_name = item.leaderboard[0].user_name;
        if (first_identifier in users) {
            users[first_identifier].score += 1;
        } else {
            users[first_identifier] = {
                score: 1,
                user: first_name
            }
        }
    }

    users = Object.fromEntries(Object.entries(users).sort((a, b) => b[1].score - a[1].score));
    for (const key in users) {
        const user_card = userCard(
            key, 
            users[key].user, 
            false, 
            false, 
            false, 
            `${users[key].score} maps`, 
            ''
        );
        document.getElementById('SoleBeaters-out').appendChild(user_card);
        checkNotification(key, "SoleBeaters");
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
            `${numberWithCommas(value["plays"])} (${value["count"]} maps)`, 
            `+${value["change"]}`
        );
        document.getElementById('MostPlays-out').appendChild(user_card);
        checkNotification(key, "MostPlays");
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
        checkNotification(id, "TodaysPlays");
    }
}
function getTrendingLevels() {
    for (const item of statistics.trending_levels) {
        if (item.identifier != "2ap647di3dc1k42jf4o2o:1682810607" && item.identifier != "29t798uon2urbra1f8w2q:1693775768") {
            const detail = `${item?.change} plays`;
            const level_card = genericLevelCard(item, detail, timestamp=item?.creation_timestamp);
            document.getElementById('Trending-out').appendChild(level_card);
            checkNotification(item.identifier, "Trending");
        }
    }

    for (const item of statistics.weekly_trending_levels) {
        const detail = `${item.statistics.total_played} plays`;
        const level_card = genericLevelCard(item, detail, timestamp=item?.creation_timestamp);
        if (item.identifier != "2ap647di3dc1k42jf4o2o:1682810607" && item.identifier != "29t798uon2urbra1f8w2q:1693775768") {
            document.getElementById('WeeklyPlays-out').appendChild(level_card);
            checkNotification(item.identifier, "WeeklyPlays");
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
    const output = document.getElementById('DailyMap-out');
    output.innerHTML += `<h1><a target="_blank" href="https://grabvr.quest/levels/viewer/?level=${statistics.daily_map["identifier"]}">${statistics.daily_map["title"]}</a><br>by <span title="${statistics.daily_map["creators"]}">${(statistics.daily_map.creators || [""])[0]}</span></h1>`;
    
    let loadingElement = document.createElement('span');
    loadingElement.innerText = "Loading leaderboard...";
    output.appendChild(loadingElement);

    let loadedDaily = false;

    function loadDailyLeaderboard() {
        if (loadedDaily) {
            return;
        }
    
        fetch(`https://api.slin.dev/grab/v1/statistics_top_leaderboard/${statistics.daily_map['identifier'].replace(':', '/')}`)
        .then((response2) => response2.json())
        .then(leaderboard => {
            output.removeChild(loadingElement);
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
                output.appendChild(user_card);
                checkNotification(lItem["user_id"], "DailyMap");
                loadedDaily = true;
            });
        });
    }

    document.getElementById('DailyMap').addEventListener('click', loadDailyLeaderboard);
    if (document.getElementById('DailyMap-sort-btn').classList.contains('sort-active')) {
        loadDailyLeaderboard();
    }
}
function getWeeklyMap() {
    const output = document.getElementById('WeeklyMap-out');
    output.innerHTML += `<h1><a target="_blank" href="https://grabvr.quest/levels/viewer/?level=${statistics.weekly_map["identifier"]}">${statistics.weekly_map["title"]}</a><br>by <span title="${statistics.weekly_map["creators"]}">${(statistics.weekly_map.creators || [""])[0]}</span></h1>`;

    let loadingElement = document.createElement('span');
    loadingElement.innerText = "Loading leaderboard...";
    output.appendChild(loadingElement);

    let loadedWeekly = false;

    function loadWeeklyLeaderboard() {
        if (loadedWeekly) {
            return;
        }

        fetch(`https://api.slin.dev/grab/v1/statistics_top_leaderboard/${statistics.weekly_map['identifier'].replace(':', '/')}`)
        .then((response2) => response2.json())
        .then(leaderboard => {
            output.removeChild(loadingElement);
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
                output.appendChild(user_card);
                checkNotification(lItem["user_id"], "WeeklyMap");
                loadedWeekly = true;
            });
        });
    }

    document.getElementById('WeeklyMap-sort-btn').addEventListener('click', loadWeeklyLeaderboard);
}
function getUnbeatenMap() {
    const output = document.getElementById('UnbeatenMap-out');
    output.innerHTML += `<h1><a target="_blank" href="https://grabvr.quest/levels/viewer/?level=${statistics.unbeaten_map["identifier"]}">${statistics.unbeaten_map["title"]}</a><br>by <span title="${statistics.unbeaten_map["creators"]}">${(statistics.unbeaten_map.creators || [""])[0]}</span></h1>`;

    let loadingElement = document.createElement('span');
    loadingElement.innerText = "Loading leaderboard...";
    output.appendChild(loadingElement);

    let loadedUnbeaten = false;

    function loadUnbeatenLeaderboard() {
        if (loadedUnbeaten) {
            return;
        }

        fetch(`https://api.slin.dev/grab/v1/statistics_top_leaderboard/${statistics.unbeaten_map['identifier'].replaceAll(':', '/')}`)
        .then((response2) => response2.json())
        .then(leaderboard => {
            output.removeChild(loadingElement);
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
                output.appendChild(user_card);
                checkNotification(lItem["user_id"], "UnbeatenMap");
                loadedUnbeaten = true;
            });
        });
    }

    document.getElementById('UnbeatenMap-sort-btn').addEventListener('click', loadUnbeatenLeaderboard);
}
function getChallengeScores() {
    const current_version = statistics.challenge_scores.current_version;
    const leaderboard = statistics.challenge_scores[`v${current_version}`];
    for (const value of leaderboard) {
        const user_card = userCard(
            value.user_id, 
            value.user_name, 
            false, 
            false, 
            false, 
            `${value.score} Pt`, 
            ''
        );
        document.getElementById('MapChallenges-out').appendChild(user_card);
        checkNotification(value.user_id, "MapChallenges");
    }
    if (leaderboard.length == 0) {
        document.getElementById('MapChallenges-out').innerHTML += "<br/><br/><center>Reset was today! No scores yet.</center>";
    }
    for (i = 1; i < current_version; i++) {
        const sortButton = document.createElement("button");
        sortButton.innerText = `v${i}`;
        sortButton.classList.add('sort-btn', 'button-sml');
        sortButton.id = `MapChallengesV${i}-sort-btn`;
        sortButton.addEventListener("click", () => {
            buttonEvent(sortButton);
        });
        document.getElementById('DailyMap-sort').appendChild(sortButton);

        const output = document.createElement("div");
        output.classList.add("LeaderboardOutput");
        output.id = `MapChallengesV${i}-out`;
        document.getElementById('statistics').appendChild(output);

        for (const value of statistics.challenge_scores[`v${i}`]) {
            const user_card = userCard(
                value.user_id, 
                value.user_name, 
                false, 
                false, 
                false, 
                `${value.score} Pt`, 
                ''
            );
            document.getElementById(`MapChallengesV${i}-out`).appendChild(user_card);
            checkNotification(value.user_id, `MapChallengesV${i}`);
        }
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
        globalData.iterations += level.iteration || 1;
    }
    globalData.average_difficulty /= globalData.verified_maps;
    globalData.average_likes /= globalData.verified_maps;
    globalData.average_time /= globalData.verified_maps;
    globalData.average_plays = globalData.plays / globalData.verified_maps;
    globalData.average_complexity = globalData.complexity / globalData.verified_maps;

    // document.getElementById('counter').innerHTML = `<b>Total global plays: ${numberWithCommas(globalData.plays)}</b>`;
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
    let playerFeatures = {};
    let playerCompletions = {};
    let playerCompletionsByKey = {};

    // filling data structures
    for (const item of statistics.best_of_grab) {
        item.list_key.split(":").forEach( key => {
            if (list_keys.indexOf(key) == -1) {
                list_keys.push(key);
                playerCompletionsByKey[key] = {};
            }
            if (key_lengths[key]) {
                key_lengths[key] += 1;
            } else {
                key_lengths[key] = 1;
            }
        } );
    }

    for (const item of statistics.best_of_grab) {
        const userId = item.identifier.split(':')[0];
        if (!(userId in playerFeatures)) {
            playerFeatures[userId] = {score: 0, user_name: ''};
        }
        playerFeatures[userId].score += 1;
        if (!playerFeatures[userId].user_name || playerFeatures[userId].user_name === 'undefined') {
            playerFeatures[userId].user_name = (""+item?.creators).split(',')[0];
        }

        let creatorFinished = false;
        for (const lItem of item.leaderboard) {
            if (lItem.user_id == userId) {
                creatorFinished = true;
            }
            let score = determineScore(lItem, item.leaderboard.length);
            
            if (!(lItem.user_id in playerCompletions)) {
                playerCompletions[lItem.user_id] = {
                    user_name: lItem.user_name,
                    maps: 0,
                    firsts: 0,
                    score: 0
                }
            }
            playerCompletions[lItem.user_id].maps += 1;
            playerCompletions[lItem.user_id].score += score;
            if (lItem.position == 0) {
                playerCompletions[lItem.user_id].firsts += 1;
            }

            for (const lKey of item.list_key.split(":")) {
                if (!(lItem.user_id in playerCompletionsByKey[lKey])) {
                    playerCompletionsByKey[lKey][lItem.user_id] = {
                        user_name: lItem.user_name,
                        firsts: 0,
                        maps: 0,
                        score: 0
                    }
                }
                playerCompletionsByKey[lKey][lItem.user_id].maps += 1;
                playerCompletionsByKey[lKey][lItem.user_id].score += score;
                if (lItem.position == 0) {
                    playerCompletionsByKey[lKey][lItem.user_id].firsts += 1;
                }
            }
        }
        if (!creatorFinished) {
            if (!(userId in playerCompletions)) {
                playerCompletions[userId] = {
                    user_name: (""+item?.creators).split(',')[0],
                    maps: 0,
                    firsts: 0,
                    score: 0
                }
            }
            playerCompletions[userId].maps += 1;

            for (const lKey of item.list_key.split(":")) {
                if (!(userId in playerCompletionsByKey[lKey])) {
                    playerCompletionsByKey[lKey][userId] = {
                        user_name: (""+item?.creators).split(',')[0],
                        firsts: 0,
                        maps: 0,
                        score: 0
                    }
                }
                playerCompletionsByKey[lKey][userId].maps += 1;
            }
        }
    }

    playerFeatures = Object.entries(playerFeatures).sort((a, b) => b[1].score - a[1].score);
    for (const item of playerFeatures) {
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
        checkNotification(item[0], "Featured");
    }

    let sortingContainer = document.getElementById('BestOfGrab-sort');
    let listsContainer = document.getElementById('statistics');
    for (const list_key of list_keys) {
        let outputElement = document.createElement('div');
        outputElement.id = 'BestOfGrab'+list_key+'-out';
        outputElement.classList.add('LeaderboardOutput');
        outputElement.style.display = 'none';
        listsContainer.appendChild(outputElement);

        let buttonElement = document.createElement('button');
        buttonElement.className = 'sort-btn button-sml';
        buttonElement.id = 'BestOfGrab'+list_key+'-sort-btn';
        let innerText = list_key.replace("curated_", "").replaceAll("_", " ").toLowerCase();
        switch (innerText) {
            case "sadpillows break in":
                innerText = "break in";
                break;

            case "jeffbobdude evade genesis":
                innerText = "evade genesis";
                break;

            case "yoohoo difficulty charts":
                innerText = "difficulty charts";
                break;

            case "grab adventure 1":
                innerText = "grab adventure";
                break;

            default:
                break;
        }
        innerText = innerText.charAt(0).toUpperCase() + innerText.slice(1);
        buttonElement.innerText = innerText;
        buttonElement.addEventListener('click', () => {
            buttonEvent(buttonElement);
        });
        sortingContainer.appendChild(buttonElement);
    }

    for (const key of list_keys) {
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
                let innerText = key.replace("curated_", "").replaceAll("_", " ").toLowerCase();
                switch (innerText) {
                    case "sadpillows break in":
                        innerText = "break in";
                        break;

                    case "jeffbobdude evade genesis":
                        innerText = "evade genesis";
                        break;

                    case "yoohoo difficulty charts":
                        innerText = "difficulty charts";
                        break;

                    case "grab adventure 1":
                        innerText = "grab adventure";
                        break;

                    default:
                        break;
                }
                innerText = innerText.charAt(0).toUpperCase() + innerText.slice(1);
                defaultText.innerText = `${value.user_name}'s progress on ${innerText}`;
                output.innerHTML = '';
                defaultText.classList.add('default-progress-text');
                output.appendChild(defaultText);

                let defaultUnbeatenText = document.createElement('p');
                defaultUnbeatenText.innerText = `${value.user_name}'s unbeaten of ${innerText}`;
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
                if (unbeatenCount == 0) {
                    showUnbeatenButton.style.display = 'none';
                }
                defaultUnbeatenText.innerText = `${value.user_name}'s unbeaten of ${innerText} (${unbeatenCount})`;
                defaultUnbeatenText.appendChild(showAllButton);
                output.style.display = 'flex';
            });                
            user_card.insertBefore(checkUnbeatenButton, user_card.childNodes[1]);
            document.getElementById('BestOfGrab'+key+'-out').appendChild(user_card);
        }
    }
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

    const sorted_levels = levels_data.sort((a, b) => (b.tipped_amount || 0) - (a.tipped_amount || 0)).slice(0, 200);
    for (const item of sorted_levels) {
        if (item.tipped_amount > 0) {
            const detail = `${item.tipped_amount}`;
            const level_card = genericLevelCard(item, detail);
            document.getElementById('Tipping-out').appendChild(level_card);
            checkNotification(item.identifier, "Tipping");
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
            checkNotification(user, "TippingCreators");
        }
    }
}
function getRecords() {
    let lows = 0;
    let totalLow = 0;
    for (let key in statistics.sorted_leaderboard_records) {
        if (statistics.sorted_leaderboard_records[key][0] >= 10) {
            const user_card = userCard(
                key, 
                statistics.sorted_leaderboard_records[key][2], 
                false, 
                false, 
                false, 
                `${statistics.sorted_leaderboard_records[key][0]}`, 
                ''
            );
            document.getElementById('Records-out').appendChild(user_card);
            checkNotification(key, "Records");
        } else {
            lows += 1;
            totalLow += statistics.sorted_leaderboard_records[key][0];
        }
    }
    document.getElementById('Records-out').innerHTML += `<div class="leaderboard-item"><p>+ ${lows}</p><span>${totalLow}</span></div>`;
}
function getTop100s() {
    const data = Object.entries(statistics.user_finishes).sort((a, b) => {return b[1][0] - a[1][0]}).slice(0, 200);
    for (let [key, value] of data) {
        const user_card = userCard(
            key, 
            value[1], 
            false, 
            false, 
            false, 
            `${value[0]}`, 
            ''
        );
        document.getElementById('Finishes-out').appendChild(user_card);
        checkNotification(key, "Finishes");
    }
    // time spent in total
    const sorted_by_time = Object.entries(statistics.user_finishes).sort((a, b) => {return b[1][2] - a[1][2]}).slice(0, 200);
    for (let [key, value] of sorted_by_time) {
        let minutes = Math.floor(value[2] / 60);
        let seconds = (value[2] % 60).toFixed(2);
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }
        const user_card = userCard(
            key, 
            value[1], 
            false, 
            false, 
            false, 
            `${minutes}:${seconds}`, 
            ''
        );
        document.getElementById('TimeTotal-out').appendChild(user_card);
        checkNotification(key, "TimeTotal");
    }
}
function getFirstToBeats() {
    let sorted_ftb = Object.fromEntries(Object.entries(statistics.first_to_beat).sort((a, b) => {return b[1][1] - a[1][1]}));
    for (let key in sorted_ftb) {
        let value = sorted_ftb[key];
        const user_card = userCard(
            key, 
            value[0], 
            false, 
            false, 
            false, 
            `${value[1]}`, 
            ''
        );
        document.getElementById('FirstToBeat-out').appendChild(user_card);
        checkNotification(key, "FirstToBeat");
    }
}
function getEmptyLeaderboards() {
    const data = statistics.empty_leaderboards.sort((a, b) => {return a?.creation_timestamp - b?.creation_timestamp});
    for (const level of data) {
        const detail = `${Math.round((new Date() - new Date(level?.update_timestamp)) / (1000 * 60 * 60 * 24))} days`;
        const level_card = genericLevelCard(level, detail);
        document.getElementById('Empty-out').appendChild(level_card);
        checkNotification(level.identifier, "Empty");
    }
}
function getPersonalStats() {
    if (!session.isLoggedIn) {
        return;
    }
    const personalButton = document.getElementById('PersonalStats');
    personalButton.style.display = 'flex';

    const output = document.getElementById('PersonalStats-out');

    let user_maps = 0;
    let user_maps_today = 0;
    let user_plays = 0;
    let user_plays_today = 0;
    let user_records = 0;
    let user_finishes = 0;
    let user_features = 0;

    for (const key in statistics.most_verified) {
        if (key == user_id) {
            const value = statistics.most_verified[key];
            user_maps += value.count;
            user_maps_today += value.change;
        }
    }

    for (const key in statistics.most_plays) {
        if (key == user_id) {
            const value = statistics.most_plays[key];
            user_plays += value.plays;
            user_plays_today += value.change;
        }
    }

    for (const key in statistics.sorted_leaderboard_records) {
        if (key == user_id) {
            const value = statistics.sorted_leaderboard_records[key];
            user_records += value[0];
        }
    }

    for (const key in statistics.user_finishes) {
        if (key == user_id) {
            const value = statistics.user_finishes[key];
            user_finishes += value[0];
        }
    }

    for (const item of statistics.best_of_grab) {
        if (item.identifier.split(":")[0] == user_id) {
            user_features += 1;
        }
    }

    const plays_card = userCard(
        user_id, 
        "Plays", 
        false, 
        false,
        false,
        `${numberWithCommas(user_plays)} plays`,
        ` + ${numberWithCommas(user_plays_today)}`
    );

    const maps_card = userCard(
        user_id, 
        "Maps", 
        false, 
        false,
        false,
        `${user_maps} verified maps`,
        ` + ${user_maps_today}`
    );

    const records_card = userCard(
        user_id, 
        "Records", 
        false, 
        false,
        false,
        `${user_records} records`,
        ''
    );

    const finishes_card = userCard(
        user_id, 
        "Finishes", 
        false, 
        false,
        false,
        `${user_finishes} finishes`,
        ''
    );

    const features_card = userCard(
        user_id, 
        "Features", 
        false, 
        false,
        false,
        `${user_features} featured maps`,
        ''
    );

    output.appendChild(plays_card);
    output.appendChild(maps_card);
    output.appendChild(records_card);
    output.appendChild(finishes_card);
    output.appendChild(features_card);

    const trendingHeader = document.createElement('h2');
    trendingHeader.innerText = 'Trending';
    trendingHeader.style.display = 'none';
    output.appendChild(trendingHeader);

    for (const item of statistics.trending_levels) {
        if (item.identifier.split(':')[0] == user_id) {
            const detail = `${item?.change} plays`;
            const level_card = genericLevelCard(item, detail);
            output.appendChild(level_card);
            trendingHeader.style.display = 'block';
        }
    }

    const unbeatenHeader = document.createElement('h2');
    unbeatenHeader.innerText = 'Unbeaten';
    unbeatenHeader.style.display = 'none';
    output.appendChild(unbeatenHeader);

    for (const item of statistics.unbeaten_levels) {
        if (item.identifier.split(':')[0] == user_id && !("sole" in item)) {
            const detail = `${Math.round((new Date() - new Date(item?.update_timestamp)) / (1000 * 60 * 60 * 24))} days`;
            const level_card = genericLevelCard(item, detail);
            output.appendChild(level_card);
            unbeatenHeader.style.display = 'block';
        }
    }

    const playedHeader = document.createElement('h2');
    playedHeader.innerText = 'Plays';
    playedHeader.style.display = 'none';
    output.appendChild(playedHeader);

    for (const item of statistics.most_played_maps) {
        if (item.identifier.split(':')[0] == user_id) {
            const detail = `${numberWithCommas(item?.statistics?.total_played)} plays`;
            const level_card = genericLevelCard(item, detail);
            output.appendChild(level_card);
            playedHeader.style.display = 'block';
        }
    }

    const longestHeader = document.createElement('h2');
    longestHeader.innerText = 'Longest';
    longestHeader.style.display = 'none';
    output.appendChild(longestHeader);

    for (const item of statistics.longest_times) {
        if (item.identifier.split(':')[0] == user_id) {
            const detail = `${Math.round(item?.statistics?.time)}s`;
            const level_card = genericLevelCard(item, detail);
            output.appendChild(level_card);
            longestHeader.style.display = 'block';
        }
    }

    const featuredHeader = document.createElement('h2');
    featuredHeader.innerText = 'Featured';
    featuredHeader.style.display = 'none';
    output.appendChild(featuredHeader);

    for (const item of statistics.best_of_grab) {
        if (item.identifier.split(':')[0] == user_id) {
            const detail = item?.list_key.split(":").join("\n").replace("curated_", "").replaceAll("_", " ").toLowerCase();
            const level_card = genericLevelCard(item, detail);
            output.appendChild(level_card);
            featuredHeader.style.display = 'block';
        }
    }
}
function getDifficulties() {
    let difficulty_keys = [
        // "unrated",
        "easy",
        "medium",
        "hard",
        "veryhard"
        // "impossible"
    ];
    const key_lengths = statistics.difficulty_lengths;
    let playerCompletions = {};
    let playerCompletionsByKey = statistics.difficulty_records;

    for (const key in playerCompletionsByKey) {
        for (const id in playerCompletionsByKey[key]) {
            if (!(id in playerCompletions)) {
                playerCompletions[id] = {
                    user_name: playerCompletionsByKey[key][id].user_name,
                    maps: 0,
                    firsts: 0
                }
            }
            playerCompletions[id].maps += playerCompletionsByKey[key][id].maps;
            playerCompletions[id].firsts += playerCompletionsByKey[key][id].firsts;
        }
    }

    let sortingContainer = document.getElementById('Difficulties-sort');
    let listsContainer = document.getElementById('statistics');
    for (const key of difficulty_keys) {
        let outputElement = document.createElement('div');
        outputElement.id = 'Difficulties'+key+'-out';
        outputElement.classList.add('LeaderboardOutput');
        outputElement.classList.add('Difficulties-out');
        outputElement.style.display = 'none';
        listsContainer.appendChild(outputElement);

        let avg_time = 0;
        let times = 0;
        for (const item of statistics.all_verified) {
            if (item?.statistics?.difficulty_string == key && item?.statistics?.time) {
                avg_time += item.statistics.time;
                times += 1;
            }
        }
        avg_time = avg_time / times;

        let titleElement = document.createElement('h2');
        titleElement.innerText = key_lengths[key] + " " + key + " levels" + " - avg " + Math.round(avg_time) + "s";
        outputElement.appendChild(titleElement);

        let buttonElement = document.createElement('button');
        buttonElement.className = 'sort-btn button-sml';
        buttonElement.id = 'Difficulties'+key+'-sort-btn';
        buttonElement.innerText = key;
        buttonElement.addEventListener('click', () => {
            buttonEvent(buttonElement);
        });
        sortingContainer.appendChild(buttonElement);
    }

    for (const key of difficulty_keys) {
        const sorted = Object.entries(playerCompletionsByKey[key]).sort((a, b) => {
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
                `${value.maps} Completed`, 
                ''
            );
            user_card.childNodes[1].title = value.firsts;
            document.getElementById('Difficulties'+key+'-out').appendChild(user_card);
        }
    }

    let avg_time = 0;
    let times = 0;
    for (const item of statistics.all_verified) {
        if (item?.statistics?.time) {
            avg_time += item.statistics.time;
            times += 1;
        }
    }
    avg_time = avg_time / times;

    let titleElement = document.createElement('h2');
    titleElement.innerText = key_lengths.total + " levels" + " - avg " + Math.round(avg_time) + "s";
    document.getElementById('Difficulties-out').appendChild(titleElement);

    const sorted = Object.entries(playerCompletions).sort((a, b) => {
        return b[1].maps - a[1].maps;
    });
    const top = sorted.slice(0, 200);
    for (const [id, value] of top) {
        const user_card = userCard(
            id, 
            value.user_name, 
            value.maps == key_lengths.total ? true : false, 
            false, 
            false, 
            `${value.maps} Completed`, 
            ''
        );
        user_card.childNodes[1].title = value.firsts;
        document.getElementById('Difficulties-out').appendChild(user_card);
    }
}

function showListCounts() {
    const allLeaderboards = document.getElementsByClassName("LeaderboardOutput");
    for (let i = 0; i < allLeaderboards.length; i++) {
        const leaderboard = allLeaderboards[i];
        const id = leaderboard.id;
        const count = leaderboard.getElementsByClassName("leaderboard-item").length;
        if ([
            "PersonalStats-out",
            "Global-out",
            "LevelSearch-out",
            "DailyMap-out",
            "WeeklyMap-out",
            "UnbeatenMap-out"
        ].includes(id) || count == 0) {
            continue;
        }
        const countElement = document.createElement("span");
        countElement.innerText = `(${count} shown)`;
        countElement.classList.add("leaderboard-count");
        leaderboard.appendChild(countElement);
    }
}

function checkNotification(item_id, element_id) {
    if (!isLoggedIn) {
        return;
    }
    if (item_id.indexOf(":") !== -1) {
        item_id = item_id.split(":")[0];
    }
    if (item_id == user_id) {
        const button = document.getElementById(element_id);
        const sortButton = document.getElementById(element_id + "-sort-btn");
        if (button) {
            button.classList.add('notify');
        } else if (sortButton) {
            const mainButton = document.getElementById(sortButton.parentElement.id.replace("-sort-btn", ""));
            if (mainButton) {
                mainButton.classList.add('notify');
            }
        }
        if (sortButton) {
            sortButton.classList.add('notify');
        }
    }
}

// setup
const session = {
    user_name: localStorage.getItem('user_name'),
    user_id: localStorage.getItem('user_id'),
    isLoggedIn: false
};
session.isLoggedIn = (session.user_name && session.user_id);

document.addEventListener('logout', () => {
    session.isLoggedIn = false;
    session.user_name = null;
    session.user_id = null;
    document.getElementById("PersonalStats-out").innerHTML = "";
    document.getElementById("PersonalStats").style.display = "none";
    document.querySelectorAll('.notify').forEach(e => {
        e.classList.remove('notify');
    });
    document.querySelectorAll('.card-personal').forEach(e => {
        e.classList.remove('card-personal');
    });
});

document.addEventListener('login', (e) => {
    session.isLoggedIn = true;
    session.user_name = e.detail.user_name;
    session.user_id = e.detail.user_id;
    document.querySelectorAll('.LeaderboardOutput').forEach(e => {
        if (e.id == "LevelSearch-out") {
            document.getElementById("other-user-options").innerHTML = "";
        } else {
            e.innerHTML = "";
        }
    });
    document.getElementById("BestOfGrab-sort").innerHTML = "";
    document.getElementById("Difficulties-sort").innerHTML = "";
    computeStats();
});

let statistics = {
    all_verified: undefined,
    unbeaten_levels: undefined,
    most_verified: undefined,
    sole_victors: undefined,
    most_plays: undefined,
    featured_creators: undefined,
    challenge_scores: undefined,
    best_of_grab: undefined,
    statistics: undefined,
    sorted_leaderboard_records: undefined,
    user_finishes: undefined,
    empty_leaderboards: undefined,
    total_level_count: undefined,
    difficulty_records: undefined,
    difficulty_lengths: undefined,
    first_to_beat: undefined,
    daily: undefined
};

let loading = 0;
let stat_count = 0;
function incrementLoader() {
    loading += 1;
    const progress = (loading / stat_count) * 100;
    document.getElementById('loader').style.width = `${progress}%`;
}
function initStats() {
    const updateTime = 5;
    const now = Date.now();
    const currentDate = new Date(now);
    const daysSinceEpoch = Math.floor(now / (24 * 60 * 60 * 1000));
    const currentHours = currentDate.getUTCHours();
    const currentMinutes = currentDate.getUTCMinutes();
    const isPast = (currentHours > updateTime) || (currentHours === updateTime && currentMinutes > 0);
    const cacheInterval = isPast ? daysSinceEpoch + 1 : daysSinceEpoch;
        
    let promises = [];

    for (const key in statistics) {
        stat_count++;
        promises.push(
            fetch(`/stats_data/${key}.json?cache=${cacheInterval}`)
            .then(res => res.json())
            .then(data => {
                statistics[key] = data;
                incrementLoader();
            })
        );
    }
    
    Promise.all(promises).then(() => {
        document.getElementById('loader-container').classList.add('loaded');
        computeStats();
    });
}
function computeStats() {
    statistics.sole_victors.reverse();

    statistics.most_played_maps = [...statistics.all_verified].sort((a, b) => b.statistics.total_played - a.statistics.total_played).slice(0, 200);
    statistics.longest_times = [...statistics.all_verified].sort((a, b) => b.statistics.time - a.statistics.time).slice(0, 200);

    statistics.most_liked = [...statistics.all_verified]
    .sort((a, b) => (b.statistics.liked * b.statistics.difficulty * b.statistics.total_played) - (a.statistics.liked * a.statistics.difficulty * a.statistics.total_played))
    .filter(map => map.statistics.total_played > 2000 && map.statistics.total_played * map.statistics.difficulty > 10)
    .slice(0, 200);

    statistics.most_disliked = [...statistics.all_verified]
    .sort((a, b) => (1 - b.statistics.liked) * b.statistics.difficulty * b.statistics.total_played - (1 - a.statistics.liked) * a.statistics.difficulty * a.statistics.total_played)
    .filter(map => map.statistics.total_played > 2000 && (map.statistics.total_played * map.statistics.difficulty) > 10)
    .slice(0, 200);

    statistics.trending_levels = [...statistics.all_verified]
    .sort((a, b) => b.change - a.change)
    .slice(0, 200);
    
    statistics.weekly_trending_levels = [...statistics.all_verified]
    .sort((a, b) => (b.statistics.total_played - a.statistics.total_played))
    .filter(map => (new Date() - new Date(map.creation_timestamp)) < 7 * 24 * 60 * 60 * 1000)
    .slice(0, 200);

    statistics.daily_map = statistics.daily.daily;
    statistics.weekly_map = statistics.daily.weekly;
    statistics.unbeaten_map = statistics.daily.unbeaten;

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
    getFirstToBeats();
    getEmptyLeaderboards();
    getSoleLevels();
    getTipping();
    getPersonalStats();
    getDifficulties();

    showListCounts();
}
function buttonEvent(btn) {
    const btnId = btn.id;
    if (btn.classList.contains("stats-button")) {
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
    }
    if (btn.classList.contains("sort-btn")) {
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
    }
}
function initButtons() {
    let buttons = document.querySelectorAll('.stats-button, .sort-btn');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            buttonEvent(btn);
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
                });

                levels.forEach(item => {
                    const levelDiv = levelCard(
                        item?.identifier,
                        item?.title,
                        item?.creators,
                        item?.images?.thumb?.key,
                        (item?.tags ? item.tags : []).includes("ok"),
                        item?.update_timestamp,
                        `${item?.statistics?.total_played} plays (${Math.round(item?.statistics?.total_played / total_plays * 100)}%)`
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