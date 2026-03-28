import sys
import json
import requests


server_token_headers = json.loads(sys.argv[1])

def get_level_stats(level_identifier):
    stats_url = (
        f"https://api.slin.dev/grab/v1/statistics/{level_identifier.replace(':', '/')}"
    )
    print(stats_url)
    stats_request = requests.get(stats_url, headers=server_token_headers)
    if stats_request.status_code == 200:
        response = stats_request.json()
        return response
    else:
        print("ERROR: INVALID RESPONSE FROM SERVER")
        return {}


statistics = {}

with open("stats_data/all_verified.json") as file:
    data = json.load(file)

for level in data:
    identifier = level["identifier"]
    try:
        stats = get_level_stats(identifier)
        statistics[identifier] = stats
    except Exception:
        continue

with open("stats_data/statistics.json", "w") as file:
    json.dump(statistics, file)
