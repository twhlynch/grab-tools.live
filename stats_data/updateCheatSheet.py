import json

with open("cheat-sheetv1.json") as file:
    data = json.load(file)
    
results = data["results"]
updated = []
for item in results:
    if item["shape"] == 3:
        new = json.loads(json.dumps(item))
        new["attributes"]["texture"] = "OPAQUE"
        updated.append(new)
    
    if item["shape"] is not None and item["shape"] >= 3 and item["shape"] <= 7:
        item["shape"] += 1
    
    
    updated.append(item)
    
data["results"] = updated

with open("cheat-sheetv2.json", "w") as file:
    json.dump(data, file, indent=2)