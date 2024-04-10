import json, random, requests, sys, discord, math
from datetime import datetime, date, timedelta

SERVER_URL = "https://api.slin.dev/grab/v1/"
PAGE_URL = "https://grab-tools.live/"
VIEWER_URL = "https://grabvr.quest/levels/viewer/"
FORMAT_VERSION = "100"

def get_all_verified(stamp=''):
    verified = []
    while True:
        url = f"{SERVER_URL}list?max_format_version={FORMAT_VERSION}&type=ok&page_timestamp={stamp}"
        data = requests.get(url).json()
        print(len(data), "to", len(verified))
        duplicate = False
        for level in data:
            for item in verified:
                if item["identifier"] == level["identifier"]:
                    print("Duplicate found")
                    level["identifier"] = "DUPLICATE"
                    duplicate = True
            if "creators" in level:
                level["creator"] = level["creators"][0]
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
        for level in data:
            if level["identifier"] != "DUPLICATE":
                verified.append(level)
        if duplicate:
            break
        if data[-1].get("page_timestamp"):
            stamp = data[-1]["page_timestamp"]
        else:
            break
    return verified


data = get_all_verified()
print(len(data))