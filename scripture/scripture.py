import json

count = 0
char_width = 0.05
appearance_time = 2
interval = 0.1
active_position = 0
visible_length = 40 
foreward_pos = 1
height = 0

with open("text.txt") as f:
    text = f.read()

level = {
    "formatVersion": 6,
    "title": "New script",
    "creators": ".index",
    "description": "",
    "maxCheckpointCount": 10,
    "ambienceSettings": {
        "skyZenithColor": {
            "r": 0.28,
            "g": 0.476,
            "b": 0.73,
            "a": 1
        },
        "skyHorizonColor": {
            "r": 0.916,
            "g": 0.9574,
            "b": 0.9574,
            "a": 1
        },
        "sunAltitude": 45,
        "sunAzimuth": 315,
        "sunSize": 1,
        "fogDDensity": 0
    },
    "levelNodes": []
}

last_10 = []

def find_char(char):
    for i in range(len(level["levelNodes"])):
        if level["levelNodes"][i]["levelNodeSign"]["text"] == char and i not in last_10:
            return i
    return 0

wants_return = False

for char in text:
    count += 1
    sign_iter = find_char(char)
    if not sign_iter:
        level["levelNodes"].append({
            "levelNodeSign": {
                "position": {
                },
                "rotation": {
                    "w": 1.0
                },
                "text": char
            },
            "animations": [
                {
                    "frames": [
                        {
                            "position": {
                            },
                            "rotation": {
                                "w": 1.0
                            }
                        }
                    ],
                    "name": "idle",
                    "speed": 1
                }
            ]
        })
    sign_iter = find_char(char)
    last_10.append(sign_iter)
    if len(last_10) > appearance_time / interval:
        last_10.pop(0)

    level["levelNodes"][sign_iter]["animations"][0]["frames"].append({
        "position": {
            "z": 1 * foreward_pos,
            "y": height * char_width * -2,
            "x": 1 * active_position * char_width
        },
        "rotation": {
            "w": 1.0
        },
        "time": count * interval
    })

    level["levelNodes"][sign_iter]["animations"][0]["frames"].append({
        "position": {
            "z": 1 * foreward_pos,
            "y": height * char_width * -2,
            "x": 1 * active_position * char_width
        },
        "rotation": {
            "w": 1.0
        },
        "time": count * interval + appearance_time
    })

    level["levelNodes"][sign_iter]["animations"][0]["frames"].append({
        "position": {
        },
        "rotation": {
            "w": 1.0
        },
        "time": count * interval + appearance_time
    })

    active_position += 1
    if active_position > visible_length:
        wants_return = True
    if wants_return and char == " ":
        active_position = 0
        height += 1
        wants_return = False

for i in range(len(level["levelNodes"])):
    level["levelNodes"][i]["animations"][0]["frames"].append({
        "position": {
            "x": 0,
            "y": 0,
            "z": 0
        },
        "rotation": {
            "w": 1.0
        },
        "time": count * interval + appearance_time + 1
    })

with open("text_level.json", "w") as f:
    json.dump(level, f, indent=4)