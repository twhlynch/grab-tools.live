import requests, sys

CF_ID = sys.argv[2]
CF_TOKEN = sys.argv[3]
NAMESPACE = sys.argv[4]

headers = {
	"Authorization": f"Bearer {CF_TOKEN}",
}

res1 = requests.put(f"https://api.cloudflare.com/client/v4/accounts/{CF_ID}/storage/kv/namespaces/{NAMESPACE}/values/list_changes", 
headers=headers, data='{"value": "[1]"}'
)
res2 = requests.put(f"https://api.cloudflare.com/client/v4/accounts/{CF_ID}/storage/kv/namespaces/{NAMESPACE}/values/list_changes", 
headers=headers, data="[2]"
)

print(
    res1.status_code,
    res2.status_code
    )