import json, random, requests, sys, discord, math
from datetime import datetime, date, timedelta
from discord.ext import commands
from discord import Embed

SERVER_URL = "https://api.slin.dev/grab/v1/"
PAGE_URL = "https://grab-tools.live/"
VIEWER_URL = "https://grabvr.quest/levels/viewer/"
FORMAT_VERSION = "100"

def safe_get(url):
    print("Request:", url)
    error_count = 0

    while True:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return response
            else:
                print("Issue: Invalid response from server", response.status_code, response.raw)
                error_count += 1
                if error_count >= 3:
                    return None
                else:
                    continue
        except Exception as e:
            print("Caught error:", e)
            error_count += 1
            if error_count >= 3:
                return None

def filter_level(level):
    
    if "verification_time" in level:
        del level["verification_time"]
        
    if "format_version" in level:
        del level["format_version"]
        
    if "tags" in level:
        if "ok" in level["tags"]:
            level["tags"] = ["ok"]
        else:
            del level["tags"]
    
    if "description" in level:
        del level["description"]
            
    # if "statistics" in level:
    #     if "difficulty_string" in level["statistics"]:
    #         del level["statistics"]["difficulty_string"]
            
    if "images" in level:
        if "full" in level["images"]:
            del level["images"]["full"]
        if "thumb" in level["images"]:
            if "width" in level["images"]["thumb"]:
                del level["images"]["thumb"]["width"]
            if "height" in level["images"]["thumb"]:
                del level["images"]["thumb"]["height"]
    
    if "data_key" in level:
        iteration = int(level["data_key"].split(":")[3])
        if iteration > 1:
            level["iteration"] = iteration
        del level["data_key"]
        
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
    
    return level

def filter_level_list(level_list):
    for level in level_list:
        level = filter_level(level)
    return level_list

def get_level_list(type):
    list_url = f"{SERVER_URL}list?max_format_version={FORMAT_VERSION}&type={type}"
    request = safe_get(list_url)
    if request == None:
        return []
    response = request.json()
    response = filter_level_list(response)
    return response

def get_user_info(user_identifier):
    user_url = f"{SERVER_URL}get_user_info?user_id={user_identifier}"
    request = safe_get(user_url)
    if request == None:
        return {}
    response = request.json()
    return response

def get_level_leaderboard(level_identifier):
    leaderboard_url = f"{SERVER_URL}statistics_top_leaderboard/{level_identifier.replace(':', '/')}"
    request = safe_get(leaderboard_url)
    if request == None:
        return []
    response = request.json()
    response = [entry for entry in response if "is_verification" not in entry]
    return response

def get_level_stats(level_identifier):
    stats_url = f"{SERVER_URL}statistics/{level_identifier.replace(':', '/')}"
    request = safe_get(stats_url)
    if request == None:
        return {
            "level_identifier": level_identifier,
            "total_played_count": 0,
            "total_finished_count": 0,
            "played_count": 100,
            "finished_count": 1,
            "rated_count": 0,
            "liked_count": 0,
            "tipped_amount": 0
        }
    response = request.json()
    return response

def get_level_browser():
    browser_url = f"{SERVER_URL}get_level_browser?version=1"
    request = safe_get(browser_url)
    if request == None:
        sys.exit(0) # required
    return request.json()

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
        json.dump(data, file)

def timestamp_to_days(timestamp_in_milliseconds, now=datetime.now().timestamp() * 1000):
    return (now - timestamp_in_milliseconds) / 1000 / 60 / 60 / 24

def get_total_levels():
    total_url = f"{SERVER_URL}total_level_count?type=newest"
    request = safe_get(total_url)
    if request == None:
        return { "levels": 0 } # probably fine
    count = int(float(request.text))
    return { "levels": count }

def get_all_verified(stamp=''):
    verified = []
    while True:
        url = f"{SERVER_URL}list?max_format_version={FORMAT_VERSION}&type=ok&page_timestamp={stamp}"
        request = safe_get(url)
        if request == None:
            sys.exit(0) # required
        data = request.json()
        verified.extend(data)
        if len(data) > 0 and data[-1].get("page_timestamp"):
            stamp = data[-1]["page_timestamp"]
        else:
            break
    verified = filter_level_list(verified)
    return verified

def get_a_challenge():
    a_challenge_maps = get_level_list("curated_challenge")
    user_leaderboard = {}
    for level in a_challenge_maps:
        identifier = level["identifier"]
        leaderboard = get_level_leaderboard(identifier)
        # top 1 if sole victor: 1
        if leaderboard and len(leaderboard) == 1:
            addition = 1
            if leaderboard[0]["user_id"] in user_leaderboard:
                user_leaderboard[leaderboard[0]["user_id"]][0] += addition
            else:
                user_leaderboard[leaderboard[0]["user_id"]] = [addition, leaderboard[0]["user_name"], 0, leaderboard[0]["timestamp"]]
        # top 3: 2, 1.5, 1
        for i in range(min(len(leaderboard), 3)):
            addition = 2 - (i*0.5)
            if leaderboard[i]["user_id"] in user_leaderboard:
                user_leaderboard[leaderboard[i]["user_id"]][0] += addition
            else:
                user_leaderboard[leaderboard[i]["user_id"]] = [addition, leaderboard[i]["user_name"], 0, leaderboard[i]["timestamp"]]
        # rest of top 10: 0.5
        for i in range(min(len(leaderboard), 10)):
            if i > 2:
                addition = 0.5
                if leaderboard[i]["user_id"] in user_leaderboard:
                    user_leaderboard[leaderboard[i]["user_id"]][0] += addition
                else:
                    user_leaderboard[leaderboard[i]["user_id"]] = [addition, leaderboard[i]["user_name"], 0, leaderboard[i]["timestamp"]]
        # top 100: 1
        # and do map totals
        for i in range(len(leaderboard)):
            if leaderboard[i]["user_id"] in user_leaderboard:
                user_leaderboard[leaderboard[i]["user_id"]][0] += 1
                user_leaderboard[leaderboard[i]["user_id"]][2] += 1
                if leaderboard[i]["timestamp"] > user_leaderboard[leaderboard[i]["user_id"]][3]:
                    user_leaderboard[leaderboard[i]["user_id"]][3] = leaderboard[i]["timestamp"]
                    user_leaderboard[leaderboard[i]["user_id"]][1] = leaderboard[i]["user_name"]
            else:
                user_leaderboard[leaderboard[i]["user_id"]] = [1, leaderboard[i]["user_name"], 1, leaderboard[i]["timestamp"]]
    user_leaderboard = sorted(user_leaderboard.items(), key=lambda x: x[1][0], reverse=True)
    return user_leaderboard

def find_list_keys(data):
    list_keys = []
    
    if isinstance(data, dict):
        if "list_key" in data and not data["list_key"].startswith("curated_gab"):
            list_keys.append(data["list_key"])
        if "title" in data and (data["title"] == "Past Competitions" or data["title"] == "Weekly Spotlight"):
            return []
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

# def get_creators():
#     level_browser = get_level_browser()["sections"]
#     best_of_grab = [section for section in level_browser if "title" in section and section["title"] == "Best of GRAB"][0]["sections"]
#     featured_creators = [section for section in best_of_grab if "title" in section and section["title"] == "Featured Creators"]
#     if len(featured_creators) > 0:
#         return featured_creators[0]["sections"]
#     else:
#         return []

def get_unbeaten(all_verified_maps):
    with open("stats_data/sole_victors.json") as soles_f:
        soles_data = json.load(soles_f)
    unbeaten = []
    for level in all_verified_maps:
        days_old = timestamp_to_days(level["creation_timestamp"])
        exceptions = [] # check anyway
        hacked = []
        if level["statistics"]["difficulty"] == 0 and ((days_old > 1 and level["statistics"]["total_played"] > 300) or days_old > 10):
            stats = get_level_stats(level['identifier'])
            if stats["finished_count"] == 0:
                if "creators" not in level:
                    level["creators"] = ["?"]
                unbeaten.append(level)
            # handle verification runs (and hacked)
            elif stats["finished_count"] == 1 or level["identifier"] in hacked:
                leaderboard = get_level_leaderboard(level['identifier'])
                if len(leaderboard) == 0:
                    if "creators" not in level:
                        level["creators"] = ["?"]
                    unbeaten.append(level)
        elif level["identifier"] in exceptions:
            stats = get_level_stats(level['identifier'])
            if stats["finished_count"] == 0:
                if "creators" not in level:
                    level["creators"] = ["?"]
                unbeaten.append(level)
        else:
            potential_diff = False
            potential_sole = False
            if level["statistics"]["difficulty"] * level["statistics"]["total_played"] < 2:
                potential_diff = True
            for level2 in soles_data:
                if level2["identifier"] == level["identifier"] and level["identifier"].split(":")[0] == level2["leaderboard"][0]["user_id"]:
                    potential_sole = True
                    break
            if potential_sole and potential_diff:
                level["sole"] = True
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

def get_trending_info(all_verified):
    with open("stats_data/all_verified.json") as old_data_file:
        old_data = json.load(old_data_file)

    for level in all_verified:
        old_level = False
        for old_level_i in old_data:
            if level["identifier"] == old_level_i["identifier"]:
                old_level = old_level_i
                
        # trending_array = []
        
        if old_level:
            level["change"] = level["statistics"]["total_played"] - old_level["statistics"]["total_played"]
            # if "trend" in old_level:
            #     trending_array = old_level["trend"]
        else:
            level["change"] = level["statistics"]["total_played"]
        
        # if len(trending_array) == 7:
        #     trending_array.pop(0)
        # trending_array.append(level["change"])
        
        # level["trend"] = trending_array

def get_beaten_unbeaten(levels_old):
    beaten = []
    for old_level in levels_old:
        if "sole" not in old_level:
            leaderboard = get_level_leaderboard(old_level["identifier"])
            if len(leaderboard) > 0:
                leaderboard = sorted(leaderboard, key=lambda x: x["timestamp"])
                victor = leaderboard[0]
                title = old_level["title"]
                url = f"{VIEWER_URL}?level={old_level['identifier']}"
                time = str(timedelta(seconds=victor["best_time"]))
                user = victor["user_name"]
                days = timestamp_to_days(old_level["update_timestamp"])
                extra = ""
                if old_level["update_timestamp"] != old_level["creation_timestamp"]:
                    extra = f" ({math.floor(timestamp_to_days(old_level["creation_timestamp"]))} since creation)"
                color = 0xffaa00
                if timestamp_to_days(old_level["creation_timestamp"]) >= 100:
                    color = 0xff7500
                if timestamp_to_days(old_level["creation_timestamp"]) >= 365:
                    color = 0xff0000
                if timestamp_to_days(old_level["creation_timestamp"]) >= 1000:
                    color = 0xffffff
                beaten.append([title, user, time, days, url, extra, color])
    return beaten

def get_hardest_levels_list():
    CF_ID = sys.argv[2]
    CF_TOKEN = sys.argv[3]
    NAMESPACE = sys.argv[4]
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ID}/storage/kv/namespaces/{NAMESPACE}/values/list"
    headers = {
        "Authorization": f"Bearer {CF_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.request("GET", url, headers=headers)
    return json.loads(response.text)

def get_hardest_levels_changes():
    CF_ID = sys.argv[2]
    CF_TOKEN = sys.argv[3]
    NAMESPACE = sys.argv[4]
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ID}/storage/kv/namespaces/{NAMESPACE}/values/list_changes"
    response = requests.request("GET", url, headers={
        "Authorization": f"Bearer {CF_TOKEN}",
        "Content-Type": "application/json"
    })
    
    requests.put(url, headers={"Authorization": f"Bearer {CF_TOKEN}"}, data='[]')
    print('CHANGES', response.text)
    
    return json.loads(response.text)

def get_blocked_ids():
    CF_ID = sys.argv[2]
    CF_TOKEN = sys.argv[3]
    NAMESPACE = sys.argv[4]
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ID}/storage/kv/namespaces/{NAMESPACE}/values/blocked"
    headers = {
        "Authorization": f"Bearer {CF_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.request("GET", url, headers=headers)
    return json.loads(response.text)

def get_unverified(all_verified, all_verified_old):
    unverified = []
    verified_ids = [l["identifier"] for l in all_verified]
    for level in all_verified_old:
        if level["identifier"] not in verified_ids:
            unverified.append(level)
    return unverified

def get_level_data():
    with open("stats_data/most_plays.json") as most_plays_file, open("stats_data/most_verified.json") as most_verified_file, open("stats_data/unbeaten_levels.json") as unbeaten_file, open("stats_data/all_verified.json") as all_verified_file, open("stats_data/best_of_grab.json") as best_of_grab_file:
        most_plays_old = json.load(most_plays_file)
        most_verified_old = json.load(most_verified_file)
        unbeaten_levels_old = json.load(unbeaten_file)
        all_verified_old = json.load(all_verified_file)
        best_of_grab_levels_old = json.load(best_of_grab_file)

    all_verified = get_all_verified()
    unbeaten_levels = get_unbeaten(all_verified)
    beaten_unbeaten_levels = get_beaten_unbeaten(unbeaten_levels_old)
    unverified = get_unverified(all_verified, all_verified_old)
    hardest_levels_list = get_hardest_levels_list()
    hardest_levels_changes = get_hardest_levels_changes()
    get_trending_info(all_verified)
    write_json_file('stats_data/all_verified.json', all_verified)
    write_json_file('stats_data/a_challenge.json', get_a_challenge())
    best_of_grab_levels = get_best_of_grab()
    write_json_file('stats_data/best_of_grab.json', best_of_grab_levels)
    # write_json_file('stats_data/featured_creators.json', get_creators())
    write_json_file('stats_data/unbeaten_levels.json', unbeaten_levels)
    write_json_file('stats_data/most_verified.json', get_most_verified(all_verified, most_verified_old))
    write_json_file('stats_data/most_plays.json', get_most_plays(all_verified, most_plays_old))
    write_json_file('stats_data/hardest_levels_list.json', hardest_levels_list)
    write_json_file('stats_data/blocked.json', get_blocked_ids())
    write_json_file('stats_data/total_level_count.json', get_total_levels())

    run_bot(unbeaten_levels, beaten_unbeaten_levels, unverified, best_of_grab_levels_old, best_of_grab_levels, hardest_levels_changes)

async def get_challenge_scores():
    with open('stats_data/challenge_scores.json') as file_data:
        all_leaderboards = json.load(file_data)
        current_version = all_leaderboards["current_version"]
        leaderboard = all_leaderboards[f"v{current_version}"]

    embed = discord.Embed(title='Map Challenges Leaderboard', url=f"{PAGE_URL}stats?tab=MapChallenges", description=str(date.today()), color=0x00ffff)
    embed_values = []
    count = 0
    for i in range(len(leaderboard)):
        value = leaderboard[i]
        embed_values.append(f'{value["user_name"]}: {int(value["score"])} Pt')
        if count >= 10:
            break
        count += 1
    embed.add_field(name='Leaderboard', value='\n'.join(embed_values), inline=False)

    return embed


def run_bot(unbeaten_levels, beaten_unbeaten_levels, unverified, best_of_grab_levels_old, best_of_grab_levels, hardest_levels_changes):

    intents = discord.Intents.default()
    bot = commands.Bot(command_prefix='!', intents=intents, allowed_mentions=discord.AllowedMentions(roles=True, users=False, everyone=False))

    @bot.event
    async def on_ready():
        # Challenges
        print(f'Bot connected as {bot.user.name}')
        guild = bot.get_guild(1048213818775437394)

        # hardest list
        hardest_levels_channel = bot.get_channel(1365172578242531379)
        for change in hardest_levels_changes:
            embed = Embed(title=change["title"], url=f"{VIEWER_URL}?level={change['id']}", description=f"{change['title']} by {change['creator']}\n{change["description"]} {change["i"] + 1}", color=0xffffff if change["i"] == 0 else 0xff0000)
            await hardest_levels_channel.send(embed=embed)

        # Unbeaten
        if unbeaten_levels:
            channel = bot.get_channel(1144060608937996359)
            role = guild.get_role(1077411286696087664)

            embed = Embed(title="Unbeaten Levels Update", url=f"{PAGE_URL}stats?tab=UnbeatenMaps", description="Unbeaten Update", color=0x00ffff)
            embed.add_field(name="Count", value=str(len(unbeaten_levels)))
            
            over_100 = []

            for level in unbeaten_levels:
                if timestamp_to_days(level["update_timestamp"]) >= 100:
                    over_100.append(level)
                
            if over_100:
                embed.add_field(name="Over 100 Days", value=("\n".join([f"{level['title']}" for level in over_100]))[:900], inline=False)

            if len(unbeaten_levels) > 0:
                embed.add_field(name="Newest", value=unbeaten_levels[-1]["title"], inline=False)

            await channel.send(f"||{role.mention}||", allowed_mentions=discord.AllowedMentions(roles=True))
            await channel.send(embed=embed)

        for beaten in beaten_unbeaten_levels:
            beaten_embed = Embed(title=beaten[0], url=beaten[4], description=f"Beaten by {beaten[1]} in {beaten[2]} after {math.floor(beaten[3])} days!{beaten[5]}", color=beaten[6])
            await channel.send(embed=beaten_embed)
            
        unverified_channel = bot.get_channel(1238777601166934016)
        if len(unverified) > 0:
            await unverified_channel.send(f"{len(unverified)} unverified")
        for map in unverified:
            color = 0x000000
            creator = "Unknown Creator"
            if "scheduled_for_deletion" in map:
                color = 0xff0000
            if "creators" in map and len(map["creators"]) > 0:
                creator = map["creators"][0]
            unverified_embed = Embed(title=map["title"], url=f"{VIEWER_URL}?level={map['identifier']}", description=creator, color=color)
            if "images" in map and "thumb" in map["images"] and "key" in map["images"]["thumb"]:
                link = map["images"]["thumb"]["key"]
                unverified_embed.set_thumbnail(url=f"https://grab-images.slin.dev/{link}")
            await unverified_channel.send(embed=unverified_embed)
            
        # challenge maps record changes
        new_records = []
        challenge_records_channel = bot.get_channel(1241943979751374868)
        for map in best_of_grab_levels:
            found = False
            for map_old in best_of_grab_levels_old:
                if map["identifier"] == map_old["identifier"] and "curated_challenge" in map["list_key"]:
                    found = True
                    old_record = None
                    current_record = None
                    if "leaderboard" in map_old and len(map_old["leaderboard"]) > 0:
                        old_record = map_old["leaderboard"][0]
                    if "leaderboard" in map and len(map["leaderboard"]) > 0:
                        current_record = map["leaderboard"][0]
                    if current_record is not None and old_record is not None and current_record["timestamp"] != old_record["timestamp"]:
                        embed = Embed(title=map["title"], url=f"{VIEWER_URL}?level={map['identifier']}", description=f"New record by {current_record['user_name']}: {current_record["best_time"]}s", color=0xff0000)
                        await challenge_records_channel.send(embed=embed)
                    elif current_record is not None and old_record is not None:
                        break
                    elif current_record is not None and old_record is None:
                        embed = Embed(title=map["title"], url=f"{VIEWER_URL}?level={map['identifier']}", description=f"New record by {current_record['user_name']}: {current_record["best_time"]}s", color=0xff0000)
                        await challenge_records_channel.send(embed=embed)
                    elif old_record is not None:
                        embed = Embed(title=map["title"], url=f"{VIEWER_URL}?level={map['identifier']}", description=f"Record removed by moderator", color=0x990000)
                        await challenge_records_channel.send(embed=embed)
                    break
            if not found and "curated_challenge" in map["list_key"]:
                embed = Embed(title=map["title"], url=f"{VIEWER_URL}?level={map['identifier']}", description=f"Map added to a challenge", color=0x990000)
                await challenge_records_channel.send(embed=embed)

            limit = 100 if "curated_challenge" in map["list_key"] else 10
            for i in range(min(len(map["leaderboard"]), limit)):
                identifier = map["leaderboard"][i]["user_id"]
                for map_old in best_of_grab_levels_old:
                    if map["identifier"] == map_old["identifier"]:
                        found = False
                        for j in range(min(len(map_old["leaderboard"]), limit)):
                            if map_old["leaderboard"][j]["user_id"] == identifier:
                                found = True
                                if map["leaderboard"][i]["timestamp"] != map_old["leaderboard"][j]["timestamp"]:
                                    new_records.append({
                                        "identifier": map["identifier"],
                                        "title": map["title"],
                                        "record": map["leaderboard"][i]
                                    })
                        if not found:
                            new_records.append({
                                "identifier": map["identifier"],
                                "title": map["title"],
                                "record": map["leaderboard"][i]
                            })

        records_log_channel = bot.get_channel(1333319489726713877)
        for entry in new_records:
            embed = Embed(title=entry["title"], url=f"{VIEWER_URL}?level={entry['identifier']}", color=0xff0000 if int(entry["record"]["position"]) == 0 else 0x990000)
            embed.add_field(name=entry["record"]["user_name"], value=f"{entry["record"]["position"]}: {entry["record"]['best_time']}s", inline=False)
            await records_log_channel.send(embed=embed)

        for map_old in best_of_grab_levels_old:
            if "curated_challenge" in map_old["list_key"]:
                found = False
                for map in best_of_grab_levels:
                    if map["identifier"] == map_old["identifier"] and "curated_challenge" in map["list_key"]:
                        found = True
                        break
                if not found:
                    embed = Embed(title=map_old["title"], url=f"{VIEWER_URL}?level={map_old['identifier']}", description=f"Map removed from a challenge", color=0x990000)
                    await challenge_records_channel.send(embed=embed)

        await bot.close()

    bot.run(sys.argv[1])
    print("success")

get_level_data()
