import requests, json

def getLevels(stamp=''):
    all_levels = []
    while True:
        url = f"https://api.slin.dev/grab/v1/list?max_format_version=100&page_timestamp={stamp}"
        data = requests.get(url).json()
        print("Sending request")
        all_levels.extend(data)
        if data[-1].get("page_timestamp"):
            stamp = data[-1]["page_timestamp"]
        else:
            break
    return all_levels

def write_json_file(filename, data):
    with open(filename, 'w') as file:
        json.dump(data, file, indent=2)

if __name__ == "__main__":
    data = getLevels()
    data1 = data[:len(data)//2]
    data2 = data[len(data)//2:]
    write_json_file("stats_data/all_levels1.json", data1)
    write_json_file("stats_data/all_levels2.json", data2)