import urllib.request
import urllib.error
import json

def test_api(url, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as res:
            print(res.status, res.read().decode())
    except urllib.error.HTTPError as e:
        print(e.code, e.read().decode())
    except Exception as e:
        print(e)

print("Registering...")
test_api('http://localhost:8000/api/users/register/', {
    "username": "test987",
    "email": "test987@gmail.com",
    "password": "Password123!",
    "password2": "Password123!"
})

print("Logging in...")
test_api('http://localhost:8000/api/token/', {
    "username": "test987@gmail.com",
    "password": "Password123!"
})
