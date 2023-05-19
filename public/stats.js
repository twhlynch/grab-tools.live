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
document.getElementById('HardestMaps').addEventListener('click', () => {
    toggleTabs();
    document.getElementById('HardestMaps-out').style.display = "flex";
    document.getElementById('HardestMaps').classList.add('tab-active');
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

function getHardestLevels() {
    fetch('stats_data/all_verified.json')
    .then((response) => response.json())
    .then(data => {
        
        data.forEach((level) => {
            level.score = 1 - level.statistics.difficulty;
            if (!level.statistics.time) {
                level.statistics.time = 9007199254740990;
            }
            level.statistics.finishes = level.statistics.total_played * level.statistics.difficulty;
            if (Date.now() - level.creation_timestamp < 604800000) {
                data.splice(data.indexOf(level), 1);
            }
            percentage = (level.statistics.total_played ** 2) / (1000 ** 2);
            percentage > 1 ? level.percentage = 1 : level.percentage = percentage;
        });
        
        data.sort(function(a, b) {
            return a.statistics.difficulty - b.statistics.difficulty;
        });
        // diff0++ & top100diff++
        var i = 0;
        data.forEach(level => {
            if (i < 100) {
                if (level.statistics.difficulty == 0) {
                    i--;
                    level.score++;
                }
                level.score++;
                i++;
            }
        });

        data.sort(function(a, b) {
            return b.statistics.time - a.statistics.time;
        });
        // timeN/a++ & top100time++
        i = 0;
        data.forEach(level => {
            if (i < 100) {
                /*if (level.statistics.time == 9007199254740990) {
                    i--;
//                            level.score++;
                }*/
                level.score++;
                i++;
            }
        });

        data.sort(function(a, b) {
            return a.statistics.finishes - b.statistics.finishes;
        });
        // 0finish++ & top100finish++
        i = 0;
        data.forEach(level => {
            if (i < 100) {
                if (level.statistics.finishes == 0) {
                    i--;
                    level.score++;
                }
                level.score++;
                i++;
            }
        });

            

        data.sort(function(a, b) {
            return a.creation_timestamp - b.creation_timestamp;
        });

        data.sort(function(a, b) {
            return b.score*b.percentage - a.score*a.percentage;
        });

        // console.log(data);

        i = 0;
        data.forEach(level => {
            if (i < 100) {
                document.getElementById("HardestMaps-out").innerHTML += `<div class="leaderboard-item"><div><a href="https://grabvr.quest/levels/viewer/?level=${level.identifier}">${level.title}</a><br>by <span title="${level.creators}">${level.creator}</span></div><span>${new Date(level.creation_timestamp).toDateString().substring(4)}</span><span>${(( 1 - level.statistics.difficulty ) * 100).toString().slice(0, 5)}% | ${(Math.round((level.score*level.percentage) * 1000) / 1000)}</span></div>`;
                i++;
            }
        });
        
        // data.sort(function(a, b) {
        //     return a.creation_timestamp - b.creation_timestamp;
        // });

        // data.sort(function(a, b) {
        //     return b.score - a.score;
        // });

        // console.log(data);

        // i = 0;
        // data.forEach(level => {
        //     if (i < 100) {
        //         document.getElementById("leaderboard-output-2").innerHTML += "<div><a href='https://grabvr.quest/levels/viewer/?level=" + level.identifier + "'>" + level.title + "</a> by " + level.creators + " <p>(" + (Math.round(level.statistics.difficulty * 10000) / 10000) + " | " + (Math.round(level.score * 10000) / 10000) + ")</p></div>";
        //         i++;
        //     }
        // });
    });
}

function getUnbeatenLevels() {
    fetch('stats_data/unbeaten_levels.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            document.getElementById('UnbeatenMaps-out').innerHTML += `<div class="leaderboard-item"><div><a href="${item["link"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${item["creators"][0]}</span></div><span>${parseInt(item["age"].split(" ")[0])} ${item["age"].split(" ")[1]}</span><span>${item["plays"]} plays</span></div>`;
        });
    });
}

async function getTopPlayers(limit = 10) {
    fetch('stats_data/most_verified.json')
    .then(res => res.json())
    .then(json_data => {
        for (const id in json_data) {
            const value = json_data[id];
            document.getElementById("MostVerifiedMaps-out").innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${id}">${value["user_name"]}</a><span>${value["count"]} verified of ${value["levels"]} maps</span></div>`;
        }
    });
}

function getPlayedLevels() {
    fetch('stats_data/most_played_maps.json')
    .then((response) => response.json())
    .then(data => {
        data.forEach(item => {
            document.getElementById('MostPlayedMaps-out').innerHTML += `<div class="leaderboard-item"><div><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${item["creator"]}</span></div><span>${new Date(item.creation_timestamp).toDateString().substring(4)}</span><span>${item["statistics"]["total_played"]} plays</span></div>`;
        });
    });
}

function getPlaysLevels() {
    fetch('stats_data/most_plays.json')
    .then((response) => response.json())
    .then(json_data => {
        for (const id in json_data) {
            const value = json_data[id];
            document.getElementById('MostPlays-out').innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${id}">${value["user_name"]}</a><span>${value["plays"]} from ${value["count"]} / ${value["levels"]} maps</span></div>`;
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
                const userDataResponse = await fetch(
                    `https://api.slin.dev/grab/v1/list?type=user_name&search_term=${user}`
                );
                const userData = await userDataResponse.json();
                id = userData[0]
                    .user_id
                    .toLowerCase();
            } catch  {
                var rand = Math.floor(Math.random() * 11);
                id = '29sgp24f1uorbc6vq8d2k';
            }
        }
        const keys = keyInput
            .value
            .toLowerCase()
            .split("|");

        const promises2 = [fetch('stats_data/all_verified.json')];
        var promise1 = [
            []
        ];
        if (user == '' || user == null) {
            var promises1 = [
                []
            ];
        } else {
            var promises1 = [fetch(`https://api.slin.dev/grab/v1/list?max_format_version=7&user_id=${id}`)];
        }

        const responses2 = await Promise.all(promises2);
        const json_data2 = await Promise.all(responses2.map(res => res.json()));
        const array2 = json_data2.flat();
        var array1 = [];
        if (user == '' || user == null) {
            var array1 = [];
        } else {
            const responses1 = await Promise.all(promises1);
            const json_data1 = await Promise.all(responses1.map(res => res.json()));

            var array1 = json_data1
                .flat()
                .filter(level => !level.tags || level.tags.ok);

        }
        var array = array1.concat(array2);

        var levels = array.filter(level => {
            for (var key of keys) {
                if (level["title"].toLowerCase().includes(key)) {
                    if (level["identifier"].split(":")[0].toLowerCase().includes(id)) {
                        return true;
                    }
                }
            }
            return false;
        });

        levels.sort((a, b) => b.statistics.total_played - a.statistics.total_played);

        let total = 0;
        output
            .querySelectorAll('.leaderboard-item')
            .forEach(e => {
                e.remove();
            });
        levels.forEach(item => {
            total += item["statistics"]["total_played"];
            output.innerHTML += `<div class="leaderboard-item"><div><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a><br>by <span title="${item["creators"]}">${item["creator"]}</span></div><span>${new Date(
                item.creation_timestamp
            )
                .toDateString()
                .substring(4)}</span><span>${item["statistics"]["total_played"]} plays</span></div>`;
        });

        document.getElementById('counter').innerHTML =  `<b>Total plays: ${total}</b>`;
    }
});

function getDailyMap() {
    fetch('stats_data/daily_map.json')
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
    fetch('stats_data/weekly_map.json')
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
    fetch('stats_data/unbeaten_map.json')
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
    fetch('stats_data/map_winners.json')
    .then((response) => response.json())
    .then(items => {
        leaderboard = {};
        items.forEach( item => {
            if (!leaderboard[item[0]["user_id"]]) {
                leaderboard[item[0]["user_id"]] = [item[0]["user_name"], 0, item[0]["user_id"]];
            }
            if (item[3] === "daily_map") {
                leaderboard[item[0]["user_id"]][1] += 1;
            } else if (item[3] === "weekly_map" || item[3] === "unbeaten_map") {
                leaderboard[item[0]["user_id"]][1] += 2;
            }
        });
        leaderboard = Object.fromEntries(Object.entries(leaderboard).sort((a, b) => a[1][1] - b[1][1]));
        for (const value of Object.values(leaderboard)) {
            document.getElementById('MapChallenges-out').innerHTML += `<div class="leaderboard-item"><a href="https://grabvr.quest/levels?tab=tab_other_user&user_id=${value[2]}">${value[0]}</a><span>${value[1]} Pt</span></div>`;
        }
    });
}


getTopPlayers(10);
getUnbeatenLevels();
getHardestLevels();
getPlayedLevels();
getPlaysLevels();
getDailyMap();
getWeeklyMap();
getUnbeatenMap();
getChallengeScores();