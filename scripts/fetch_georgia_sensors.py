import os
import sys
from datetime import datetime, timezone

import requests

AUTH_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
SENSOR_URL = "https://opensky-network.org/api/sensor/list"

GEORGIA_SERIALS = {1408232560, 1408232534, 1408232487, 1996020079, 1995940501, 1995940504, 1995940582}


def get_token(client_id: str, client_secret: str) -> str:
    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    resp = requests.post(AUTH_URL, data=data, headers=headers, timeout=20)
    resp.raise_for_status()
    token = resp.json().get("access_token")
    if not token:
        raise RuntimeError("Token response missing access_token")
    return token


def fetch_sensors(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(SENSOR_URL, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def format_ts(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S %Z") if ts else "n/a"


def main():
    client_id = os.getenv("OPENSKY_CLIENT_ID")
    client_secret = os.getenv("OPENSKY_CLIENT_SECRET")
    if not client_id or not client_secret:
        sys.exit("Set OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET environment variables.")

    try:
        token = get_token(client_id, client_secret)
        sensors = fetch_sensors(token)
    except Exception as exc:  # noqa: BLE001
        sys.exit(f"Failed to fetch sensor list: {exc}")

    found = False
    print(sensors)
    for sensor in sensors:
        serial = sensor.get("serial")
        if serial not in GEORGIA_SERIALS:
            continue
        found = True
        name = sensor.get("name", "")
        last_seen = sensor.get("lastConnectionEvent")
        print(f"Serial: {serial} | Name: {name} | Last seen: {format_ts(last_seen)} (epoch: {last_seen})")

    if not found:
        print("No Georgia sensors found in response.")


if __name__ == "__main__":
    main()
