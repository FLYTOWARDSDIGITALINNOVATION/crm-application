import urllib.request

req = urllib.request.Request('http://localhost:5000/api/users/dump-users')
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(e)
