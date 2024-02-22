import json
import requests

SERVER_URL = "https://api.slin.dev/grab/v1/"
FORMAT_VERSION = "100"

def get_level_leaderboard(level_identifier):
    leaderboard_url = f"{SERVER_URL}statistics_top_leaderboard/{level_identifier.replace(':', '/')}"
    print(leaderboard_url)
    return requests.get(leaderboard_url).json()

def get_level_list(type):
    list_url = f"{SERVER_URL}list?max_format_version={FORMAT_VERSION}&type={type}"
    print(list_url)
    return requests.get(list_url).json()

def get_level_browser():
    browser_url = f"{SERVER_URL}get_level_browser?version=1"
    return requests.get(browser_url).json()

def find_list_keys(data):
    list_keys = []
    
    if isinstance(data, dict):
        if "list_key" in data:
            list_keys.append(data["list_key"])
        
        for key, value in data.items():
            list_keys.extend(find_list_keys(value))
    elif isinstance(data, list):
        for item in data:
            list_keys.extend(find_list_keys(item))
    
    return list_keys

def get_best_of_grab():
    level_browser = get_level_browser()
    all_list_keys = find_list_keys(level_browser)
    levels = []
    for list_key in all_list_keys:
        if list_key.startswith("curated_"):
            levels_list = get_level_list(list_key)
            for level in levels_list:
                level["list_key"] = list_key
                leaderboard = get_level_leaderboard(level["identifier"])
                level["leaderboard"] = leaderboard
            for level in levels_list:
                found = False
                for level2 in levels:
                    if level2["identifier"] == level["identifier"]:
                        found = True
                        level2["list_key"] = level2["list_key"] + ":" + level["list_key"]
                        break
                if not found:
                    levels.append(level)
    return levels

def update_best_of_grab():
    levels = get_best_of_grab()
    write_json_file('stats_data/best_of_grab.json', levels)

def write_json_file(filename, data):
    with open(filename, 'w') as file:
        json.dump(data, file, indent=2)

if __name__ == "__main__":
    update_best_of_grab()
