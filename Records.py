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
            if "timestamp" in record:
                timestamps_data.append(f"{record["user_id"] if "user_id" in record else ""}:{int(int(record["timestamp"]) / 100)}")
            if record["user_id"] not in difficulty_records[level_diff]:
                difficulty_records[level_diff][record["user_id"]] = {
                    "maps": 0, 
                    "user_name": record["user_name"]
                }
            difficulty_records[level_diff][record["user_id"]]["maps"] += 1
    
    first_record = None
    first_timestamp = 9999999999999
    for record in res_data:
        if int(record["timestamp"]) < first_timestamp:
            first_timestamp = int(record["timestamp"])
            first_record = record
        if record["user_id"] not in user_finishes:
            user_finishes[record["user_id"]] = [0, record["user_name"], 0]
        user_finishes[record["user_id"]][0] += 1
        try:
            user_finishes[record["user_id"]][2] += record["best_time"] if "best_time" in record else 0
        except TypeError:
            print(user_finishes[record["user_id"]])
        
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
sole_victors = []
user_finishes = {}
first_to_beat = {}
timestamps_data = []
difficulty_lengths["total"] = len(data)

with ThreadPoolExecutor() as executor:
    futures = [executor.submit(process_level, level) for level in data]

    for future in futures:
        future.result()
        
leaderboard = {user: scores for user, scores in leaderboard.items() if scores[0] >= 10}
print("clean leaderboard main")

sorted_leaderboard = dict(sorted(leaderboard.items(), key=lambda x: x[1][0], reverse=True))
print("sorted leaderboard main")

for difficulty in difficulty_records:
    difficulty_records[difficulty] = {user_key: records for user_key, records in difficulty_records[difficulty].items() if records["maps"] >= 10}
    print("clean leaderboard " + difficulty)
    
    difficulty_records[difficulty] = dict(sorted(difficulty_records[difficulty].items(), key=lambda x: x[1]["maps"], reverse=True)[:200])
    print("sorted leaderboard " + difficulty)

user_finishes = {key: [finishes[0], finishes[1], round(finishes[2], 2)] for key, finishes in user_finishes.items() if finishes[0] >= 10}
print("clean leaderboard finishes")

user_finishes = dict(sorted(user_finishes.items(), key=lambda x: x[1][0], reverse=True)[:200])
print("sorted leaderboard finishes")

first_to_beat = {key: beats for key, beats in first_to_beat.items() if beats[1] >= 10}
print("clean leaderboard first to beat")

first_to_beat = dict(sorted(first_to_beat.items(), key=lambda x: x[1][1], reverse=True)[:200])

output_files = {
    "stats_data/user_finishes.json": user_finishes,
    "stats_data/sorted_leaderboard_records.json": sorted_leaderboard,
    # "stats_data/leaderboard_levels.json": data,
    "stats_data/sole_victors.json": sole_victors,
    "stats_data/difficulty_records.json": difficulty_records,
    "stats_data/difficulty_lengths.json": difficulty_lengths,
    "stats_data/first_to_beat.json": first_to_beat,
    "stats_data/timestamps_data.json": timestamps_data
}

for filepath, content in output_files.items():
    with open(filepath, "w") as file:
        json.dump(content, file)

print("All data saved successfully")
