import json, random, requests, time, sys
from datetime import datetime, date
import discord
from discord.ext import commands
from discord import Embed

def write_json_file(filename, data):
    with open(filename, 'w') as file:
        json.dump(data, file, indent=2)

def timestamp_to_age(timestamp_in_milliseconds):
    time_elapsed_in_seconds = int((datetime.now().timestamp() * 1000 - timestamp_in_milliseconds) / 1000)
    time_elapsed_in_minutes = time_elapsed_in_seconds / 60
    time_elapsed_in_hours = time_elapsed_in_minutes / 60
    time_elapsed_in_days = time_elapsed_in_hours / 24
    if time_elapsed_in_days > 0:
        return f"{time_elapsed_in_days} days"
    elif time_elapsed_in_hours > 0:
        return f"{time_elapsed_in_hours} hours"
    elif time_elapsed_in_minutes > 0:
        return f"{time_elapsed_in_minutes} minutes"
    else:
        return f"{time_elapsed_in_seconds} seconds"

def get_all_verified(stamp=''):
    verified = []
    while True:
        url = f"https://api.slin.dev/grab/v1/list?max_format_version=100&type=ok&page_timestamp={stamp}"
        data = requests.get(url).json()
        for level in data:
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
        print("Sending request")
        verified.extend(data)
        if data[-1].get("page_timestamp"):
            stamp = data[-1]["page_timestamp"]
        else:
            break
    return verified

def get_unbeaten(data):
    unbeaten = []
    for level in data:
        age = timestamp_to_age(level["creation_timestamp"])
        if level["statistics"]["difficulty"] == 0 and "days" in age and level["statistics"]["total_played"] > 300:
            url = f"https://api.slin.dev/grab/v1/statistics/{level['identifier'].replace(':', '/')}"
            stats = requests.get(url).json()
            print("Sending request")
            if stats["finished_count"] == 0:
                new_data = {
                    "plays": str(stats["total_played_count"]),
                    "link": f"https://grabvr.quest/levels/viewer?level={level['identifier']}",
                    "title": level["title"],
                    "age": age,
                    "creators": level["creators"]
                }
                unbeaten.append(new_data)
    return unbeaten[::-1]

def get_most_verified(data):
    most_verified = {}
    for level in data:
        id = level["identifier"].split(":")[0]
        if id in most_verified:
            most_verified[id]["count"] += 1
        else:
            most_verified[id] = {"count": 1}
    most_verified = sorted(most_verified.items(), key=lambda x: x[1]["count"], reverse=True)
    sub10 = most_verified[10:]
    sub10 = {t[0]: t[1] for t in sub10}
    most_verified = most_verified[:10]
    most_verified = {t[0]: t[1] for t in most_verified}
    for i, (id, data) in enumerate(most_verified.items()):
        url = f"https://api.slin.dev/grab/v1/get_user_info?user_id={id}"
        user_data = requests.get(url).json()
        print("Sending request")
        most_verified[id]["user_name"] = user_data["user_name"]
        most_verified[id]["levels"] = user_data["user_level_count"]
    for i, (id, data2) in enumerate(sub10.items()):
        for level in data:
            if level.identifier.contains(id):
                sub10[id]["user_name"] = level.creator + "?"
        sub10[id]["levels"] = sub10[id]["count"]
    return most_verified.update(sub10)

def get_most_plays(data):
    most_plays = {}
    for level in data:
        id = level["identifier"].split(":")[0]
        if id in most_plays:
            most_plays[id]["plays"] += level["statistics"]["total_played"]
            most_plays[id]["count"] += 1
        else:
            most_plays[id] = {"plays": level["statistics"]["total_played"], "count": 1}
    most_plays = sorted(most_plays.items(), key=lambda x: x[1]["plays"], reverse=True)
    most_plays = most_plays[:10]
    most_plays = {t[0]: t[1] for t in most_plays}
    for i, (id, data) in enumerate(most_plays.items()):
        url = f"https://api.slin.dev/grab/v1/get_user_info?user_id={id}"
        user_data = requests.get(url).json()
        print("Sending request")
        most_plays[id]["user_name"] = user_data["user_name"]
        most_plays[id]["levels"] = user_data["user_level_count"]
    return most_plays

def get_most_played_maps(data):
    most_played_maps = sorted(data[25:], key=lambda x: x["statistics"]["total_played"], reverse=True)
    most_played_maps = most_played_maps[:100]
    return most_played_maps

def get_longest_times(data):
    longest_times = sorted(data[25:], key=lambda x: x["statistics"]["time"], reverse=True)
    longest_times = longest_times[:100]
    return longest_times

def get_most_liked(data):
    most_liked = sorted(data[100:], key=lambda x: (x["statistics"]["liked"], -x["creation_timestamp"]), reverse=True)
    most_liked = most_liked[:100]
    return most_liked

def get_daily_winner():
    with open("public/stats_data/map_winners.json", 'r') as winners, open("public/stats_data/daily_map.json", "r") as map, open("public/stats_data/user_blacklist.json", "r") as blacklist:
        map_json = json.load(map)
        id = map_json["identifier"]
        url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{id.replace(':', '/')}"
        winner_list = requests.get(url).json()
        print(winner_list)
        blacklist_data = json.loads(blacklist.read())
        for i in range(min(len(winner_list), 3)):
            if winner_list[i]["user_name"] in blacklist_data:
                winner_list.pop(i)
        if len(winner_list) == 0:
            return
        if len(winner_list) == 1:
            winner = [winner_list[0]]
        if len(winner_list) == 2:
            winner = [winner_list[0], winner_list[1]]
        if len(winner_list) >= 3:    
            winner = [winner_list[0], winner_list[1], winner_list[2]]
        winners_json = json.loads(winners.read())
        winners_json.append([winner, map_json, int(time.time()), "daily_map"])
    write_json_file('public/stats_data/map_winners.json', winners_json)

def get_weekly_winner():
    with open("public/stats_data/map_winners.json", 'r') as winners, open("public/stats_data/weekly_map.json", "r") as map, open("public/stats_data/user_blacklist.json", "r") as blacklist:
        map_json = json.load(map)
        id = map_json["identifier"]
        url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{id.replace(':', '/')}"
        winner_list = requests.get(url).json()
        blacklist_data = json.loads(blacklist.read())
        for i in range(len(winner_list)):
            if winner_list[i]["user_name"] in blacklist_data:
                winner_list.pop(i)
        if len(winner_list) == 0:
            return
        if len(winner_list) == 1:
            winner = [winner_list[0]]
        if len(winner_list) == 2:
            winner = [winner_list[0], winner_list[1]]
        if len(winner_list) >= 3:    
            winner = [winner_list[0], winner_list[1], winner_list[2]]
        winners_json = json.loads(winners.read())
        winners_json.append([winner, map_json, int(time.time()), "weekly_map"])
    write_json_file('public/stats_data/map_winners.json', winners_json)

def get_unbeaten_winner():
    with open("public/stats_data/map_winners.json", 'r') as winners, open("public/stats_data/unbeaten_map.json", "r") as map:
        map_json = json.load(map)
        id = map_json["link"].split('=')[1]
        url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{id.replace(':', '/')}"
        winnerList = requests.get(url).json()
        if len(winnerList) == 0:
            return
        if len(winnerList) == 1:
            winner = [winnerList[0]]
        if len(winnerList) == 2:
            winner = [winnerList[0], winnerList[1]]
        if len(winnerList) >= 3:    
            winner = [winnerList[0], winnerList[1], winnerList[2]]
        winners_json = json.loads(winners.read())
        winners_json.append([winner, map_json, int(time.time()), "unbeaten_map"])
    write_json_file('public/stats_data/map_winners.json', winners_json)

def get_daily_map(all_data):
    with open("public/stats_data/next_up.json") as data_file:
        data = json.load(data_file)
    if data["daily"] != False:
        with open("public/stats_data/next_up.json", "w") as data_file:
            new_data = data.copy()
            new_data["daily"] = False
            json.dump(new_data, data_file)
        return data["daily"]
    maps = sorted(all_data, key=lambda x: x["update_timestamp"], reverse=True)
    filtered_maps = [e for e in maps if (e["statistics"]["time"] <= 100 and e["statistics"]["time"] >= 3)]
    weights = []
    for i in range(len(filtered_maps)):
        weights.append(filtered_maps[i]["update_timestamp"]/(i+1))
    level_data = random.choices(filtered_maps, weights, k=1)
    return level_data[0]

def get_weekly_map(all_data):
    with open("public/stats_data/next_up.json") as data_file:
        data = json.load(data_file)
    if data["weekly"] != False:
        with open("public/stats_data/next_up.json", "w") as data_file:
            new_data = data.copy()
            new_data["weekly"] = False
            json.dump(new_data, data_file)
        return data["weekly"]
    maps = sorted(all_data, key=lambda x: x["statistics"]["difficulty"])
    weights = []
    for i in range(len(maps)):
        weights.append((1 - maps[i]["statistics"]["difficulty"])/(i+1))
    level_data = random.choices(maps, weights, k=1)
    return level_data[0]

def get_unbeaten_map():
    with open("public/stats_data/unbeaten_levels.json") as data_file:
        data = json.load(data_file)
    filtered_data = [e for e in data if float(e["age"].split(" ")[0]) >= 50]
    level_data = random.choice(filtered_data)
    return level_data

def get_level_data():
    message_result = [False, False, False]
    with open("public/stats_data/log_data.json", 'r') as file:
        log_data = json.load(file)
    if datetime.now().timestamp() - log_data["last_ran"] > 72000:
        all_verified = get_all_verified()
        write_json_file('public/stats_data/all_verified.json', all_verified)
        most_played_maps = get_most_played_maps(all_verified)
        write_json_file('public/stats_data/most_played_maps.json', most_played_maps)
        most_liked = get_most_liked(all_verified)
        write_json_file('public/stats_data/most_liked.json', most_liked)
        longest_times = get_longest_times(all_verified)
        write_json_file('public/stats_data/longest_times.json', longest_times)
        get_daily_winner()
        daily_level = get_daily_map(all_verified)
        message_result[0] = [daily_level["title"], "https://grabvr.quest/levels/viewer?level=" + daily_level["identifier"]]
        write_json_file('public/stats_data/daily_map.json', daily_level)
        get_unbeaten_winner()
        unbeaten_level = get_unbeaten_map()
        message_result[2] = [unbeaten_level["title"], unbeaten_level["link"]]
        write_json_file('public/stats_data/unbeaten_map.json', unbeaten_level)
        weekly = log_data["days_since_weekly"] + 1
        if weekly == 7:
            get_weekly_winner()
            weekly_level = get_weekly_map(all_verified)
            message_result[1] = [weekly_level["title"], "https://grabvr.quest/levels/viewer?level=" + weekly_level["identifier"]]
            write_json_file('public/stats_data/weekly_map.json', weekly_level)
            weekly = 0
        did_players = False
        did_unbeaten = False
        if not log_data["unbeaten_levels"]:
            unbeaten_levels = get_unbeaten(all_verified)
            write_json_file('public/stats_data/unbeaten_levels.json', unbeaten_levels)
            did_unbeaten = True
            if not log_data["players"]:
                most_verified = get_most_verified(all_verified)
                write_json_file('public/stats_data/most_verified.json', most_verified)
                most_plays = get_most_plays(all_verified)
                write_json_file('public/stats_data/most_plays.json', most_plays)
                did_players = True

        log(did_players, did_unbeaten, weekly)
        run_bot(message_result)

def log(players, unbeaten_levels, weekly):
    log_data = {
        "days_since_weekly": weekly,
        "last_ran": datetime.now().timestamp(),
        "players": players,
        "unbeaten_levels": unbeaten_levels
    }
    write_json_file('public/stats_data/log_data.json', log_data)

async def get_challenge_scores():
    with open('public/stats_data/map_winners.json') as file_data:
        items = json.load(file_data)

    leaderboard = {}

    for item in items:
        if len(item[0]) > 0:
            user_id = item[0][0]['user_id']
            user_name = item[0][0]['user_name']

            if user_id not in leaderboard:
                leaderboard[user_id] = [user_name, 0, user_id]

            if item[3] == 'daily_map':
                leaderboard[user_id][1] += 3
            elif item[3] == 'weekly_map':
                leaderboard[user_id][1] += 10
            elif item[3] == 'unbeaten_map':
                leaderboard[user_id][1] += 2
                age = float(item[1]['age'].split(' ')[0])
                leaderboard[user_id][1] += age // 50

        if len(item[0]) > 1:
            user_id = item[0][1]['user_id']
            user_name = item[0][1]['user_name']

            if user_id not in leaderboard:
                leaderboard[user_id] = [user_name, 0, user_id]

            if item[3] == 'daily_map':
                leaderboard[user_id][1] += 2
            elif item[3] == 'weekly_map':
                leaderboard[user_id][1] += 7
            elif item[3] == 'unbeaten_map':
                leaderboard[user_id][1] += 1
                age = float(item[1]['age'].split(' ')[0])
                leaderboard[user_id][1] += age // 100

        if len(item[0]) > 2:
            user_id = item[0][2]['user_id']
            user_name = item[0][2]['user_name']

            if user_id not in leaderboard:
                leaderboard[user_id] = [user_name, 0, user_id]

            if item[3] == 'daily_map':
                leaderboard[user_id][1] += 1
            elif item[3] == 'weekly_map':
                leaderboard[user_id][1] += 3
            elif item[3] == 'unbeaten_map':
                leaderboard[user_id][1] += 1

    leaderboard = dict(sorted(leaderboard.items(), key=lambda x: x[1][1], reverse=True))

    embed = discord.Embed(title='Map Challenges Leaderboard', url="https://grab-tools.live/stats.html", description=str(date.today()), color=0x00ffff)
    count = 0
    for value in leaderboard.values():
        if count >= 25:
            break
        embed.add_field(name=f'{value[0]} - {value[1]} Pt', value='\u200B', inline=False)
        count += 1

    return embed


def run_bot(message):

    intents = discord.Intents.default()
    bot = commands.Bot(command_prefix='!', intents=intents)

    @bot.event
    async def on_ready():

        print(f'Bot connected as {bot.user.name}')
        channel = bot.get_channel(1110435431750828132)
        guild = bot.get_guild(1048213818775437394)
        role = guild.get_role(1110735575083929622)

        embed = Embed(title="Daily/Weekly Maps Update", url="https://grab-tools.live/stats.html", description="Daily Update", color=0x00ffff)
        if message[0]:
            embed.add_field(name="Daily", value=f"[{message[0][0]}]({message[0][1]})")
        if message[1]:
            embed.add_field(name="Weekly", value=f"[{message[1][0]}]({message[1][1]})")
        if message[2]:
            embed.add_field(name="Unbeaten", value=f"[{message[2][0]}]({message[2][1]})")

        await channel.send(f"||{role.mention}||")
        await channel.send(embed=embed)
        scores_embed = await get_challenge_scores()
        await channel.send(embed=scores_embed)

        await bot.close()

    bot.run(sys.argv[1])

get_level_data()
