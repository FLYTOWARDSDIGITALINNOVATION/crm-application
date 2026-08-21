import urllib.request
import json

req = urllib.request.Request('http://localhost:5000/api/users/login', data=b'{"email":"admin@flytowards.com","password":"password123"}', headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(e)
