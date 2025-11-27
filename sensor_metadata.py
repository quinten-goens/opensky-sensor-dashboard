import requests
from typing import Dict, List, Optional, Tuple

POCKETHOST_BASE = "https://opdi.pockethost.io"
DETAILS_COLLECTION = "opensky_sensor_details"


def normalize_serial(value: object) -> Optional[int]:
    try:
        return int(str(value).strip())
    except (TypeError, ValueError, AttributeError):
        return None


def fetch_sensor_details(token: str, per_page: int = 200) -> List[Dict[str, object]]:
    """
    Fetch all sensor metadata from PocketBase.

    Returns a list of normalized records that include the essential site and sensor fields.
    """
    if not token:
        raise ValueError("PocketBase admin token is required to fetch sensor details.")

    url = f"{POCKETHOST_BASE}/api/collections/{DETAILS_COLLECTION}/records"
    headers = {"Authorization": token, "User-Agent": "opensky-sensor-metadata"}
    page = 1
    rows: List[Dict[str, object]] = []

    while True:
        params = {"page": page, "perPage": per_page, "sort": "airport_icao,sensor_serial"}
        resp = requests.get(url, headers=headers, params=params, timeout=20)
        resp.raise_for_status()
        payload = resp.json()
        items = payload.get("items", [])
        for item in items:
            serial = normalize_serial(item.get("sensor_serial"))
            if serial is None:
                continue
            rows.append(
                {
                    "id": item.get("id"),
                    "icao": (item.get("airport_icao") or "").upper(),
                    "airport": item.get("airport_name", ""),
                    "country_name": item.get("country_name", ""),
                    "country_iso3": (item.get("country_iso3") or "").upper(),
                    "latitude": item.get("latitude"),
                    "longitude": item.get("longitude"),
                    "sensor_serial": serial,
                }
            )
        if len(items) < per_page:
            break
        page += 1
    return rows


def build_sensor_mappings(
    details: List[Dict[str, object]],
) -> Tuple[List[int], Dict[int, Dict[str, object]], Dict[str, Dict[str, object]]]:
    """
    Build convenience lookups from PocketBase sensor records.

    Returns:
        all_serials: Sorted list of unique serials.
        serial_to_site: Serial -> site metadata (name, coords, country, icao).
        monitor_sites: Label -> site metadata with a sensors list (for select options).
    """
    serials: List[int] = []
    serial_to_site: Dict[int, Dict[str, object]] = {}
    monitor_sites: Dict[str, Dict[str, object]] = {}

    for record in details:
        serial = record.get("sensor_serial")
        if serial is None:
            continue
        serials.append(serial)
        icao = (record.get("icao") or "").upper()
        airport = record.get("airport", "")
        country_name = record.get("country_name", "")
        country_iso3 = record.get("country_iso3", "")
        label = f"{icao} ({airport})" if icao or airport else str(serial)
        site_entry = monitor_sites.setdefault(
            label,
            {
                "icao": icao,
                "airport": airport,
                "country_name": country_name,
                "country_iso3": country_iso3,
                "lat": record.get("latitude"),
                "lon": record.get("longitude"),
                "sensors": [],
            },
        )
        site_entry["sensors"].append(serial)
        serial_to_site[serial] = {
            "name": label,
            "lat": record.get("latitude"),
            "lon": record.get("longitude"),
            "icao": icao,
            "airport": airport,
            "country": country_name,
            "country_name": country_name,
            "country_iso3": country_iso3,
        }

    return sorted(set(serials)), serial_to_site, monitor_sites
