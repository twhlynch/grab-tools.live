import json
import requests
import contextlib
from concurrent.futures import ThreadPoolExecutor

def process_level(level):
    identifier = level["identifier"].replace(":", "/")
    url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{identifier}"
    res_data = []
    with contextlib.suppress(Exception):
        res_data = requests.get(url).json()
    
    if len(res_data) != 0:
        print(f"Parsing leaderboard of {len(res_data)} results for {level['title']}")
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
        difficulty_lengths[level_diff] += 1
        for record in res_data:
            if record["user_id"] not in difficulty_records[level_diff]:
                difficulty_records[level_diff][record["user_id"]] = {
                    "maps": 0, 
                    "user_name": record["user_name"]
                }
            difficulty_records[level_diff][record["user_id"]]["maps"] += 1
    else:
        empty_leaderboards.append(level)
    
    first_record = None
    first_timestamp = 9999999999999
    for record in res_data:
        if int(record["timestamp"]) < first_timestamp:
            first_timestamp = int(record["timestamp"])
            first_record = record
        if record["user_id"] not in user_finishes:
            user_finishes[record["user_id"]] = [0, record["user_name"], 0]
        user_finishes[record["user_id"]][0] += 1
        user_finishes[record["user_id"]][2] += record["best_time"]
        
    if first_record is not None:
        if first_record["user_id"] not in first_to_beat:
            first_to_beat[first_record["user_id"]] = [
                first_record["user_name"], 
                0
            ]
        first_to_beat[first_record["user_id"]][1] += 1
    
    print(f"Processed {level['title']}")

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
difficulty_lengths = {
    "unrated": 0,
    "easy": 0,
    "medium": 0,
    "hard": 0,
    "veryhard": 0,
    "impossible": 0,
    "total": 0
}
leaderboard = {}
empty_leaderboards = []
sole_victors = []
user_finishes = {}
first_to_beat = {}
difficulty_lengths["total"] = len(data)

with ThreadPoolExecutor() as executor:
    futures = [executor.submit(process_level, level) for level in data]

    for future in futures:
        future.result()

sorted_leaderboard = dict(sorted(leaderboard.items(), key=lambda x: x[1][0], reverse=True))

with open("stats_data/user_finishes.json", "w") as file:
    json.dump(user_finishes, file)

with open("stats_data/empty_leaderboards.json", "w") as file:
    json.dump(empty_leaderboards, file)

with open("stats_data/sorted_leaderboard_records.json", "w") as file:
    json.dump(sorted_leaderboard, file)

with open("stats_data/leaderboard_levels.json", "w") as file:
    json.dump(data, file)

with open("stats_data/sole_victors.json", "w") as file:
    json.dump(sole_victors, file)

with open("stats_data/difficulty_records.json", "w") as file:
    json.dump(difficulty_records, file)

with open("stats_data/difficulty_lengths.json", "w") as file:
    json.dump(difficulty_lengths, file)

with open("stats_data/first_to_beat.json", "w") as file:
    json.dump(first_to_beat, file)