import json, requests

with open("public/stats_data/all_verified.json") as file:
    data = json.load(file)
  
leaderboard = {}
i = 1
for level in data:
    id = level["identifier"].replace(":", "/")
    url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{id}"
    res_data = requests.get(url).json()
    if len(res_data) != 0:
        if res_data[0]["user_name"] not in leaderboard:
            leaderboard[res_data[0]["user_name"]] = [0, []]
        leaderboard[res_data[0]["user_name"]][0] += 1
        leaderboard[res_data[0]["user_name"]][1].append([level["title"]])
    print(i)
    i += 1

sorted_leaderboard = dict(sorted(leaderboard.items(), key=lambda x: x[1][0], reverse=True))

with open("public/stats_data/sorted_leaderboard_records.json", "w") as file:
    json.dump(sorted_leaderboard, file, indent=4)
