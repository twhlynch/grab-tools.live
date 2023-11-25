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

def get_a_challenge():
    url = "https://api.slin.dev/grab/v1/list?max_format_version=100&type=curated_challenge"
    data = requests.get(url).json()
    print("Sending request")
    user_leaderboard = {}
    for level in data:
        id = level["identifier"]
        lb_url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{id.replace(':', '/')}"
        leaderboard = requests.get(lb_url).json()
        print("Sending request")
        for i in range(min(len(leaderboard), 3)):
            if leaderboard[i]["user_id"] in user_leaderboard:
                user_leaderboard[leaderboard[i]["user_id"]][0] += 3 - i
            else:
                user_leaderboard[leaderboard[i]["user_id"]] = [3 - i, leaderboard[i]["user_name"]]
        for i in range(len(leaderboard)):
            if leaderboard[i]["user_id"] in user_leaderboard:
                user_leaderboard[leaderboard[i]["user_id"]][0] += 1
            else:
                user_leaderboard[leaderboard[i]["user_id"]] = [1, leaderboard[i]["user_name"]]
    user_leaderboard = sorted(user_leaderboard.items(), key=lambda x: x[1][0], reverse=True)
    return user_leaderboard

def get_unbeaten(data):
    unbeaten = []
    for level in data:
        age = timestamp_to_age(level["creation_timestamp"])
        if level["statistics"]["difficulty"] == 0 and "days" in age and level["statistics"]["total_played"] > 300:
            url = f"https://api.slin.dev/grab/v1/statistics/{level['identifier'].replace(':', '/')}"
            stats = requests.get(url).json()
            print("Sending request")
            if stats["finished_count"] == 0:
                if "creators" not in level:
                    level["creators"] = ["?"]
                new_data = {
                    "plays": str(stats["total_played_count"]),
                    "link": f"https://grabvr.quest/levels/viewer?level={level['identifier']}",
                    "title": level["title"],
                    "age": age,
                    "creators": level["creators"]
                }
                unbeaten.append(level)
    return unbeaten[::-1]

def get_most_verified(data, old_data):
    most_verified = {}
    for level in data:
        id = level["identifier"].split(":")[0]
        if id in most_verified:
            most_verified[id]["count"] += 1
        else:
            most_verified[id] = {"count": 1}
    most_verified = sorted(most_verified.items(), key=lambda x: x[1]["count"], reverse=True)
    sub10 = most_verified[10:][:100]
    sub10 = {t[0]: t[1] for t in sub10}
    most_verified = most_verified[:10]
    most_verified = {t[0]: t[1] for t in most_verified}
    for i, (id, data2) in enumerate(most_verified.items()):
        url = f"https://api.slin.dev/grab/v1/get_user_info?user_id={id}"
        user_data = requests.get(url).json()
        print("Sending request")
        most_verified[id]["user_name"] = user_data["user_name"]
        most_verified[id]["levels"] = user_data["user_level_count"]
    for i, (id, data3) in enumerate(sub10.items()):
        for level in data:
            if id == level["identifier"].split(":")[0]:
                if "creator" in level:
                    sub10[id]["user_name"] = level["creator"] + "?"
                else:
                    sub10[id]["user_name"] = "?"
                break
        sub10[id]["levels"] = sub10[id]["count"]
    most_verified.update(sub10)
    for id, data4 in most_verified.items():
        if id in old_data:
            most_verified[id]["change"] = most_verified[id]["count"] - old_data[id]["count"]
        else:
            most_verified[id]["change"] = most_verified[id]["count"]
    return most_verified

def get_most_plays(data, old_data):
    most_plays = {}
    for level in data:
        id = level["identifier"].split(":")[0]
        if id in most_plays:
            most_plays[id]["plays"] += level["statistics"]["total_played"]
            most_plays[id]["count"] += 1
        else:
            creators = [""]
            if "creators" in level and len(level["creators"]) > 0:
                creators = level["creators"]
            most_plays[id] = {"plays": level["statistics"]["total_played"], "count": 1, "potential_user_name": creators[0]+"?"}
    most_plays = sorted(most_plays.items(), key=lambda x: x[1]["plays"], reverse=True)
    potentials = most_plays[10:][:90]
    potentials = {t[0]: t[1] for t in potentials}
    for id in potentials:
        potentials[id]["user_name"] = potentials[id]["potential_user_name"]
        potentials[id]["levels"] = potentials[id]["count"]
    most_plays = most_plays[:10]
    most_plays = {t[0]: t[1] for t in most_plays}
    for i, (id, data) in enumerate(most_plays.items()):
        url = f"https://api.slin.dev/grab/v1/get_user_info?user_id={id}"
        user_data = requests.get(url).json()
        print("Sending request")
        most_plays[id]["user_name"] = user_data["user_name"]
        most_plays[id]["levels"] = user_data["user_level_count"]
    most_plays.update(potentials)
    for id, data in most_plays.items():
        if id in old_data:
            most_plays[id]["change"] = most_plays[id]["plays"] - old_data[id]["plays"]
        else:
            most_plays[id]["change"] = most_plays[id]["plays"]
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
    best = []
    most_liked = sorted(data, key=lambda x: x["statistics"]["liked"] * x["statistics"]["difficulty"] * x["statistics"]["total_played"], reverse=True)
    for map in most_liked:
        if map["statistics"]["total_played"] > 2000 and (map["statistics"]["total_played"] * map["statistics"]["difficulty"]) > 10:
            best.append(map)
    # best.sort(key=lambda x: x["statistics"]["liked"], reverse=True)
    return best[:100]

def get_most_disliked(data):
    worst = []
    least_liked = sorted(data, key=lambda x: x["statistics"]["liked"] * x["statistics"]["difficulty"] * x["statistics"]["total_played"])
    for map in least_liked:
        if map["statistics"]["total_played"] > 2000 and (map["statistics"]["total_played"] * map["statistics"]["difficulty"]) > 10:
            worst.append(map)
    # worst.sort(key=lambda x: x["statistics"]["liked"])
    return worst[:100]

def get_daily_winner():
    with open("stats_data/map_winners.json", 'r') as winners, open("stats_data/daily_map.json", "r") as map, open("stats_data/user_blacklist.json", "r") as blacklist:
        map_json = json.load(map)
        id = map_json["identifier"]
        url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{id.replace(':', '/')}"
        winner_list = requests.get(url).json()
        print(winner_list)
        blacklist_data = json.loads(blacklist.read())
        offset = 0
        for i in range(min(len(winner_list), 3)):
            if winner_list[i - offset]["user_name"] in blacklist_data:
                winner_list.pop(i - offset)
                offset += 1
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
    write_json_file('stats_data/map_winners.json', winners_json)

def get_weekly_winner():
    with open("stats_data/map_winners.json", 'r') as winners, open("stats_data/weekly_map.json", "r") as map, open("stats_data/user_blacklist.json", "r") as blacklist:
        map_json = json.load(map)
        id = map_json["identifier"]
        url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{id.replace(':', '/')}"
        winner_list = requests.get(url).json()
        blacklist_data = json.loads(blacklist.read())
        offset = 0
        for i in range(len(winner_list)):
            print(i)
            if winner_list[i - offset]["user_name"] in blacklist_data:
                winner_list.pop(i - offset)
                offset += 1
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
    write_json_file('stats_data/map_winners.json', winners_json)

def get_unbeaten_winner():
    with open("stats_data/map_winners.json", 'r') as winners, open("stats_data/unbeaten_map.json", "r") as map, open("stats_data/user_blacklist.json", "r") as blacklist:
        map_json = json.load(map)
        id = map_json["identifier"]
        url = f"https://api.slin.dev/grab/v1/statistics_top_leaderboard/{id.replace(':', '/')}"
        winnerList = requests.get(url).json()
        blacklist_data = json.loads(blacklist.read())
        offset = 0
        for i in range(len(winnerList)):
            print(i)
            if winnerList[i - offset]["user_name"] in blacklist_data:
                winnerList.pop(i - offset)
                i += 1
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
    write_json_file('stats_data/map_winners.json', winners_json)

def get_daily_map(all_data):
    with open("stats_data/next_up.json") as data_file:
        data = json.load(data_file)
    if data["daily"] != False:
        with open("stats_data/next_up.json", "w") as data_file:
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
    with open("stats_data/next_up.json") as data_file:
        data = json.load(data_file)
    if data["weekly"] != False:
        with open("stats_data/next_up.json", "w") as data_file:
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
    with open("stats_data/unbeaten_levels.json") as data_file:
        data = json.load(data_file)
    filtered_data = data#[e for e in data if float(e["age"].split(" ")[0]) >= 50]
    level_data = random.choice(filtered_data)
    return level_data

def get_level_data():
    with open("stats_data/most_plays.json") as data_file:
        most_plays_old = json.load(data_file)
    with open("stats_data/most_verified.json") as data_file:
        most_verified_old = json.load(data_file)
    message_result = [False, False, False]
    with open("stats_data/log_data.json", 'r') as file:
        log_data = json.load(file)
    if datetime.now().timestamp() - log_data["last_ran"] > 72000:
        all_verified = get_all_verified()
        write_json_file('stats_data/all_verified.json', all_verified)
        a_challenge = get_a_challenge()
        write_json_file('stats_data/a_challenge.json', a_challenge)
        most_played_maps = get_most_played_maps(all_verified)
        write_json_file('stats_data/most_played_maps.json', most_played_maps)
        most_liked = get_most_liked(all_verified)
        write_json_file('stats_data/most_liked.json', most_liked)
        most_disliked = get_most_disliked(all_verified)
        write_json_file('stats_data/most_disliked.json', most_disliked)
        longest_times = get_longest_times(all_verified)
        write_json_file('stats_data/longest_times.json', longest_times)
        get_daily_winner()
        daily_level = get_daily_map(all_verified)
        message_result[0] = [daily_level["title"], "https://grabvr.quest/levels/viewer?level=" + daily_level["identifier"]]
        write_json_file('stats_data/daily_map.json', daily_level)
        get_unbeaten_winner()
        unbeaten_level = get_unbeaten_map()
        message_result[2] = [unbeaten_level["title"], "https://grabvr.quest/levels/viewer/?level="+unbeaten_level["identifier"]]
        write_json_file('stats_data/unbeaten_map.json', unbeaten_level)
        weekly = log_data["days_since_weekly"] + 1
        if weekly == 7:
            get_weekly_winner()
            weekly_level = get_weekly_map(all_verified)
            message_result[1] = [weekly_level["title"], "https://grabvr.quest/levels/viewer?level=" + weekly_level["identifier"]]
            write_json_file('stats_data/weekly_map.json', weekly_level)
            weekly = 0
        unbeaten_levels = get_unbeaten(all_verified)
        write_json_file('stats_data/unbeaten_levels.json', unbeaten_levels)
        most_verified = get_most_verified(all_verified, most_verified_old)
        write_json_file('stats_data/most_verified.json', most_verified)
        most_plays = get_most_plays(all_verified, most_plays_old)
        write_json_file('stats_data/most_plays.json', most_plays)

        log(weekly)
        run_bot(message_result, unbeaten_levels)

def log(weekly):
    log_data = {
        "days_since_weekly": weekly,
        "last_ran": datetime.now().timestamp()
    }
    write_json_file('stats_data/log_data.json', log_data)

async def get_challenge_scores():
    with open('stats_data/map_winners.json') as file_data:
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


def run_bot(message, unbeaten_levels=[]):

    intents = discord.Intents.default()
    bot = commands.Bot(command_prefix='!', intents=intents)

    @bot.event
    async def on_ready():
        # Challenges
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

        # Unbeaten
        if len(unbeaten_levels) > 0:
            channel = bot.get_channel(1144060608937996359)
            role = guild.get_role(1077411286696087664)

            embed = Embed(title="Unbeaten Levels Update", url="https://grab-tools.live/stats.html", description="Unbeaten Update", color=0x00ffff)
            embed.add_field(name="Count", value=str(len(unbeaten_levels)))
            
            over_100 = []

            for level in unbeaten_levels:
                if int(timestamp_to_age(level["update_timestamp"]).split(" ")[0]) >= 100:
                    over_100.append(level)
                
            if len(over_100) > 0:
                embed.add_field(name="Over 100 Days", value="\n".join([f"{level['title']}" for level in over_100]), inline=False)
                # embed.add_field(name="Over 100 Days", value="\n".join([f"[{level['title']}]({level['link']})" for level in over_100]), inline=False)

            embed.add_field(name="Newest", value=unbeaten_levels[-1]["title"], inline=False)

            await channel.send(f"||{role.mention}||")
            await channel.send(embed=embed)

        await bot.close()

    bot.run(sys.argv[1])

get_level_data()
