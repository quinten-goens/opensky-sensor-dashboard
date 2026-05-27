"""Fetch sensor metadata from PocketHost and generate a flows_config.json."""

import json
import os
import re
import sys
from pathlib import Path

try:
    ROOT_DIR = Path(__file__).resolve().parent.parent
except NameError:
    ROOT_DIR = Path.cwd()
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import requests

from sensor_metadata import fetch_sensor_details, build_sensor_mappings, POCKETHOST_BASE

OWNER = "AIU/OPS"
SCHEDULE = "0 * * * *"
MASTER_FLOW_ID = "opdi_sensors"


def to_snake_case(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9]+", "_", text)
    return text.strip("_").lower()


def build_flow_id(icao: str, index: int) -> str:
    slug = to_snake_case(icao) if icao else "unknown"
    return f"opdi_sensor_{slug}_{index}"


def sensor_to_flow(serial: int, site: dict, index: int) -> dict:
    icao = site.get("icao", "")
    airport = site.get("airport", "")
    country = site.get("country_name") or site.get("country", "")
    label = f"{icao} {airport}".strip() or str(serial)

    return {
        "id": build_flow_id(icao, index),
        "description": (
            f"OPDI sensor with serial {serial} at {label}; "
            "polls sensor online/offline status hourly and records to PocketBase"
        ),
        "type": "sensor_status",
        "schedule": SCHEDULE,
        "status": "ongoing",
        "owner": OWNER,
        "metadata": {
            "sensor_serial": serial,
            "airport_icao": icao,
            "airport_name": airport,
            "country": country,
            "source": "opensky-sensor-dashboard",
        },
    }


def build_master_flow(sensor_flow_ids: list[str]) -> dict:
    return {
        "id": MASTER_FLOW_ID,
        "description": (
            "Master flow for all OPDI sensors; "
            "depends on every individual sensor polling flow"
        ),
        "type": "sensor_status",
        "schedule": SCHEDULE,
        "status": "ongoing",
        "owner": OWNER,
        "metadata": {
            "depends_on": sorted(sensor_flow_ids),
            "source": "opensky-sensor-dashboard",
        },
    }


def get_pb_admin_token(email: str, password: str) -> str:
    resp = requests.post(
        f"{POCKETHOST_BASE}/api/admins/auth-with-password",
        json={"identity": email, "password": password},
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()["token"]


def main() -> None:
    pb_email = os.getenv("POCKETBASE_ADMIN_EMAIL")
    pb_password = os.getenv("POCKETBASE_ADMIN_PASSWORD")
    if not pb_email or not pb_password:
        sys.exit("Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD environment variables.")

    print("Authenticating with PocketHost...")
    pb_token = get_pb_admin_token(pb_email, pb_password)

    print("Fetching sensor details from PocketHost...")
    details = fetch_sensor_details(pb_token)
    all_serials, serial_to_site, _ = build_sensor_mappings(details)

    if not all_serials:
        sys.exit("No sensors found in PocketBase.")

    print(f"Found {len(all_serials)} sensors. Generating flows...")

    flows = []
    flow_ids = []
    icao_counter: dict[str, int] = {}
    for serial in all_serials:
        site = serial_to_site.get(serial, {})
        icao = (site.get("icao") or "unknown").upper()
        icao_counter[icao] = icao_counter.get(icao, 0) + 1
        flow = sensor_to_flow(serial, site, icao_counter[icao])
        flows.append(flow)
        flow_ids.append(flow["id"])

    master = build_master_flow(flow_ids)
    flows.insert(0, master)

    config = {"flows": flows}

    out_path = ROOT_DIR / "flows_config.json"
    out_path.write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(flows)} flows ({len(flow_ids)} sensors + 1 master) to {out_path}")


if __name__ == "__main__":
    main()
