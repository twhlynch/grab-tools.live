import json, requests, contextlib

with open("stats_data/all_verified.json") as file:
    data = json.load(file)
  
leaderboard = {}
empty_leaderboards = []
sole_victors = []
user_finishes = {}
for i, level in enumerate(data, start=1):
    identifier = level["identifier"].replace(":", "/")
    url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{identifier}"
    with contextlib.suppress(Exception):
        res_data = requests.get(url).json()
    if len(res_data) != 0:
        level["leaderboard"] = res_data
        if len(res_data) == 1:
            sole_victors.append(level)
        if len(res_data) > 0:
            keyName = res_data[0]["user_id"]
            if keyName not in leaderboard:
                leaderboard[keyName] = [0, [], res_data[0]["user_name"]]
            leaderboard[keyName][0] += 1
            leaderboard[keyName][1].append([level["title"] + "|" + level["identifier"]])
    else:
        empty_leaderboards.append(level)
    
    for record in res_data:
        if record["user_id"] not in user_finishes:
            user_finishes[record["user_id"]] = [0, [], record["user_name"]]
        user_finishes[record["user_id"]][0] += 1
        user_finishes[record["user_id"]][1].append([level["title"] + "|" + level["identifier"]])
    
    print(i)
    i += 1

sorted_leaderboard = dict(sorted(leaderboard.items(), key=lambda x: x[1][0], reverse=True))


with open("stats_data/user_finishes.json", "w") as file:
    json.dump(user_finishes, file, indent=4)

with open("stats_data/empty_leaderboards.json", "w") as file:
    json.dump(empty_leaderboards, file, indent=4)

with open("stats_data/sorted_leaderboard_records.json", "w") as file:
    json.dump(sorted_leaderboard, file, indent=4)

with open("stats_data/leaderboard_levels.json", "w") as file:
    json.dump(data, file, indent=4)

with open("stats_data/sole_victors.json", "w") as file:
    json.dump(sole_victors, file, indent=4)