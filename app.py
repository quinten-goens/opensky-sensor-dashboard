import os
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

import pandas as pd
import pydeck as pdk
import requests
import streamlit as st

AUTH_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
BASE_API_URL = "https://opensky-network.org/api"

# Sensor presets provided earlier
MONITOR_SITES: Dict[str, Dict] = {
    "ESSA (Stockholm Arlanda, Sweden)": {
        "lat": 59.6519,
        "lon": 17.9186,
        "sensors": [1408232560, 1408232534, 1408232487],
    },
    "EYVI (Vilnius International, Lithuania)": {
        "lat": 54.6341,
        "lon": 25.2858,
        "sensors": [2137168417, 1497670044],
    },
    "EYPA (Palanga International, Lithuania)": {
        "lat": 55.9737,
        "lon": 21.0939,
        "sensors": [2137191229],
    },
    "UGTB (Tbilisi International, Georgia)": {
        "lat": 41.6692,
        "lon": 44.9547,
        "sensors": [1996020079, 1995940501],
    },
    "UGSB (Batumi International, Georgia)": {
        "lat": 41.6103,
        "lon": 41.5997,
        "sensors": [1995940504],
    },
    "UGKO (Kutaisi International, Georgia)": {
        "lat": 42.1770,
        "lon": 42.4826,
        "sensors": [1995940582],
    },
}

ALL_SERIALS = sorted({s for site in MONITOR_SITES.values() for s in site["sensors"]})
SERIAL_TO_SITE = {
    serial: {"name": name, "lat": site["lat"], "lon": site["lon"]}
    for name, site in MONITOR_SITES.items()
    for serial in site["sensors"]
}


def _load_secrets(key: str, default: str = "") -> str:
    try:
        return st.secrets.get(key, default)
    except Exception:
        return default


def _get_credentials() -> Tuple[str, str]:
    """Retrieve OpenSky API credentials from environment or Streamlit secrets."""
    client_id = os.getenv("OPENSKY_CLIENT_ID") or _load_secrets("opensky_client_id", "")
    client_secret = os.getenv("OPENSKY_CLIENT_SECRET") or _load_secrets("opensky_client_secret", "")
    return client_id, client_secret


@st.cache_data(ttl=1500, show_spinner=False)
def fetch_token(client_id: str, client_secret: str) -> str:
    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    response = requests.post(AUTH_URL, data=data, headers=headers, timeout=20)
    if not response.ok:
        raise RuntimeError(f"Token request failed ({response.status_code}): {response.text}")
    token = response.json().get("access_token")
    if not token:
        raise RuntimeError("Token response did not include access_token")
    return token


def _api_get(path: str, token: str, params: Optional[Dict] = None) -> Dict:
    url = f"{BASE_API_URL}{path}"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    resp = requests.get(url, headers=headers, params=params or {}, timeout=30)
    st.caption(f"API request → {url} params={params or {}} status={resp.status_code}")
    if resp.status_code == 401:
        raise PermissionError("Unauthorized; token invalid or expired.")
    try:
        resp.raise_for_status()
    except requests.HTTPError as exc:
        detail = resp.text or resp.reason
        raise RuntimeError(f"API GET {path} failed ({resp.status_code}): {detail}") from exc
    return resp.json()


@st.cache_data(show_spinner=False, ttl=300)
def fetch_sensor_list(token: str, cache_bust: str) -> pd.DataFrame:
    data = _api_get("/sensor/list", token)
    df = pd.DataFrame(data)
    if df.empty:
        return df
    df = df[df["serial"].isin(ALL_SERIALS)].copy()
    df["site"] = df["serial"].apply(lambda s: SERIAL_TO_SITE.get(s, {}).get("name", ""))
    df["latitude"] = df["position"].apply(lambda p: p.get("latitude") if isinstance(p, dict) else None)
    df["longitude"] = df["position"].apply(lambda p: p.get("longitude") if isinstance(p, dict) else None)
    df["added_dt"] = pd.to_datetime(df["added"], unit="s", utc=True, errors="coerce")
    df["last_seen_dt"] = pd.to_datetime(df["lastConnectionEvent"], unit="s", utc=True, errors="coerce")
    return df


@st.cache_data(show_spinner=False, ttl=300)
def fetch_msg_rates(token: str, serials: List[int], hours: int, cache_bust: str) -> pd.DataFrame:
    if not serials:
        return pd.DataFrame()
    end = int(time.time())
    begin = end - hours * 3600
    params = {"serials": ",".join(map(str, serials)), "begin": begin, "end": end}
    try:
        payload = _api_get("/stats/msg-rates", token, params=params)
    except Exception:
        # Fallback to no params in case the endpoint rejects custom ranges
        payload = _api_get("/stats/msg-rates", token, params={"serials": ",".join(map(str, serials))})
    series = payload.get("series", {}) if isinstance(payload, dict) else {}
    rows = []
    for sid, values in series.items():
        for item in values:
            rows.append(
                {
                    "serial": int(sid),
                    "ts": pd.to_datetime(item[0], unit="ms", utc=True),
                    "rate": item[1],
                }
            )
    return pd.DataFrame(rows)


@st.cache_data(show_spinner=False, ttl=600)
def fetch_coverage_polygon(token: str, serial: int, day: str, cache_bust: str) -> List[List[float]]:
    params = {"days": day, "serials": serial}
    payload = _api_get("/range/days", token, params=params)
    day_data = payload.get(day) if isinstance(payload, dict) else None
    if not day_data:
        return []
    ranges = day_data[0].get("ranges", []) if isinstance(day_data, list) else []
    if not ranges:
        return []
    # API returns [distance, lat, lon]
    return [[r[2], r[1]] for r in ranges]


def render_map(sensor_df: pd.DataFrame, coverage_coords: List[List[float]]) -> None:
    layers = []
    centers = sensor_df[["latitude", "longitude"]].dropna()
    center_lat = centers["latitude"].mean() if not centers.empty else 0.0
    center_lon = centers["longitude"].mean() if not centers.empty else 0.0

    if coverage_coords:
        layers.append(
            pdk.Layer(
                "PolygonLayer",
                data=[{"coords": coverage_coords}],
                get_polygon="coords",
                stroked=True,
                filled=True,
                get_fill_color=[255, 191, 121, 70],
                get_line_color=[240, 120, 50],
                line_width_min_pixels=2,
            )
        )
        poly_lats = [c[1] for c in coverage_coords]
        poly_lons = [c[0] for c in coverage_coords]
        center_lat = sum(poly_lats) / len(poly_lats)
        center_lon = sum(poly_lons) / len(poly_lons)

    if not sensor_df.empty:
        if "color" not in sensor_df.columns:
            sensor_df = sensor_df.copy()
            sensor_df["color"] = sensor_df["online"].apply(
                lambda online: [230, 120, 50] if online else [150, 150, 150]
            )
        layers.append(
            pdk.Layer(
                "ScatterplotLayer",
                data=sensor_df,
                get_position="[longitude, latitude]",
                get_radius=12000,
                radius_min_pixels=4,
                radius_max_pixels=12,
                get_fill_color="color",
                stroked=True,
                get_line_color=[255, 255, 255],
                pickable=True,
            )
        )

    deck = pdk.Deck(
        map_provider=None,
        map_style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        initial_view_state=pdk.ViewState(latitude=center_lat, longitude=center_lon, zoom=5, pitch=30),
        layers=layers,
        tooltip={"text": "Serial: {serial}\nSite: {site}\nOnline: {online}\nLast seen: {last_seen_dt}"},
    )
    st.pydeck_chart(deck, use_container_width=True)


def main() -> None:
    st.set_page_config(page_title="OpenSky Sensor Dashboard", layout="wide")
    st.title("OpenSky Sensor Dashboard")
    st.caption("Monitoring the configured sensor fleet with coverage, status, and message rates.")

    client_id, client_secret = _get_credentials()

    with st.sidebar:
        st.header("Sensors")
        site_choice = st.selectbox("Preset site", list(MONITOR_SITES.keys()))
        selected_serials = MONITOR_SITES[site_choice]["sensors"]
        st.caption(f"Serials: {', '.join(map(str, selected_serials))}")
        coverage_serial = st.selectbox("Coverage focus (single sensor)", selected_serials)
        coverage_day = st.date_input(
            "Coverage day",
            value=datetime.utcnow().date() - timedelta(days=1),
            help="Uses /range/days endpoint for the chosen sensor.",
        )
        rate_hours = st.slider("Message rate window (hours)", 1, 72, 24, 1)
        force_refresh = st.button("Refresh now", type="primary")

    if not client_id or not client_secret:
        st.warning("Set OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET as environment variables to continue.")
        return

    cache_bust = str(time.time()) if force_refresh else "stable"

    try:
        token = fetch_token(client_id, client_secret)
    except Exception as exc:  # noqa: BLE001
        st.error(f"Failed to obtain OAuth token: {exc}")
        return

    sensors_df = fetch_sensor_list(token, cache_bust)
    if sensors_df.empty:
        st.warning("No sensor metadata returned for the configured serials.")
        return

    sensors_df = sensors_df[sensors_df["serial"].isin(selected_serials)].copy()
    if sensors_df.empty:
        st.warning("The selected site has no matching sensors in API results.")
        return

    online_count = int(sensors_df["online"].sum())
    last_seen = sensors_df["last_seen_dt"].max()
    st.subheader("Fleet snapshot")
    col1, col2, col3 = st.columns(3)
    col1.metric("Sensors in site", f"{len(sensors_df)}")
    col2.metric("Online", f"{online_count}")
    col3.metric("Latest contact (UTC)", last_seen.strftime("%Y-%m-%d %H:%M") if pd.notnull(last_seen) else "n/a")

    st.subheader("Sensor map")
    coverage_coords: List[List[float]] = []
    try:
        coverage_coords = fetch_coverage_polygon(
            token, coverage_serial, coverage_day.strftime("%Y%m%d"), cache_bust
        )
    except Exception as exc:  # noqa: BLE001
        st.error(f"Coverage polygon unavailable: {exc}")
    render_map(sensors_df, coverage_coords)

    st.subheader("Message rates")
    msg_df = pd.DataFrame()
    try:
        msg_df = fetch_msg_rates(token, selected_serials, rate_hours, cache_bust)
    except Exception as exc:  # noqa: BLE001
        st.error(f"Message rates unavailable: {exc}")

    if msg_df.empty:
        st.warning("No message rate data returned for the selected window.")
    else:
        msg_df = msg_df.merge(
            pd.DataFrame([{"serial": s, "site": SERIAL_TO_SITE.get(s, {}).get("name", site_choice)} for s in selected_serials]),
            on="serial",
            how="left",
        )
        msg_df = msg_df.sort_values("ts")
        st.line_chart(
            msg_df.pivot_table(index="ts", columns="serial", values="rate"),
            use_container_width=True,
        )

    st.subheader("Sensor details")
    display_cols = ["serial", "site", "type", "online", "latitude", "longitude", "added_dt", "last_seen_dt"]
    st.dataframe(sensors_df[display_cols], hide_index=True, use_container_width=True)


if __name__ == "__main__":
    main()
