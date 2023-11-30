import json, requests, contextlib

with open("stats_data/all_verified.json") as file:
    data = json.load(file)
  
leaderboard = {}
for i, level in enumerate(data, start=1):
    identifier = level["identifier"].replace(":", "/")
    url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{identifier}"
    with contextlib.suppress(Exception):
        res_data = requests.get(url).json()
    if len(res_data) != 0:
        level["leaderboard"] = res_data
        iteration = 0
        if res_data[0]["user_name"] == "EvildragonVR":
            iteration = 1
        if len(res_data) > iteration:
            if res_data[iteration]["user_name"] not in leaderboard:
                leaderboard[res_data[iteration]["user_name"]] = [0, []]
            leaderboard[res_data[iteration]["user_name"]][0] += 1
            leaderboard[res_data[iteration]["user_name"]][1].append([level["title"] + "|" + level["identifier"]])
    print(i)
    i += 1

sorted_leaderboard = dict(sorted(leaderboard.items(), key=lambda x: x[1][0], reverse=True))

with open("stats_data/sorted_leaderboard_records.json", "w") as file:
    json.dump(sorted_leaderboard, file, indent=4)

with open("stats_data/leaderboard_levels.json", "w") as file:
    json.dump(data, file, indent=4)
