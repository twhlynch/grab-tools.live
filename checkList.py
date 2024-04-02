import requests, sys, json

CF_ID = sys.argv[1]
CF_TOKEN = sys.argv[2]
NAMESPACE = sys.argv[3]
url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ID}/storage/kv/namespaces/{NAMESPACE}/values/list"
headers = {
    "Authorization": f"Bearer {CF_TOKEN}",
    "Content-Type": "application/json"
}
response = requests.request("GET", url, headers=headers)
print(response.text)
