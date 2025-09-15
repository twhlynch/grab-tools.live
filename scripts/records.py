import json
import requests
import contextlib
from concurrent.futures import ThreadPoolExecutor


API = "https://api.slin.dev/grab/v1/"

difficulty_records = {
    "unrated": {},
    "easy": {},
    "medium": {},
    "hard": {},
    "veryhard": {},
    "impossible": {},
}
difficulty_lengths = {
    "unrated": 0,
    "easy": 0,
    "medium": 0,
    "hard": 0,
    "veryhard": 0,
    "impossible": 0,
    "total": 0,
}
leaderboard = {}
sole_victors = []
user_finishes = {}
first_to_beat = {}
timestamps_data = []


def get_leaderboard(identifier):
    identifier = identifier.replace(":", "/")

    url = f"{API}statistics_top_leaderboard/{identifier}"

    leaderboard = []
    with contextlib.suppress(Exception):
        leaderboard = requests.get(url).json()

    filtered_leaderboard = [
        entry for entry in leaderboard if "is_verification" not in entry
    ]

    length = len(filtered_leaderboard)
    print(f"{length} entries for {identifier}")

    return filtered_leaderboard


def save(filepath, data):
    print(f"Saving {filepath}")

    with open(f"stats_data/{filepath}.json", "w") as file:
        json.dump(data, file)


def process_level(level):
    title = level["title"] if "title" in level else ""
    identifier = level["identifier"] if "identifier" in level else None
    statistics = level["statistics"] if "statistics" in level else {}

    if identifier is None:
        return

    print(f"Processing {title}")

    leaderboard_data = get_leaderboard(identifier)

    length = len(leaderboard_data)

    if length != 0:
        level["leaderboard"] = leaderboard_data

        # sole = only 1 record
        if length == 1:
            sole_victors.append(level)

        # add record holder
        record_holder = leaderboard_data[0]["user_id"]
        if record_holder not in leaderboard:
            leaderboard[record_holder] = [0, [], leaderboard_data[0]["user_name"]]

        leaderboard[record_holder][0] += 1
        leaderboard[record_holder][1].append(
            [title + "|" + identifier]
        )  # TODO: why did i add the title here

        # difficulty
        difficulty_string = (
            statistics["difficulty_string"]
            if "difficulty_string" in statistics
            else "unrated"
        )
        difficulty_lengths[difficulty_string] += 1

        # finishes
        for record in leaderboard_data:
            user_id = record["user_id"] if "user_id" in record else None
            timestamp = record["timestamp"] if "timestamp" in record else None

            if user_id is None:
                continue

            # timestamp data
            if timestamp is not None:
                timestamp_id = int(int(timestamp) / 100)
                timestamps_data.append(f"{user_id}:{timestamp_id}")

            # difficulty records
            diff_records = difficulty_records[difficulty_string]
            if user_id not in diff_records:
                diff_records[user_id] = {
                    "maps": 0,
                    "user_name": record["user_name"],
                }
            diff_records[user_id]["maps"] += 1

    # first person to complete (in top 100)
    first_record = None
    first_timestamp = float('inf') # wtf is this syntax

    # all user stats
    for record in leaderboard_data:
        current_timestamp = record["timestamp"]
        user_id = record["user_id"]

        if int(current_timestamp) < first_timestamp:
            first_timestamp = int(current_timestamp)
            first_record = record

        # total finishes
        if user_id not in user_finishes:
            user_finishes[user_id] = [0, record["user_name"], 0]
        user_finishes[user_id][0] += 1

        try:
            user_finishes[user_id][2] += (
                record["best_time"] if "best_time" in record else 0
            )
        except TypeError: # FIXME: what caused this?
            print(user_finishes[user_id])

    # first person to complete
    if first_record is not None:
        first_user_id = first_record["user_id"]
        first_user_name = first_record["user_name"]

        if first_user_id not in first_to_beat:
            first_to_beat[first_user_id] = [first_user_name, 0]
        first_to_beat[first_user_id][1] += 1

    print(f"Processed {title}")


with open("stats_data/all_verified.json") as file:
    levels = json.load(file)

difficulty_lengths["total"] = len(levels)

# process all data
with ThreadPoolExecutor() as executor:
    futures = [executor.submit(process_level, level) for level in levels]

    for future in futures:
        future.result()

# clean, sort, and slice
leaderboard = {user: scores for user, scores in leaderboard.items() if scores[0] >= 10}
sorted_leaderboard = dict(
    sorted(leaderboard.items(), key=lambda x: x[1][0], reverse=True)
)

for difficulty in difficulty_records:
    difficulty_records[difficulty] = {
        user_key: records
        for user_key, records in difficulty_records[difficulty].items()
        if records["maps"] >= 10
    }

    difficulty_records[difficulty] = dict(
        sorted(
            difficulty_records[difficulty].items(),
            key=lambda x: x[1]["maps"],
            reverse=True,
        )[:200]
    )

user_finishes = {
    key: [finishes[0], finishes[1], round(finishes[2], 2)]
    for key, finishes in user_finishes.items()
    if finishes[0] >= 10
}
user_finishes = dict(
    sorted(user_finishes.items(), key=lambda x: x[1][0], reverse=True)[:200]
)

first_to_beat = {key: beats for key, beats in first_to_beat.items() if beats[1] >= 10}
first_to_beat = dict(
    sorted(first_to_beat.items(), key=lambda x: x[1][1], reverse=True)[:200]
)

save("user_finishes", user_finishes)
save("sorted_leaderboard_records", sorted_leaderboard)
save("sole_victors", sole_victors)
save("difficulty_records", difficulty_records)
save("difficulty_lengths", difficulty_lengths)
save("first_to_beat", first_to_beat)
save("timestamps_data", timestamps_data)
