import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests

# Ensure project root is on the import path when executed from scripts/
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sensors_data import SENSOR_SITES

AUTH_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
BASE_API_URL = "https://opensky-network.org/api"
POCKETHOST_BASE = "https://opdi.pockethost.io"
POCKETHOST_COLLECTION = "opensky_sensor_status"


def normalize_serial(value: object) -> Optional[int]:
    try:
        return int(str(value).strip())
    except (TypeError, ValueError, AttributeError):
        return None


def build_serial_maps() -> Tuple[List[int], Dict[int, Dict[str, str]]]:
    serials: List[int] = []
    serial_to_site: Dict[int, Dict[str, str]] = {}
    for icao, site in SENSOR_SITES.items():
        for raw_serial in site["sensors"]:
            serial = normalize_serial(raw_serial)
            if serial is None:
                continue
            serials.append(serial)
            serial_to_site[serial] = {
                "label": f"{icao} ({site['airport']})",
                "icao": site["icao"],
                "airport": site["airport"],
                "country_name": site["country_name"],
                "country_iso3": site["country_iso3"],
            }
    return sorted(set(serials)), serial_to_site


ALL_SERIALS, SERIAL_TO_SITE = build_serial_maps()


def get_opensky_token(client_id: str, client_secret: str) -> str:
    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    resp = requests.post(AUTH_URL, data=data, headers=headers, timeout=30)
    resp.raise_for_status()
    token = resp.json().get("access_token")
    if not token:
        raise RuntimeError("Token response did not include access_token")
    return token


def fetch_sensor_list(token: str) -> Dict[int, Dict]:
    url = f"{BASE_API_URL}/sensor/list"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    sensors = {}
    for item in resp.json():
        serial = normalize_serial(item.get("serial"))
        if serial is None:
            continue
        sensors[serial] = item
    return sensors


def post_pockethost_status(token: str, payload: Dict) -> None:
    url = f"{POCKETHOST_BASE}/api/collections/{POCKETHOST_COLLECTION}/records"
    headers = {
        "Content-Type": "application/json",
        "Authorization": token,
        "User-Agent": "opensky-sensor-status",
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=20)
    if not resp.ok:
        raise RuntimeError(f"PocketHost create failed ({resp.status_code}): {resp.text}")


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def main() -> None:
    client_id = os.getenv("OPENSKY_CLIENT_ID")
    client_secret = os.getenv("OPENSKY_CLIENT_SECRET")
    pb_token = os.getenv("POCKETHOST_ADMIN_TOKEN")

    if not client_id or not client_secret:
        sys.exit("Set OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET.")
    if not pb_token:
        sys.exit("Set POCKETHOST_ADMIN_TOKEN.")

    token = get_opensky_token(client_id, client_secret)
    sensors = fetch_sensor_list(token)
    now_ts = iso_now()

    for serial in ALL_SERIALS:
        sensor_info = sensors.get(serial, {})
        online = bool(sensor_info.get("online", False))
        site_meta = SERIAL_TO_SITE.get(serial, {})
        payload = {
            "sensor_site_airport_icao": site_meta.get("icao", ""),
            "sensor_site_airport_name": site_meta.get("airport", ""),
            "sensor_site_country_name": site_meta.get("country_name", ""),
            "sensor_site_country_iso3": site_meta.get("country_iso3", ""),
            "sensor_serial": serial,
            "polling_time": now_ts,
            "sensor_online": online,
        }
        print(
            f"Posting {serial} ({site_meta.get('icao', '?')} - {site_meta.get('airport', '?')}) online={online}"
        )
        post_pockethost_status(pb_token, payload)


if __name__ == "__main__":
    main()
