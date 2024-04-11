import json, requests, contextlib

with open("stats_data/all_verified.json") as file:
    data = json.load(file)
    
def get_level_stats(level_identifier):
    stats_url = f"https://api.slin.dev/grab/v1/statistics/{level_identifier.replace(':', '/')}"
    print(stats_url)
    stats_request = requests.get(stats_url)
    if stats_request.status_code == 200:
        response = stats_request.json()
        return response
    else:
        print("ERROR: INVALID RESPONSE FROM SERVER")
        return {}

for level in data:
    identifier = level["identifier"]
    stats = get_level_stats(identifier)
    level["stats"] = stats
    
tipping = sorted(data, key=lambda x: x["stats"]["tipped_amount"], reverse=True)

with open("stats_data/tipping.json", "w") as file:
    json.dump(tipping, file, indent=4)