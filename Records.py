import json, requests, contextlib

with open("stats_data/all_verified.json") as file:
    data = json.load(file)

difficulty_records = {
    "unrated": {},
    "easy": {},
    "medium": {},
    "hard": {},
    "veryhard": {},
    "impossible": {}
}
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
        level_diff = "unrated"
        if "statistics" in level:
            if "difficulty_string" in level["statistics"]:
                level_diff = level["statistics"]["difficulty_string"]
        for record in res_data:
            if record["user_id"] not in difficulty_records[level_diff]:
                difficulty_records[level_diff][record["user_id"]] = [0, record["user_name"]]
            difficulty_records[level_diff][record["user_id"]][0] += 1
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
    
with open("stats_data/difficulty_records.json", "w") as file:
    json.dump(difficulty_records, file, indent=4)