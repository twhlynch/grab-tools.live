import json, random, requests, sys, discord
from datetime import datetime, date
from discord.ext import commands
from discord import Embed

SERVER_URL = "https://api.slin.dev/grab/v1/"
PAGE_URL = "https://grab-tools.live/"
VIEWER_URL = "https://grabvr.quest/levels/viewer/"
FORMAT_VERSION = "100"

def get_level_list(type):
    list_url = f"{SERVER_URL}list?max_format_version={FORMAT_VERSION}&type={type}"
    return requests.get(list_url).json()

def get_user_info(user_identifier):
    user_url = f"{SERVER_URL}get_user_info?user_id={user_identifier}"
    return requests.get(user_url).json()

def get_level_leaderboard(level_identifier):
    leaderboard_url = f"{SERVER_URL}statistics_top_leaderboard/{level_identifier.replace(':', '/')}"
    return requests.get(leaderboard_url).json()

def get_level_stats(level_identifier):
    stats_url = f"{SERVER_URL}statistics/{level_identifier.replace(':', '/')}"
    return requests.get(stats_url).json()

def get_level_browser():
    browser_url = f"{SERVER_URL}get_level_browser?version=1"
    return requests.get(browser_url).json()

def get_user_name(user_identifier, potential_user_name, priority=False):
    with open("stats_data/featured_creators.json") as featured_creators:
        creators = json.load(featured_creators)
        for creator in creators:
            if creator["list_key"].split(":")[1] == user_identifier:
                return creator["title"]
    
    if priority:
        user_data = get_user_info(user_identifier)
        return user_data["user_name"]
    
    return f"{potential_user_name}?"

def write_json_file(filename, data):
    with open(filename, 'w') as file:
        json.dump(data, file, indent=2)

def timestamp_to_days(timestamp_in_milliseconds, now=datetime.now().timestamp() * 1000):
    return (now - timestamp_in_milliseconds) / 1000 / 60 / 60 / 24

def get_all_verified(stamp=''):
    verified = []
    while True:
        url = f"{SERVER_URL}list?max_format_version={FORMAT_VERSION}&type=ok&page_timestamp={stamp}"
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
        verified.extend(data)
        if data[-1].get("page_timestamp"):
            stamp = data[-1]["page_timestamp"]
        else:
            break
    return verified

def get_a_challenge():
    a_challenge_maps = get_level_list("curated_challenge")
    user_leaderboard = {}
    for level in a_challenge_maps:
        identifier = level["identifier"]
        leaderboard = get_level_leaderboard(identifier)
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

def get_creators():
    level_browser = get_level_browser()["sections"]
    best_of_grab = [section for section in level_browser if "title" in section and section["title"] == "Best of GRAB"][0]["sections"]
    return [section for section in best_of_grab if "title" in section and section["title"] == "Featured Creators"][0]["sections"]

def get_unbeaten(all_verified_maps):
    unbeaten = []
    for level in all_verified_maps:
        days_old = timestamp_to_days(level["creation_timestamp"])
        if level["statistics"]["difficulty"] == 0 and days_old > 1 and level["statistics"]["total_played"] > 300:
            stats = get_level_stats(level['identifier'])
            if stats["finished_count"] == 0:
                if "creators" not in level:
                    level["creators"] = ["?"]
                unbeaten.append(level)
    return unbeaten[::-1]

def get_most_verified(all_verified_maps, old_data):
    most_verified = {}

    for level in all_verified_maps:
        user_identifier = level["identifier"].split(":")[0]
        if user_identifier not in most_verified:
            most_verified[user_identifier] = {"count": 0}
        most_verified[user_identifier]["count"] += 1

    most_verified = sorted(most_verified.items(), key=lambda x: x[1]["count"], reverse=True)

    potentials = {t[0]: t[1] for t in most_verified[10:][:190]}
    most_verified = {t[0]: t[1] for t in most_verified[:10]}

    for user_identifier in most_verified:
        user_data = get_user_info(user_identifier)
        most_verified[user_identifier]["user_name"] = user_data["user_name"]
        most_verified[user_identifier]["levels"] = user_data["user_level_count"]

    for user_identifier in potentials:
        for level in all_verified_maps:
            if user_identifier == level["identifier"].split(":")[0]:
                potential_name = ""
                if "creators" in level and level["creators"]:
                    potential_name = level["creators"][0]
                potentials[user_identifier]["user_name"] = get_user_name(user_identifier, potential_name)
                break
        potentials[user_identifier]["levels"] = potentials[user_identifier]["count"]

    most_verified |= potentials

    for user_identifier in most_verified:
        if user_identifier in old_data:
            most_verified[user_identifier]["change"] = most_verified[user_identifier]["count"] - old_data[user_identifier]["count"]
        else:
            most_verified[user_identifier]["change"] = 0

    return most_verified

def get_most_plays(all_verified_maps, old_data):
    most_plays = {}

    for level in all_verified_maps:
        user_identifier = level["identifier"].split(":")[0]
        if user_identifier not in most_plays:
            most_plays[user_identifier] = {"plays": 0, "count": 0}
        most_plays[user_identifier]["plays"] += level["statistics"]["total_played"]
        most_plays[user_identifier]["count"] += 1

    most_plays = sorted(most_plays.items(), key=lambda x: x[1]["plays"], reverse=True)
    potentials = {t[0]: t[1] for t in most_plays[10:][:190]}
    most_plays = {t[0]: t[1] for t in most_plays[:10]}

    for user_identifier in potentials:
        for level in all_verified_maps:
            if user_identifier == level["identifier"].split(":")[0]:
                potential_name = ""
                if "creators" in level and level["creators"]:
                    potential_name = level["creators"][0]
                potentials[user_identifier]["user_name"] = get_user_name(user_identifier, potential_name)
                break
        potentials[user_identifier]["levels"] = potentials[user_identifier]["count"]

    for user_identifier in most_plays:
        user_data = get_user_info(user_identifier)
        most_plays[user_identifier]["user_name"] = user_data["user_name"]
        most_plays[user_identifier]["levels"] = user_data["user_level_count"]

    most_plays |= potentials

    for user_identifier in most_plays:
        if user_identifier in old_data:
            most_plays[user_identifier]["change"] = most_plays[user_identifier]["plays"] - old_data[user_identifier]["plays"]
        else:
            most_plays[user_identifier]["change"] = 0
    return most_plays

def get_most_played_maps(all_verified_maps):
    return sorted(all_verified_maps[25:], key=lambda x: x["statistics"]["total_played"], reverse=True)[:200]

def get_longest_times(all_verified_maps):
    return sorted(all_verified_maps[25:], key=lambda x: x["statistics"]["time"], reverse=True)[:200]

def get_most_liked(all_verified_maps):
    most_liked = sorted(all_verified_maps, key=lambda x: x["statistics"]["liked"] * (1 - x["statistics"]["difficulty"]) * x["statistics"]["total_played"], reverse=True)
    return [map for map in most_liked if map["statistics"]["total_played"] > 2000 and (map["statistics"]["total_played"] * map["statistics"]["difficulty"]) > 10][:200]

def get_most_disliked(all_verified_maps):
    least_liked = sorted(all_verified_maps, key=lambda x: (1 - x["statistics"]["liked"]) * (1 - x["statistics"]["difficulty"]) * x["statistics"]["total_played"], reverse=True)
    return [map for map in least_liked if map["statistics"]["total_played"] > 2000 and (map["statistics"]["total_played"] * map["statistics"]["difficulty"]) > 10][:200]

def get_daily_winner():
    with open("stats_data/map_winners.json") as winners, open("stats_data/daily_map.json") as map, open("stats_data/user_blacklist.json") as blacklist:
        map_json = json.load(map)
        blacklist_data = json.load(blacklist)
        winners_json = json.load(winners)

        winner_list = get_level_leaderboard(map_json["identifier"])
        print(winner_list)
        offset = 0
        for i in range(min(len(winner_list), 3)):
            if winner_list[i - offset]["user_name"] in blacklist_data:
                winner_list.pop(i - offset)
                offset += 1
        winner = winner_list[:3]
        winners_json.append([winner, map_json, int(datetime.now().timestamp()), "daily_map"])
    write_json_file('stats_data/map_winners.json', winners_json)

def get_weekly_winner():
    with open("stats_data/map_winners.json") as winners, open("stats_data/weekly_map.json") as map, open("stats_data/user_blacklist.json") as blacklist:
        map_json = json.load(map)
        blacklist_data = json.load(blacklist)
        winners_json = json.load(winners)

        winner_list = get_level_leaderboard(map_json["identifier"])
        offset = 0
        for i in range(len(winner_list)):
            print(i)
            if winner_list[i - offset]["user_name"] in blacklist_data:
                winner_list.pop(i - offset)
                offset += 1
        winner = winner_list[:3]
        winners_json.append([winner, map_json, int(datetime.now().timestamp()), "weekly_map"])
    write_json_file('stats_data/map_winners.json', winners_json)

def get_unbeaten_winner():
    with open("stats_data/map_winners.json") as winners, open("stats_data/unbeaten_map.json") as map, open("stats_data/user_blacklist.json") as blacklist:
        map_json = json.load(map)
        blacklist_data = json.load(blacklist)
        winners_json = json.load(winners)

        winner_list = get_level_leaderboard(map_json["identifier"])
        offset = 0
        for i in range(len(winner_list)):
            print(i)
            if winner_list[i - offset]["user_name"] in blacklist_data:
                winner_list.pop(i - offset)
                i += 1
        winner = winner_list[:3]
        winners_json.append([winner, map_json, int(datetime.now().timestamp()), "unbeaten_map"])
    write_json_file('stats_data/map_winners.json', winners_json)

def get_daily_map(all_verified_maps):
    with open("stats_data/next_up.json") as data_file:
        data = json.load(data_file)
    if data["daily"] != False:
        with open("stats_data/next_up.json", "w") as data_file:
            new_data = data.copy()
            new_data["daily"] = False
            json.dump(new_data, data_file)
        return data["daily"]
    maps = sorted(all_verified_maps, key=lambda x: x["update_timestamp"], reverse=True)
    filtered_maps = [e for e in maps if (e["statistics"]["time"] <= 100 and e["statistics"]["time"] >= 3)]
    weights = [filtered_maps[i]["update_timestamp"]/(i+1) for i in range(len(filtered_maps))]
    level_data = random.choices(filtered_maps, weights, k=1)
    return level_data[0]

def get_weekly_map(all_verified_maps):
    with open("stats_data/next_up.json") as data_file:
        data = json.load(data_file)
    if data["weekly"] != False:
        with open("stats_data/next_up.json", "w") as data_file:
            new_data = data.copy()
            new_data["weekly"] = False
            json.dump(new_data, data_file)
        return data["weekly"]
    maps = sorted(all_verified_maps, key=lambda x: x["statistics"]["difficulty"])
    weights = [(1 - maps[i]["statistics"]["difficulty"])/(i+1) for i in range(len(maps))]
    level_data = random.choices(maps, weights, k=1)
    return level_data[0]

def get_unbeaten_map():
    with open("stats_data/unbeaten_levels.json") as data_file:
        data = json.load(data_file)
    return random.choice(data)

def get_level_data():
    with open("stats_data/log_data.json") as log_file:
        log_data = json.load(log_file)
    if datetime.now().timestamp() - log_data["last_ran"] < 60*60*20:
        print("Not running")
        return

    with open("stats_data/most_plays.json") as most_plays_file, open("stats_data/most_verified.json") as most_verified_file:
        most_plays_old = json.load(most_plays_file)
        most_verified_old = json.load(most_verified_file)


    all_verified = get_all_verified()
    unbeaten_levels = get_unbeaten(all_verified)
    write_json_file('stats_data/all_verified.json', all_verified)
    write_json_file('stats_data/a_challenge.json', get_a_challenge())
    write_json_file('stats_data/featured_creators.json', get_creators())
    write_json_file('stats_data/most_played_maps.json', get_most_played_maps(all_verified))
    write_json_file('stats_data/most_liked.json', get_most_liked(all_verified))
    write_json_file('stats_data/most_disliked.json', get_most_disliked(all_verified))
    write_json_file('stats_data/longest_times.json', get_longest_times(all_verified))
    write_json_file('stats_data/unbeaten_levels.json', unbeaten_levels)
    write_json_file('stats_data/most_verified.json', get_most_verified(all_verified, most_verified_old))
    write_json_file('stats_data/most_plays.json', get_most_plays(all_verified, most_plays_old))

    get_daily_winner()
    daily_level = get_daily_map(all_verified)
    daily_anc = [daily_level["title"], f"{VIEWER_URL}?level={daily_level['identifier']}"]
    write_json_file('stats_data/daily_map.json', daily_level)

    get_unbeaten_winner()
    unbeaten_level = get_unbeaten_map()
    unbeaten_anc = [unbeaten_level["title"], f"{VIEWER_URL}?level={unbeaten_level['identifier']}"]
    write_json_file('stats_data/unbeaten_map.json', unbeaten_level)

    weekly_anc = False
    weekly = log_data["days_since_weekly"] + 1
    if weekly == 7:
        get_weekly_winner()
        weekly_level = get_weekly_map(all_verified)
        weekly_anc = [weekly_level["title"], f"{VIEWER_URL}?level={weekly_level['identifier']}"]
        write_json_file('stats_data/weekly_map.json', weekly_level)
        weekly = 0

    log(weekly)
    run_bot(daily_anc, unbeaten_anc, weekly_anc, unbeaten_levels)

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
        top_three = item[0]
        level = item[1]
        time = item[2]
        score_type = item[3]
        for i in range(len(top_three)):
            user_name = top_three[i]["user_name"]
            user_id = top_three[i]["user_id"]

            if user_id not in leaderboard:
                leaderboard[user_id] = [user_name, 0, user_id]
            
            if score_type == "daily_map":
                leaderboard[user_id][1] += 3 - i
            elif score_type == "weekly_map":
                leaderboard[user_id][1] += 10 - i * 3
            elif score_type == "unbeaten_map":
                leaderboard[user_id][1] += 3 - i
                days_old = timestamp_to_days(level['update_timestamp'], time * 1000)
                leaderboard[user_id][1] += days_old // (100 - 50 * i)

    leaderboard = dict(sorted(leaderboard.items(), key=lambda x: x[1][1], reverse=True))

    embed = discord.Embed(title='Map Challenges Leaderboard', url=f"{PAGE_URL}stats", description=str(date.today()), color=0x00ffff)
    count = 0
    for value in leaderboard.values():
        if count >= 20:
            break
        embed.add_field(name=f'{value[0]} - {value[1]} Pt', value='\u200B', inline=False)
        count += 1

    return embed


def run_bot(daily, unbeaten, weekly, unbeaten_levels=[]):

    intents = discord.Intents.default()
    bot = commands.Bot(command_prefix='!', intents=intents)

    @bot.event
    async def on_ready():
        # Challenges
        print(f'Bot connected as {bot.user.name}')
        channel = bot.get_channel(1110435431750828132)
        guild = bot.get_guild(1048213818775437394)
        role = guild.get_role(1110735575083929622)

        embed = Embed(title="Daily/Weekly Maps Update", url=f"{PAGE_URL}stats", description="Daily Update", color=0x00ffff)
        embed.add_field(name="Daily", value=f"[{daily[0]}]({daily[1]})")
        embed.add_field(name="Unbeaten", value=f"[{unbeaten[0]}]({unbeaten[1]})")
        if weekly:
            embed.add_field(name="Weekly", value=f"[{weekly[0]}]({weekly[1]})")

        await channel.send(f"||{role.mention}||")
        await channel.send(embed=embed)
        scores_embed = await get_challenge_scores()
        await channel.send(embed=scores_embed)

        # Unbeaten
        if unbeaten_levels:
            channel = bot.get_channel(1144060608937996359)
            role = guild.get_role(1077411286696087664)

            embed = Embed(title="Unbeaten Levels Update", url=f"{PAGE_URL}stats", description="Unbeaten Update", color=0x00ffff)
            embed.add_field(name="Count", value=str(len(unbeaten_levels)))
            
            over_100 = []

            for level in unbeaten_levels:
                if timestamp_to_days(level["update_timestamp"]) >= 100:
                    over_100.append(level)
                
            if over_100:
                embed.add_field(name="Over 100 Days", value="\n".join([f"{level['title']}" for level in over_100]), inline=False)

            embed.add_field(name="Newest", value=unbeaten_levels[-1]["title"], inline=False)

            await channel.send(f"||{role.mention}||")
            await channel.send(embed=embed)

        await bot.close()

    bot.run(sys.argv[1])

get_level_data()
