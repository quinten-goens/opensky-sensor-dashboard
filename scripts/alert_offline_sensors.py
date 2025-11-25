import os
import sys
from datetime import datetime, timezone, timedelta
from typing import Dict, List

import requests

POCKETHOST_BASE = "https://opdi.pockethost.io"
POCKETHOST_COLLECTION = "opensky_sensor_status"


def iso_to_dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def fetch_latest_status(token: str) -> Dict[int, Dict]:
    """Return latest record per sensor_serial, newest first overall."""
    url = f"{POCKETHOST_BASE}/api/collections/{POCKETHOST_COLLECTION}/records"
    params = {"sort": "-polling_time", "perPage": 500}
    headers = {"Authorization": token, "User-Agent": "opensky-sensor-alert"}
    resp = requests.get(url, headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    items = resp.json().get("items", [])
    latest: Dict[int, Dict] = {}
    for item in items:
        serial = item.get("sensor_serial")
        if serial is None:
            continue
        if serial in latest:
            continue  # already have newest for this serial
        latest[serial] = item
    return latest


def collect_offline(latest: Dict[int, Dict], now: datetime) -> List[Dict]:
    """Return sensors whose latest status is offline between 24h and 48h ago."""
    offline: List[Dict] = []
    threshold_24 = now - timedelta(hours=24)
    threshold_48 = now - timedelta(hours=48)
    for serial, item in latest.items():
        online = bool(item.get("sensor_online", False))
        ts_raw = item.get("polling_time")
        if not ts_raw:
            continue
        ts = iso_to_dt(ts_raw)
        if online:
            continue
        if threshold_48 >= ts:
            # older than 48h, skip to avoid repeated alerts
            continue
        if ts <= threshold_24:
            offline.append(
                {
                    "serial": serial,
                    "icao": item.get("sensor_site_airport_icao", ""),
                    "airport": item.get("sensor_site_airport_name", ""),
                    "country": item.get("sensor_site_country_name", ""),
                    "ts": ts,
                }
            )
    return offline


def build_message(offline: List[Dict]) -> str:
    if not offline:
        return ""
    lines = ["OpenSky sensors offline between 24–48h:"]
    for entry in sorted(offline, key=lambda e: (e["icao"], e["serial"])):
        lines.append(
            f"- {entry['serial']} | {entry['icao']} {entry['airport']} ({entry['country']}) "
            f"| last offline status: {entry['ts'].strftime('%Y-%m-%d %H:%M:%S %Z')}"
        )
    return "\n".join(lines)


def send_teams(webhook_url: str, body: str) -> None:
    payload = {"text": body}
    resp = requests.post(webhook_url, json=payload, timeout=15)
    if not resp.ok:
        raise RuntimeError(f"Teams webhook failed ({resp.status_code}): {resp.text}")


def main() -> None:
    token = os.getenv("POCKETHOST_ADMIN_TOKEN")
    if not token:
        sys.exit("POCKETHOST_ADMIN_TOKEN is required.")
    teams_webhook = os.getenv("TEAMS_WEBHOOK_URL")
    if not teams_webhook:
        sys.exit("TEAMS_WEBHOOK_URL is required.")

    now = datetime.now(timezone.utc)
    latest = fetch_latest_status(token)
    offline = collect_offline(latest, now)
    message = build_message(offline)
    if not message:
        print("No sensors offline between 24–48h; no alert sent.")
        return
    send_teams(teams_webhook, message)
    print("Teams alert sent.")


if __name__ == "__main__":
    main()
