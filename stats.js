function toggleTabs() {
    document.querySelectorAll('.LeaderboardOutput').forEach(e => {
        e.style.display = 'none';
    });
    document.querySelectorAll('.tab-active').forEach(e => {
        e.classList.remove('tab-active');
    });
}

document.getElementById('UnbeatenMaps').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('UnbeatenMaps-out').style.display = "flex";
    document.getElementById('UnbeatenMaps').classList.add('tab-active');
});
document.getElementById('MostVerifiedMaps').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('MostVerifiedMaps-out').style.display = "flex";
    document.getElementById('MostVerifiedMaps').classList.add('tab-active');
});
document.getElementById('LevelSearch').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('LevelSearch-out').style.display = "flex";
    document.getElementById('LevelSearch').classList.add('tab-active');
});
document.getElementById('MostPlays').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('MostPlays-out').style.display = "flex";
    document.getElementById('MostPlays').classList.add('tab-active');
});
document.getElementById('MostPlayedMaps').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('MostPlayedMaps-out').style.display = "flex";
    document.getElementById('MostPlayedMaps').classList.add('tab-active');
});
document.getElementById('DailyMap').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('DailyMap-out').style.display = "flex";
    document.getElementById('DailyMap').classList.add('tab-active');
});
document.getElementById('WeeklyMap').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('WeeklyMap-out').style.display = "flex";
    document.getElementById('WeeklyMap').classList.add('tab-active');
});
document.getElementById('UnbeatenMap').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('UnbeatenMap-out').style.display = "flex";
    document.getElementById('UnbeatenMap').classList.add('tab-active');
});
document.getElementById('MapChallenges').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('MapChallenges-out').style.display = "flex";
    document.getElementById('MapChallenges').classList.add('tab-active');
});
document.getElementById('MostTimeMaps').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('MostTimeMaps-out').style.display = "flex";
    document.getElementById('MostTimeMaps').classList.add('tab-active');
});
document.getElementById('MostLikedMaps').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('MostLikedMaps-out').style.display = "flex";
    document.getElementById('MostLikedMaps').classList.add('tab-active');
});

function getUnbeatenLevels() {
    fetch('/stats_data/unbeaten_levels.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            document.getElementById('UnbeatenMaps-out').innerHTML += `<div class="leaderboard-item"><div><a href="${item["link"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${item["creators"][0]}</span></div><span>${parseInt(item["age"].split(" ")[0])} ${item["age"].split(" ")[1]}</span><span>${item["plays"]} plays</span></div>`;
        });
    });
}

async function getTopPlayers(limit = 10) {
    fetch('/stats_data/most_verified.json')
    .then(res => res.json())
    .then(json_data => {
        for (const id in json_data) {
            const value = json_data[id];
            if (value["count"] != value["levels"]) {
                document.getElementById("MostVerifiedMaps-out").innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${id}">${value["user_name"]}<span class="stats-change">+${value["change"]}</span></a><span>${value["count"]} verified of ${value["levels"]} maps</span></div>`;
            } else {
                document.getElementById("MostVerifiedMaps-out").innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${id}">${value["user_name"]}<span class="stats-change">+${value["change"]}</span></a><span>${value["count"]} verified</span></div>`;
            }
        }
    });
}

function getPlayedLevels() {
    fetch('/stats_data/most_played_maps.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            document.getElementById('MostPlayedMaps-out').innerHTML += `<div class="leaderboard-item"><div><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${item["creator"]}</span></div><span>${new Date(item.creation_timestamp).toDateString().substring(4)}</span><span>${item["statistics"]["total_played"]} plays</span></div>`;
        });
    });
}

function getTopLikes() {
    fetch('/stats_data/most_liked.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            document.getElementById('MostLikedMaps-out').innerHTML += `<div class="leaderboard-item"><div><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${item["creator"]}</span></div><span>${new Date(item.creation_timestamp).toDateString().substring(4)}</span><span>${100 * item["statistics"]["liked"]}%</span></div>`;
        });
    });
}

function getTopTimes() {
    fetch('/stats_data/longest_times.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            document.getElementById('MostTimeMaps-out').innerHTML += `<div class="leaderboard-item"><div><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${item["creator"]}</span></div><span>${new Date(item.creation_timestamp).toDateString().substring(4)}</span><span>${item["statistics"]["time"]}s</span></div>`;
        });
    });
}

function getPlaysLevels() {
    fetch('/stats_data/most_plays.json')
    .then((response) => response.json())
    .then(json_data => {
        for (const id in json_data) {
            const value = json_data[id];
            document.getElementById('MostPlays-out').innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${id}">${value["user_name"]}<span class="stats-change">+${value["change"]}</span></a><span>${value["plays"]} from ${value["count"]} / ${value["levels"]} maps</span></div>`;
        }
    });
}

const submitBtn = document.getElementById("submit-btn");
addEventListener("click", async (e) => {
    if (e.target.id == submitBtn.id) {
        const idInput = document.getElementById("user-input");
        const keyInput = document.getElementById("key-input");
        const output = document.getElementById("LevelSearch-out");
        var user = idInput.value;

        var id = user;
        if (user) {
            try {
                const userDataResponse = await fetch(`https://api.slin.dev/grab/v1/list?type=user_name&search_term=${user}`);
                const userData = await userDataResponse.json();
                id = userData[0].user_id.toLowerCase();
            } catch (error) {
                console.error("Error fetching user data:", error);
                var rand = Math.floor(Math.random() * 11);
                id = '29sgp24f1uorbc6vq8d2k';
            }
        }

        const keys = keyInput.value.toLowerCase().split("|");

        const promises2 = [fetch('/stats_data/all_verified.json')];
        let array2 = [];
        try {
            const responses2 = await Promise.all(promises2);
            const json_data2 = await Promise.all(responses2.map(res => res.json()));
            array2 = json_data2.flat();
        } catch (error) {
            console.error("Error fetching verified stats data:", error);
        }

        let array1 = [];
        if (user !== '' && user !== null) {
            try {
                const response1 = await fetch(`https://api.slin.dev/grab/v1/list?max_format_version=7&user_id=${id}`);
                const json_data1 = await response1.json();
                array1 = json_data1.flat().filter(level => !level.tags || level.tags.ok);
            } catch (error) {
                console.error("Error fetching user level data:", error);
            }
        }

        const array = array1.concat(array2);

        let levels = array.filter(level => {
            for (var key of keys) {
                if (level["title"].toLowerCase().includes(key)) {
                    if (level["identifier"].split(":")[0].toLowerCase().includes(id)) {
                        return true;
                    }
                }
            }
            return false;
        });

        levels = levels.filter(level => level.hasOwnProperty("statistics"));
        levels = levels.filter(level => level.statistics.hasOwnProperty("total_played"));
        levels.sort((a, b) => b.statistics.total_played - a.statistics.total_played);

        let total = 0;
        output.querySelectorAll('.leaderboard-item').forEach(e => e.remove());

        const fragment = document.createDocumentFragment();

        levels.forEach(item => {
            try {
                total += item.statistics.total_played;
            } catch (error) {
                console.error("Error accessing total_played:", error);
            }

            const levelDiv = document.createElement('div');
            levelDiv.classList.add('leaderboard-item');
            levelDiv.innerHTML = `<div><a href="https://grabvr.quest/levels/viewer/?level=${item.identifier}">${item.title}</a><br>by <span title="${item.creators}">${item.creator}</span></div><span>${new Date(
                item.creation_timestamp
            )
                .toDateString()
                .substring(4)}</span><span>${item.statistics.total_played} plays</span>`;
            fragment.appendChild(levelDiv);
        });

        output.appendChild(fragment);

        document.getElementById('counter').innerHTML = `<b>Total plays: ${total}</b>`;
    }
});

function getDailyMap() {
    fetch('/stats_data/daily_map.json')
    .then((response) => response.json())
    .then(item => {
        document.getElementById('DailyMap-out').innerHTML += `<h1><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${item["creator"]}</span></h1>`;
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
        document.getElementById('WeeklyMap-out').innerHTML += `<h1><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${item["creator"]}</span></h1>`;
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
        document.getElementById('UnbeatenMap-out').innerHTML += `<h1><a href="${item["link"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${item["creators"]}</span></h1>`;
        fetch(`https://api.slin.dev/grab/v1/statistics_top_leaderboard/${item['link'].split("=")[1].replace(':', '/')}`)
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
                    leaderboard[item[0][0]["user_id"]][1] += 2;
                    let age = parseInt(item[1]["age"].split(" ")[0]);
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
                    leaderboard[item[0][1]["user_id"]][1] += 1;
                    let age = parseInt(item[1]["age"].split(" ")[0]);
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
                    leaderboard[item[0][2]["user_id"]][1] += 3;
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


getTopPlayers(10);
getUnbeatenLevels();
getPlayedLevels();
getPlaysLevels();
getTopTimes();
getTopLikes();
getDailyMap();
getWeeklyMap();
getUnbeatenMap();
getChallengeScores();