import json, requests

with open("public/stats_data/all_verified.json") as file:
    data = json.load(file)
  
leaderboard = {}
i = 1
for level in data:
    id = level["identifier"].replace(":", "/")
    url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{id}"
    try:
        res_data = requests.get(url).json()
    except:
        pass
    if len(res_data) != 0:
        level["leaderboard"] = res_data
        if res_data[0]["user_name"] not in leaderboard:
            leaderboard[res_data[0]["user_name"]] = [0, [], 0]
        leaderboard[res_data[0]["user_name"]][0] += 1
        leaderboard[res_data[0]["user_name"]][1].append([level["title"] + "|" + level["identifier"]])
        for k in res_data:
            if k["user_name"] == "NSKC7":
                leaderboard[res_data[0]["user_name"]][2] += 1
    print(i)
    i += 1

sorted_leaderboard = dict(sorted(leaderboard.items(), key=lambda x: x[1][0], reverse=True))

with open("public/stats_data/sorted_leaderboard_records.json", "w") as file:
    json.dump(sorted_leaderboard, file, indent=4)
