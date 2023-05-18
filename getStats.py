import json, random, requests, time
from datetime import datetime

def write_json_file(filename, data):
    with open(filename, 'w') as file:
        json.dump(data, file, indent=2)

def timestamp_to_age(timestamp_in_milliseconds):
    time_elapsed_in_seconds = int((datetime.now().timestamp() * 1000 - timestamp_in_milliseconds) / 1000)
    time_elapsed_in_minutes = time_elapsed_in_seconds / 60
    time_elapsed_in_hours = time_elapsed_in_minutes / 60
    time_elapsed_in_days = time_elapsed_in_hours / 24
    if time_elapsed_in_days > 0:
        return f"{time_elapsed_in_days} days"
    elif time_elapsed_in_hours > 0:
        return f"{time_elapsed_in_hours} hours"
    elif time_elapsed_in_minutes > 0:
        return f"{time_elapsed_in_minutes} minutes"
    else:
        return f"{time_elapsed_in_seconds} seconds"

def get_all_verified(stamp=''):
    verified = []
    while True:
        url = f"https://api.slin.dev/grab/v1/list?max_format_version=100&type=ok&page_timestamp={stamp}"
        data = requests.get(url).json()
        for level in data:
            if "creators" in level:
                level["creator"] = level["creators"][0]
        print("Sending request")
        verified.extend(data)
        if data[-1].get("page_timestamp"):
            stamp = data[-1]["page_timestamp"]
        else:
            break
    return verified

def get_unbeaten(data):
    unbeaten = []
    for level in data:
        age = timestamp_to_age(level["creation_timestamp"])
        if level["statistics"]["difficulty"] == 0 and "days" in age and level["statistics"]["total_played"] > 300:
            url = f"https://api.slin.dev/grab/v1/statistics/{level['identifier'].replace(':', '/')}"
            stats = requests.get(url).json()
            print("Sending request")
            if stats["finished_count"] == 0:
                new_data = {
                    "plays": str(stats["total_played_count"]),
                    "link": f"https://grabvr.quest/levels/viewer?level={level['identifier']}",
                    "title": level["title"],
                    "age": age,
                    "creators": level["creators"]
                }
                unbeaten.append(new_data)
    return unbeaten[::-1]

def get_most_verified(data):
    most_verified = {}
    for level in data:
        id = level["identifier"].split(":")[0]
        if id in most_verified:
            most_verified[id]["count"] += 1
        else:
            most_verified[id] = {"count": 1}
    most_verified = sorted(most_verified.items(), key=lambda x: x[1]["count"], reverse=True)
    most_verified = most_verified[:10]
    most_verified = {t[0]: t[1] for t in most_verified}
    for i, (id, data) in enumerate(most_verified.items()):
        url = f"https://api.slin.dev/grab/v1/get_user_info?user_id={id}"
        user_data = requests.get(url).json()
        print("Sending request")
        most_verified[id]["user_name"] = user_data["user_name"]
        most_verified[id]["levels"] = user_data["user_level_count"]
    return most_verified

def get_most_plays(data):
    most_plays = {}
    for level in data:
        id = level["identifier"].split(":")[0]
        if id in most_plays:
            most_plays[id]["plays"] += level["statistics"]["total_played"]
            most_plays[id]["count"] += 1
        else:
            most_plays[id] = {"plays": level["statistics"]["total_played"], "count": 1}
    most_plays = sorted(most_plays.items(), key=lambda x: x[1]["plays"], reverse=True)
    most_plays = most_plays[:10]
    most_plays = {t[0]: t[1] for t in most_plays}
    for i, (id, data) in enumerate(most_plays.items()):
        url = f"https://api.slin.dev/grab/v1/get_user_info?user_id={id}"
        user_data = requests.get(url).json()
        print("Sending request")
        most_plays[id]["user_name"] = user_data["user_name"]
        most_plays[id]["levels"] = user_data["user_level_count"]
    return most_plays

def get_most_played_maps(data):
    most_played_maps = sorted(data, key=lambda x: x["statistics"]["total_played"], reverse=True)
    most_played_maps = most_played_maps[:100]
    return most_played_maps

def get_daily_winner():
    with open("stats_data/daily_winners.json", 'r') as winners, open("stats_data/daily_map.json", "r") as map:
        map_json = json.load(map)
        id = map_json["identifier"]
        url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{id.replace(':', '/')}"
        winner = requests.get(url).json()[0]
        winners_json = json.loads(winners.read())
        winners_json.append([winner, map_json, int(time.time())])
    write_json_file('stats_data/daily_winners.json', winners_json)


def get_daily_map(data):
    maps = sorted(data, key=lambda x: x["update_timestamp"], reverse=True)
    weights = []
    for i in range(len(maps)):
        weights.append(maps[i]["update_timestamp"]/(i+1))
    level_data = random.choices(maps, weights, k=1)
    return level_data[0]


def get_level_data():
    with open("stats_data/log_data.json", 'r') as file:
        log_data = json.load(file)
    all_verified = get_all_verified()
    write_json_file('stats_data/all_verified.json', all_verified)
    most_played_maps = get_most_played_maps(all_verified)
    write_json_file('stats_data/most_played_maps.json', most_played_maps)
    get_daily_winner()
    daily_level = get_daily_map(all_verified)
    write_json_file('stats_data/daily_map.json', daily_level)
    did_players = False
    did_unbeaten = False
    if not log_data["unbeaten_levels"]:
        unbeaten_levels = get_unbeaten(all_verified)
        write_json_file('stats_data/unbeaten_levels.json', unbeaten_levels)
        did_unbeaten = True
        if not log_data["players"]:
            most_verified = get_most_verified(all_verified)
            write_json_file('stats_data/most_verified.json', most_verified)
            most_plays = get_most_plays(all_verified)
            write_json_file('stats_data/most_plays.json', most_plays)
            did_players = True

    log(did_players, did_unbeaten)

def log(players, unbeaten_levels):
    log_data = {
        "last_ran": datetime.now().timestamp(),
        "players": players,
        "unbeaten_levels": unbeaten_levels
    }
    write_json_file('stats_data/log_data.json', log_data)

get_level_data()



