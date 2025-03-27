import json, random, requests, sys, discord, math
from datetime import datetime, date, timedelta
from discord.ext import commands
from discord import Embed

SERVER_URL = "https://api.slin.dev/grab/v1/"
PAGE_URL = "https://grab-tools.live/"
VIEWER_URL = "https://grabvr.quest/levels/viewer/"
FORMAT_VERSION = "100"

def filter_level(level):
    
    if "verification_time" in level:
        del level["verification_time"]
        
    if "format_version" in level:
        del level["format_version"]
        
    if "tags" in level:
        if "ok" in level["tags"]:
            level["tags"] = ["ok"]
        else:
            del level["tags"]
    
    if "description" in level:
        del level["description"]
            
    # if "statistics" in level:
    #     if "difficulty_string" in level["statistics"]:
    #         del level["statistics"]["difficulty_string"]
            
    if "images" in level:
        if "full" in level["images"]:
            del level["images"]["full"]
        if "thumb" in level["images"]:
            if "width" in level["images"]["thumb"]:
                del level["images"]["thumb"]["width"]
            if "height" in level["images"]["thumb"]:
                del level["images"]["thumb"]["height"]
    
    if "data_key" in level:
        iteration = int(level["data_key"].split(":")[3])
        if iteration > 1:
            level["iteration"] = iteration
        del level["data_key"]
        
    if "statistics" not in level:
        level["statistics"] = {
            "total_played": 0,
            "difficulty": 1,
            "liked": 0,
            "time": 100
        }
    else:
        statistics = level["statistics"]
        if "total_played" not in statistics:
            statistics["total_played"] = 0
        if "difficulty" not in statistics:
            statistics["difficulty"] = 1
        if "liked" not in statistics:
            statistics["liked"] = 0
        if "time" not in statistics:
            statistics["time"] = 100
    
    return level

def filter_level_list(level_list):
    for level in level_list:
        level = filter_level(level)
    return level_list

def get_level_list(type):
    list_url = f"{SERVER_URL}list?max_format_version={FORMAT_VERSION}&type={type}"
    print(list_url)
    response = requests.get(list_url).json()
    response = filter_level_list(response)
    return response

def get_user_info(user_identifier):
    user_url = f"{SERVER_URL}get_user_info?user_id={user_identifier}"
    print(user_url)
    response = requests.get(user_url).json()
    return response

def get_level_leaderboard(level_identifier):
    leaderboard_url = f"{SERVER_URL}statistics_top_leaderboard/{level_identifier.replace(':', '/')}"
    print(leaderboard_url)
    try:
        leaderboard_request = requests.get(leaderboard_url)
        if leaderboard_request.status_code == 200:
            response = leaderboard_request.json()
            return response
        else:
            print("ERROR: INVALID RESPONSE FROM SERVER")
            return []
    except:
        print("ERROR: INVALID RESPONSE FROM SERVER")
        return []

def get_level_stats(level_identifier):
    stats_url = f"{SERVER_URL}statistics/{level_identifier.replace(':', '/')}"
    print(stats_url)
    stats_request = requests.get(stats_url)
    if stats_request.status_code == 200:
        response = stats_request.json()
        return response
    else:
        print("ERROR: INVALID RESPONSE FROM SERVER")
        return {
    "level_identifier": level_identifier,
    "total_played_count": 0,
    "total_finished_count": 0,
    "played_count": 100,
    "finished_count": 1,
    "rated_count": 0,
    "liked_count": 0,
    "tipped_amount": 0
}

def get_level_browser():
    browser_url = f"{SERVER_URL}get_level_browser?version=1"
    return requests.get(browser_url).json()

def get_user_name(user_identifier, potential_user_name, priority=False):
    with open("stats_data/featured_creators.json") as featured_creators:
        creators = json.load(featured_creators)
        for creator in creators:
            if creator["list_key"].split(":")[1] == user_identifier:
                return creator["title"]
    
    if priority:
        user_data = get_user_info(user_identifier)
        return user_data["user_name"]
    
    return f"{potential_user_name}?"

def write_json_file(filename, data):
    with open(filename, 'w') as file:
        json.dump(data, file)

def timestamp_to_days(timestamp_in_milliseconds, now=datetime.now().timestamp() * 1000):
    return (now - timestamp_in_milliseconds) / 1000 / 60 / 60 / 24

def get_total_levels():
    total_url = f"{SERVER_URL}total_level_count?type=newest"
    print(total_url)
    count = int(float(requests.get(total_url).text))
    return { "levels": count }

def get_all_verified(stamp=''):
    verified = []
    while True:
        url = f"{SERVER_URL}list?max_format_version={FORMAT_VERSION}&type=ok&page_timestamp={stamp}"
        data = requests.get(url).json()
        verified.extend(data)
        if data[-1].get("page_timestamp"):
            stamp = data[-1]["page_timestamp"]
        else:
            break
    verified = filter_level_list(verified)
    return verified

def get_a_challenge():
    a_challenge_maps = get_level_list("curated_challenge")
    user_leaderboard = {}
    for level in a_challenge_maps:
        identifier = level["identifier"]
        leaderboard = get_level_leaderboard(identifier)
        # top 1 if sole victor: 1
        if leaderboard and len(leaderboard) == 1:
            addition = 1
            if leaderboard[0]["user_id"] in user_leaderboard:
                user_leaderboard[leaderboard[0]["user_id"]][0] += addition
            else:
                user_leaderboard[leaderboard[0]["user_id"]] = [addition, leaderboard[0]["user_name"], 0, leaderboard[0]["timestamp"]]
        # top 3: 2, 1.5, 1
        for i in range(min(len(leaderboard), 3)):
            addition = 2 - (i*0.5)
            if leaderboard[i]["user_id"] in user_leaderboard:
                user_leaderboard[leaderboard[i]["user_id"]][0] += addition
            else:
                user_leaderboard[leaderboard[i]["user_id"]] = [addition, leaderboard[i]["user_name"], 0, leaderboard[i]["timestamp"]]
        # rest of top 10: 0.5
        for i in range(min(len(leaderboard), 10)):
            if i > 2:
                addition = 0.5
                if leaderboard[i]["user_id"] in user_leaderboard:
                    user_leaderboard[leaderboard[i]["user_id"]][0] += addition
                else:
                    user_leaderboard[leaderboard[i]["user_id"]] = [addition, leaderboard[i]["user_name"], 0, leaderboard[i]["timestamp"]]
        # top 100: 1
        # and do map totals
        for i in range(len(leaderboard)):
            if leaderboard[i]["user_id"] in user_leaderboard:
                user_leaderboard[leaderboard[i]["user_id"]][0] += 1
                user_leaderboard[leaderboard[i]["user_id"]][2] += 1
                if leaderboard[i]["timestamp"] > user_leaderboard[leaderboard[i]["user_id"]][3]:
                    user_leaderboard[leaderboard[i]["user_id"]][3] = leaderboard[i]["timestamp"]
                    user_leaderboard[leaderboard[i]["user_id"]][1] = leaderboard[i]["user_name"]
            else:
                user_leaderboard[leaderboard[i]["user_id"]] = [1, leaderboard[i]["user_name"], 1, leaderboard[i]["timestamp"]]
    user_leaderboard = sorted(user_leaderboard.items(), key=lambda x: x[1][0], reverse=True)
    return user_leaderboard

def find_list_keys(data):
    list_keys = []
    
    if isinstance(data, dict):
        if "list_key" in data and data["list_key"] != "curated_gab3_triggers_2025":
            list_keys.append(data["list_key"])
        if "title" in data and (data["title"] == "Past Competitions" or data["title"] == "Weekly Spotlight"):
            return []
        for key, value in data.items():
            list_keys.extend(find_list_keys(value))
    elif isinstance(data, list):
        for item in data:
            list_keys.extend(find_list_keys(item))
    
    return list_keys

def get_best_of_grab():
    level_browser = get_level_browser()
    all_list_keys = find_list_keys(level_browser)
    levels = []
    for list_key in all_list_keys:
        if list_key.startswith("curated_"):
            levels_list = get_level_list(list_key)
            for level in levels_list:
                level["list_key"] = list_key
                leaderboard = get_level_leaderboard(level["identifier"])
                level["leaderboard"] = leaderboard
            for level in levels_list:
                found = False
                for level2 in levels:
                    if level2["identifier"] == level["identifier"]:
                        found = True
                        level2["list_key"] = level2["list_key"] + ":" + level["list_key"]
                        break
                if not found:
                    levels.append(level)
    return levels

# def get_creators():
#     level_browser = get_level_browser()["sections"]
#     best_of_grab = [section for section in level_browser if "title" in section and section["title"] == "Best of GRAB"][0]["sections"]
#     featured_creators = [section for section in best_of_grab if "title" in section and section["title"] == "Featured Creators"]
#     if len(featured_creators) > 0:
#         return featured_creators[0]["sections"]
#     else:
#         return []

def get_unbeaten(all_verified_maps):
    with open("stats_data/sole_victors.json") as soles_f:
        soles_data = json.load(soles_f)
    unbeaten = []
    for level in all_verified_maps:
        days_old = timestamp_to_days(level["creation_timestamp"])
        exceptions = [
        ] # check anyway
        hacked = [
            "29mu59yo9pbgwqloqhthe:1690745443",
            "29mu59yo9pbgwqloqhthe:1700955740",
            "2czbtyaqtbjo89sut7jqd:1713407280",
            "2czbtyaqtbjo89sut7jqd:1722927329",
            "2bt1j9owykx3qrnr8ilbv:1725107404",
            "2czbtyaqtbjo89sut7jqd:1729545367",
            "2bojjyjkmhegoqt73au7m:1729546021",
            "2czbtyaqtbjo89sut7jqd:1722208096",
            "2ap647di3dc1k42jf4o2o:1730644461",
            "29wytcje12nmxfatcofke:1732846628",
            "2cse0rwhzexnleljzk7g3:1734246173",
            "29wytcje12nmxfatcofke:1734653251",
            "2bojjyjkmhegoqt73au7m:1647420823",
            "2bvy4htc1ihhkf23hxxce:1725154139",
            "2bojjyjkmhegoqt73au7m:1735859839"
        ]
        if level["statistics"]["difficulty"] == 0 and ((days_old > 1 and level["statistics"]["total_played"] > 300) or days_old > 10):
            stats = get_level_stats(level['identifier'])
            if stats["finished_count"] == 0:
                if "creators" not in level:
                    level["creators"] = ["?"]
                unbeaten.append(level)
            elif level["identifier"] in hacked:
                leaderboard = get_level_leaderboard(level['identifier'])
                if len(leaderboard) == 0:
                    if "creators" not in level:
                        level["creators"] = ["?"]
                    unbeaten.append(level)
        elif level["identifier"] in exceptions:
            stats = get_level_stats(level['identifier'])
            if stats["finished_count"] == 0:
                if "creators" not in level:
                    level["creators"] = ["?"]
                unbeaten.append(level)
        else:
            potential_diff = False
            potential_sole = False
            if level["statistics"]["difficulty"] * level["statistics"]["total_played"] < 2:
                potential_diff = True
            for level2 in soles_data:
                if level2["identifier"] == level["identifier"] and level["identifier"].split(":")[0] == level2["leaderboard"][0]["user_id"]:
                    potential_sole = True
                    break
            if potential_sole and potential_diff:
                level["sole"] = True
                unbeaten.append(level)
    return unbeaten[::-1]

def get_most_verified(all_verified_maps, old_data):
    most_verified = {}

    for level in all_verified_maps:
        user_identifier = level["identifier"].split(":")[0]
        if user_identifier not in most_verified:
            most_verified[user_identifier] = {"count": 0}
        most_verified[user_identifier]["count"] += 1

    most_verified = sorted(most_verified.items(), key=lambda x: x[1]["count"], reverse=True)

    potentials = {t[0]: t[1] for t in most_verified[10:][:190]}
    most_verified = {t[0]: t[1] for t in most_verified[:10]}

    for user_identifier in most_verified:
        user_data = get_user_info(user_identifier)
        most_verified[user_identifier]["user_name"] = user_data["user_name"]
        most_verified[user_identifier]["levels"] = user_data["user_level_count"]

    for user_identifier in potentials:
        for level in all_verified_maps:
            if user_identifier == level["identifier"].split(":")[0]:
                potential_name = ""
                if "creators" in level and level["creators"]:
                    potential_name = level["creators"][0]
                potentials[user_identifier]["user_name"] = get_user_name(user_identifier, potential_name)
                break
        potentials[user_identifier]["levels"] = potentials[user_identifier]["count"]

    most_verified |= potentials

    for user_identifier in most_verified:
        if user_identifier in old_data:
            most_verified[user_identifier]["change"] = most_verified[user_identifier]["count"] - old_data[user_identifier]["count"]
        else:
            most_verified[user_identifier]["change"] = 0

    return most_verified

def get_most_plays(all_verified_maps, old_data):
    most_plays = {}

    for level in all_verified_maps:
        user_identifier = level["identifier"].split(":")[0]
        if user_identifier not in most_plays:
            most_plays[user_identifier] = {"plays": 0, "count": 0}
        most_plays[user_identifier]["plays"] += level["statistics"]["total_played"]
        most_plays[user_identifier]["count"] += 1

    most_plays = sorted(most_plays.items(), key=lambda x: x[1]["plays"], reverse=True)
    potentials = {t[0]: t[1] for t in most_plays[10:][:190]}
    most_plays = {t[0]: t[1] for t in most_plays[:10]}

    for user_identifier in potentials:
        for level in all_verified_maps:
            if user_identifier == level["identifier"].split(":")[0]:
                potential_name = ""
                if "creators" in level and level["creators"]:
                    potential_name = level["creators"][0]
                potentials[user_identifier]["user_name"] = get_user_name(user_identifier, potential_name)
                break
        potentials[user_identifier]["levels"] = potentials[user_identifier]["count"]

    for user_identifier in most_plays:
        user_data = get_user_info(user_identifier)
        most_plays[user_identifier]["user_name"] = user_data["user_name"]
        most_plays[user_identifier]["levels"] = user_data["user_level_count"]

    most_plays |= potentials

    for user_identifier in most_plays:
        if user_identifier in old_data:
            most_plays[user_identifier]["change"] = most_plays[user_identifier]["plays"] - old_data[user_identifier]["plays"]
        else:
            most_plays[user_identifier]["change"] = 0
    return most_plays

def score_challenge(type, position, days_old):
    if type == "daily":
        return 3 - position
    elif type == "weekly":
        return 10 - position * 3
    elif type == "unbeaten":
        return max(days_old // 100 - 50 * position, 0)
    
def add_score_by_id(identifier, score, username):
    with open("stats_data/challenge_scores.json") as scores:
        scores_data = json.load(scores)
        current_version = scores_data["current_version"]
        
        found = False
        for i in range(len(scores_data[f"v{current_version}"])):
            if scores_data[f"v{current_version}"][i]["user_id"] == identifier:
                scores_data[f"v{current_version}"][i]["score"] += score
                found = True
                break
        
        if not found:
            scores_data[f"v{current_version}"].append({"user_id": identifier, "score": score, "user_name": username})
            
        # sort by score
        scores_data[f"v{current_version}"].sort(key=lambda x: x["score"], reverse=True)
        
        with open("stats_data/challenge_scores.json", "w") as scores:
            json.dump(scores_data, scores)

def get_challenge_winner(type):
    with open("stats_data/daily.json") as daily_data, open("stats_data/user_blacklist.json") as blacklist:
        daily_json = json.load(daily_data)
        map_json = daily_json[type]
        blacklist_data = json.load(blacklist)

        winner_list = get_level_leaderboard(map_json["identifier"])
        offset = 0
        for i in range(min(len(winner_list), 3)):
            if winner_list[i - offset]["user_name"] in blacklist_data:
                winner_list.pop(i - offset)
                offset += 1

        days_old = timestamp_to_days(map_json['update_timestamp'], int(datetime.now().timestamp()) * 1000)
        for i in range(len(winner_list[:3])):
            score = score_challenge(type, i, days_old)
            add_score_by_id(winner_list[i]["user_id"], score, winner_list[i]["user_name"])

def get_daily_map(all_verified_maps):
    with open("stats_data/next_up.json") as data_file:
        data = json.load(data_file)
    if data["daily"] != False:
        with open("stats_data/next_up.json", "w") as data_file:
            new_data = data.copy()
            new_data["daily"] = False
            json.dump(new_data, data_file)
        return data["daily"]
    maps = sorted(all_verified_maps, key=lambda x: x["update_timestamp"], reverse=True)
    filtered_maps = [e for e in maps if (e["statistics"]["time"] <= 100 and e["statistics"]["time"] >= 3)]
    weights = [filtered_maps[i]["update_timestamp"]/(i+1) for i in range(len(filtered_maps))]
    level_data = random.choices(filtered_maps, weights, k=1)
    return level_data[0]

def get_weekly_map(all_verified_maps):
    with open("stats_data/next_up.json") as data_file:
        data = json.load(data_file)
    if data["weekly"] != False:
        with open("stats_data/next_up.json", "w") as data_file:
            new_data = data.copy()
            new_data["weekly"] = False
            json.dump(new_data, data_file)
        return data["weekly"]
    maps = sorted(all_verified_maps, key=lambda x: x["statistics"]["difficulty"])
    weights = [(1 - maps[i]["statistics"]["difficulty"])/(i+1) for i in range(len(maps))]
    level_data = random.choices(maps, weights, k=1)
    return level_data[0]

def get_unbeaten_map():
    with open("stats_data/unbeaten_levels.json") as data_file:
        data = json.load(data_file)
    if len(data) == 0: # fallback to impossible
        return {
        "identifier": "29mu59yo9pbgwqloqhthe:1690745443",
        "title": "Impossible",
        "complexity": 229,
        "update_timestamp": 1722546072852,
        "creation_timestamp": 1690755852015,
        "tags": ["ok"],
        "statistics": {
            "total_played": 39000,
            "difficulty": 0,
            "difficulty_string": "impossible",
            "liked": 0,
            "time": 100
        },
        "images": {
            "thumb": {
                "key": "level_29mu59yo9pbgwqloqhthe_1690745443_1_thumb.png"
            }
        },
        "iteration": 3,
        "creators": ["?"],
        "change": 0
    }
    return random.choice(data)

def get_trending_info(all_verified):
    with open("stats_data/all_verified.json") as old_data_file:
        old_data = json.load(old_data_file)

    for level in all_verified:
        old_level = False
        for old_level_i in old_data:
            if level["identifier"] == old_level_i["identifier"]:
                old_level = old_level_i
                
        # trending_array = []
        
        if old_level:
            level["change"] = level["statistics"]["total_played"] - old_level["statistics"]["total_played"]
            # if "trend" in old_level:
            #     trending_array = old_level["trend"]
        else:
            level["change"] = level["statistics"]["total_played"]
        
        # if len(trending_array) == 7:
        #     trending_array.pop(0)
        # trending_array.append(level["change"])
        
        # level["trend"] = trending_array

def get_beaten_unbeaten(levels_old):
    beaten = []
    for old_level in levels_old:
        if "sole" not in old_level:
            leaderboard = get_level_leaderboard(old_level["identifier"])
            if len(leaderboard) > 0:
                leaderboard = sorted(leaderboard, key=lambda x: x["timestamp"])
                victor = leaderboard[0]
                title = old_level["title"]
                url = f"{VIEWER_URL}?level={old_level['identifier']}"
                time = str(timedelta(seconds=victor["best_time"]))
                user = victor["user_name"]
                days = timestamp_to_days(old_level["update_timestamp"])
                extra = ""
                if old_level["update_timestamp"] != old_level["creation_timestamp"]:
                    extra = f" ({math.floor(timestamp_to_days(old_level["creation_timestamp"]))} since creation)"
                color = 0xffaa00
                if timestamp_to_days(old_level["creation_timestamp"]) >= 100:
                    color = 0xff7500
                if timestamp_to_days(old_level["creation_timestamp"]) >= 365:
                    color = 0xff0000
                if timestamp_to_days(old_level["creation_timestamp"]) >= 1000:
                    color = 0xffffff
                beaten.append([title, user, time, days, url, extra, color])
    return beaten

def get_empty_leaderboards():
    empty_leaderboards = []
    with open("stats_data/empty_leaderboards.json") as data_file:
        data = json.load(data_file)
        
    for level in data:
        leaderboard = get_level_leaderboard(level["identifier"])
        if len(leaderboard) == 0:
            empty_leaderboards.append(level)
            
    return empty_leaderboards

def get_hardest_levels_list():
    CF_ID = sys.argv[2]
    CF_TOKEN = sys.argv[3]
    NAMESPACE = sys.argv[4]
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ID}/storage/kv/namespaces/{NAMESPACE}/values/list"
    headers = {
        "Authorization": f"Bearer {CF_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.request("GET", url, headers=headers)
    return json.loads(response.text)

def get_blocked_ids():
    CF_ID = sys.argv[2]
    CF_TOKEN = sys.argv[3]
    NAMESPACE = sys.argv[4]
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ID}/storage/kv/namespaces/{NAMESPACE}/values/blocked"
    headers = {
        "Authorization": f"Bearer {CF_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.request("GET", url, headers=headers)
    return json.loads(response.text)

def get_unverified(all_verified, all_verified_old):
    unverified = []
    verified_ids = [l["identifier"] for l in all_verified]
    for level in all_verified_old:
        if level["identifier"] not in verified_ids:
            unverified.append(level)
    return unverified

def get_level_data():
    with open("stats_data/log_data.json") as log_file:
        log_data = json.load(log_file)
    if datetime.now().timestamp() - log_data["last_ran"] < 60*60*14:
        print("Not running")
        return

    with open("stats_data/most_plays.json") as most_plays_file, open("stats_data/most_verified.json") as most_verified_file, open("stats_data/unbeaten_levels.json") as unbeaten_file, open("stats_data/all_verified.json") as all_verified_file, open("stats_data/best_of_grab.json") as best_of_grab_file:
        most_plays_old = json.load(most_plays_file)
        most_verified_old = json.load(most_verified_file)
        unbeaten_levels_old = json.load(unbeaten_file)
        all_verified_old = json.load(all_verified_file)
        best_of_grab_levels_old = json.load(best_of_grab_file)

    all_verified = get_all_verified()
    unbeaten_levels = get_unbeaten(all_verified)
    beaten_unbeaten_levels = get_beaten_unbeaten(unbeaten_levels_old)
    unverified = get_unverified(all_verified, all_verified_old)
    get_trending_info(all_verified)
    write_json_file('stats_data/all_verified.json', all_verified)
    write_json_file('stats_data/a_challenge.json', get_a_challenge())
    best_of_grab_levels = get_best_of_grab()
    write_json_file('stats_data/best_of_grab.json', best_of_grab_levels)
    # write_json_file('stats_data/featured_creators.json', get_creators())
    write_json_file('stats_data/unbeaten_levels.json', unbeaten_levels)
    write_json_file('stats_data/most_verified.json', get_most_verified(all_verified, most_verified_old))
    write_json_file('stats_data/most_plays.json', get_most_plays(all_verified, most_plays_old))
    write_json_file('stats_data/hardest_levels_list.json', get_hardest_levels_list())
    write_json_file('stats_data/blocked.json', get_blocked_ids())
    write_json_file('stats_data/total_level_count.json', get_total_levels())

    daily_data = {}
    with open("stats_data/daily.json") as file:
            daily_data = json.load(file)

    get_challenge_winner("daily")
    daily_level = get_daily_map(all_verified)
    daily_anc = [daily_level["title"], f"{VIEWER_URL}?level={daily_level['identifier']}"]
    daily_data["daily"] = daily_level

    get_challenge_winner("unbeaten")
    unbeaten_level = get_unbeaten_map()
    unbeaten_anc = [unbeaten_level["title"], f"{VIEWER_URL}?level={unbeaten_level['identifier']}"]
    daily_data["unbeaten"] = unbeaten_level

    weekly_anc = False
    weekly = log_data["days_since_weekly"] + 1
    reset = log_data["weeks_since_reset"]
    if weekly == 7:
        reset += 1
                
        write_json_file("stats_data/empty_leaderboards.json", get_empty_leaderboards())
        
        get_challenge_winner("weekly")
        weekly_level = get_weekly_map(all_verified)
        weekly_anc = [weekly_level["title"], f"{VIEWER_URL}?level={weekly_level['identifier']}"]
        daily_data["weekly"] = weekly_level
        
        if reset == 8:
            reset = 0
            with open("stats_data/challenge_scores.json") as scores:
                scores_data = json.load(scores)
                scores_data[f"v{scores_data["current_version"]}"] = scores_data[f"v{scores_data["current_version"]}"][:10]
                scores_data["current_version"] = scores_data["current_version"] + 1
                scores_data[f"v{scores_data["current_version"]}"] = []
                write_json_file("stats_data/challenge_scores.json", scores_data)
                
        weekly = 0

    log(weekly, reset)

    write_json_file('stats_data/daily.json', daily_data)

    run_bot(daily_anc, unbeaten_anc, weekly_anc, unbeaten_levels, beaten_unbeaten_levels, unverified, best_of_grab_levels_old, best_of_grab_levels)

def log(weekly, reset):
    log_data = {
        "days_since_weekly": weekly,
        "last_ran": datetime.now().timestamp(),
        "weeks_since_reset": reset,
    }
    write_json_file('stats_data/log_data.json', log_data)

async def get_challenge_scores():
    with open('stats_data/challenge_scores.json') as file_data:
        all_leaderboards = json.load(file_data)
        current_version = all_leaderboards["current_version"]
        leaderboard = all_leaderboards[f"v{current_version}"]

    embed = discord.Embed(title='Map Challenges Leaderboard', url=f"{PAGE_URL}stats?tab=MapChallenges", description=str(date.today()), color=0x00ffff)
    embed_values = []
    count = 0
    for i in range(len(leaderboard)):
        value = leaderboard[i]
        embed_values.append(f'{value["user_name"]}: {int(value["score"])} Pt')
        if count >= 10:
            break
        count += 1
    embed.add_field(name='Leaderboard', value='\n'.join(embed_values), inline=False)

    return embed


def run_bot(daily, unbeaten, weekly, unbeaten_levels=[], beaten_unbeaten_levels=[], unverified=[], best_of_grab_levels_old=[], best_of_grab_levels=[]):

    intents = discord.Intents.default()
    bot = commands.Bot(command_prefix='!', intents=intents, allowed_mentions=discord.AllowedMentions(roles=True, users=False, everyone=False))

    @bot.event
    async def on_ready():
        # Challenges
        print(f'Bot connected as {bot.user.name}')
        channel = bot.get_channel(1110435431750828132)
        guild = bot.get_guild(1048213818775437394)
        role = guild.get_role(1110735575083929622)

        embed = Embed(title="Daily/Weekly Maps Update", url=f"{PAGE_URL}stats?tab=DailyMap", description="Daily Update", color=0x00ffff)
        embed.add_field(name="Daily", value=f"[{daily[0]}]({daily[1]})")
        embed.add_field(name="Unbeaten", value=f"[{unbeaten[0]}]({unbeaten[1]})")
        if weekly:
            embed.add_field(name="Weekly", value=f"[{weekly[0]}]({weekly[1]})")

        await channel.send(f"||{role.mention}||")
        await channel.send(embed=embed)
        scores_embed = await get_challenge_scores()
        await channel.send(embed=scores_embed)

        # Unbeaten
        if unbeaten_levels:
            channel = bot.get_channel(1144060608937996359)
            role = guild.get_role(1077411286696087664)

            embed = Embed(title="Unbeaten Levels Update", url=f"{PAGE_URL}stats?tab=UnbeatenMaps", description="Unbeaten Update", color=0x00ffff)
            embed.add_field(name="Count", value=str(len(unbeaten_levels)))
            
            over_100 = []

            for level in unbeaten_levels:
                if timestamp_to_days(level["update_timestamp"]) >= 100:
                    over_100.append(level)
                
            if over_100:
                embed.add_field(name="Over 100 Days", value=("\n".join([f"{level['title']}" for level in over_100]))[:900], inline=False)

            if len(unbeaten_levels) > 0:
                embed.add_field(name="Newest", value=unbeaten_levels[-1]["title"], inline=False)

            await channel.send(f"||{role.mention}||")
            await channel.send(embed=embed)
            
        for beaten in beaten_unbeaten_levels:
            beaten_embed = Embed(title=beaten[0], url=beaten[4], description=f"Beaten by {beaten[1]} in {beaten[2]} after {math.floor(beaten[3])} days!{beaten[5]}", color=beaten[6])
            await channel.send(embed=beaten_embed)
            
        unverified_channel = bot.get_channel(1238777601166934016)
        if len(unverified) > 0:
            await unverified_channel.send(f"{len(unverified)} unverified")
        for map in unverified:
            color = 0x000000
            creator = "Unknown Creator"
            if "scheduled_for_deletion" in map:
                color = 0xff0000
            if "creators" in map and len(map["creators"]) > 0:
                creator = map["creators"][0]
            unverified_embed = Embed(title=map["title"], url=f"{VIEWER_URL}?level={map['identifier']}", description=creator, color=color)
            if "images" in map and "thumb" in map["images"] and "key" in map["images"]["thumb"]:
                link = map["images"]["thumb"]["key"]
                unverified_embed.set_thumbnail(url=f"https://grab-images.slin.dev/{link}")
            await unverified_channel.send(embed=unverified_embed)
            
        # challenge maps record changes
        new_records = []
        challenge_records_channel = bot.get_channel(1241943979751374868)
        for map in best_of_grab_levels:
            found = False
            for map_old in best_of_grab_levels_old:
                if map["identifier"] == map_old["identifier"] and "curated_challenge" in map["list_key"]:
                    found = True
                    old_record = None
                    current_record = None
                    if "leaderboard" in map_old and len(map_old["leaderboard"]) > 0:
                        old_record = map_old["leaderboard"][0]
                    if "leaderboard" in map and len(map["leaderboard"]) > 0:
                        current_record = map["leaderboard"][0]
                    if current_record is not None and old_record is not None and current_record["timestamp"] != old_record["timestamp"]:
                        embed = Embed(title=map["title"], url=f"{VIEWER_URL}?level={map['identifier']}", description=f"New record by {current_record['user_name']}: {current_record["best_time"]}s", color=0xff0000)
                        await challenge_records_channel.send(embed=embed)
                    elif current_record is not None and old_record is not None:
                        break
                    elif current_record is not None and old_record is None:
                        embed = Embed(title=map["title"], url=f"{VIEWER_URL}?level={map['identifier']}", description=f"New record by {current_record['user_name']}: {current_record["best_time"]}s", color=0xff0000)
                        await challenge_records_channel.send(embed=embed)
                    elif old_record is not None:
                        embed = Embed(title=map["title"], url=f"{VIEWER_URL}?level={map['identifier']}", description=f"Record removed by moderator", color=0x990000)
                        await challenge_records_channel.send(embed=embed)
                    break
            if not found and "curated_challenge" in map["list_key"]:
                embed = Embed(title=map["title"], url=f"{VIEWER_URL}?level={map['identifier']}", description=f"Map added to a challenge", color=0x990000)
                await challenge_records_channel.send(embed=embed)

            for i in range(len(map["leaderboard"])):
                identifier = map["leaderboard"][i]["user_id"]
                for map_old in best_of_grab_levels_old:
                    if map["identifier"] == map_old["identifier"]:
                        found = False
                        for j in range(len(map_old["leaderboard"])):
                            if map_old["leaderboard"][j]["user_id"] == identifier:
                                found = True
                                if map["leaderboard"][i]["timestamp"] != map_old["leaderboard"][j]["timestamp"]:
                                    new_records.append({
                                        "identifier": map["identifier"],
                                        "title": map["title"],
                                        "record": map["leaderboard"][i]
                                    })
                        if not found:
                            new_records.append({
                                "identifier": map["identifier"],
                                "title": map["title"],
                                "record": map["leaderboard"][i]
                            })

        records_log_channel = bot.get_channel(1333319489726713877)
        for entry in new_records:
            embed = Embed(title=entry["title"], url=f"{VIEWER_URL}?level={entry['identifier']}", color=0xff0000 if int(entry["record"]["position"]) == 0 else 0x990000)
            embed.add_field(name=entry["record"]["user_name"], value=f"{entry["record"]["position"]}: {entry["record"]['best_time']}s", inline=False)
            await records_log_channel.send(embed=embed)

        for map_old in best_of_grab_levels_old:
            if "curated_challenge" in map_old["list_key"]:
                found = False
                for map in best_of_grab_levels:
                    if map["identifier"] == map_old["identifier"] and "curated_challenge" in map["list_key"]:
                        found = True
                        break
                if not found:
                    embed = Embed(title=map_old["title"], url=f"{VIEWER_URL}?level={map_old['identifier']}", description=f"Map removed from a challenge", color=0x990000)
                    await challenge_records_channel.send(embed=embed)

        await bot.close()

    bot.run(sys.argv[1])
    print("success")

get_level_data()
