import os
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

import altair as alt
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
        "sensors": [-1408232560, -1408232534, -1408232487],
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

COLOR_PALETTE = [
    [230, 120, 50],
    [78, 171, 211],
    [137, 68, 171],
    [58, 183, 94],
    [209, 140, 32],
    [46, 134, 193],
    [194, 62, 93],
    [84, 110, 122],
]


def normalize_serial(value: object) -> Optional[int]:
    """Convert serials to int while keeping sign; return None when invalid."""
    try:
        return int(str(value).strip())
    except (TypeError, ValueError, AttributeError):
        return None


def _build_serial_maps() -> Tuple[List[int], Dict[int, Dict[str, float]]]:
    serials = []
    mapping: Dict[int, Dict[str, float]] = {}
    for name, site in MONITOR_SITES.items():
        for raw_serial in site["sensors"]:
            serial = normalize_serial(raw_serial)
            if serial is None:
                continue
            serials.append(serial)
            mapping[serial] = {"name": name, "lat": site["lat"], "lon": site["lon"]}
    return sorted(set(serials)), mapping


ALL_SERIALS, SERIAL_TO_SITE = _build_serial_maps()
SERIAL_COLORS = {serial: COLOR_PALETTE[i % len(COLOR_PALETTE)] for i, serial in enumerate(ALL_SERIALS)}


def serial_color(serial: int, alpha: int = 200) -> List[int]:
    base = SERIAL_COLORS.get(serial, COLOR_PALETTE[0])
    return [*base, alpha]


def serial_hex(serial: int) -> str:
    r, g, b = SERIAL_COLORS.get(serial, COLOR_PALETTE[0])
    return f"#{r:02x}{g:02x}{b:02x}"


def _load_secrets(key: str, default: str = "") -> str:
    try:
        return st.secrets[key]
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
    if st.session_state.get("log_api", True):
        log_entry = {"url": url, "params": params or {}, "status": resp.status_code}
        st.session_state.setdefault("api_logs", []).append(log_entry)
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
    df["serial"] = df["serial"].apply(normalize_serial)
    df = df[df["serial"].notna()].copy()
    df["serial"] = df["serial"].astype(int)
    df = df[df["serial"].isin(ALL_SERIALS)].copy()
    df["site"] = df["serial"].apply(lambda s: SERIAL_TO_SITE.get(s, {}).get("name", ""))
    df["latitude"] = df["position"].apply(lambda p: p.get("latitude") if isinstance(p, dict) else None)
    df["longitude"] = df["position"].apply(lambda p: p.get("longitude") if isinstance(p, dict) else None)
    df["added_dt"] = pd.to_datetime(df["added"], unit="s", utc=True, errors="coerce")
    df["last_seen_dt"] = pd.to_datetime(df["lastConnectionEvent"], unit="s", utc=True, errors="coerce")
    return df


@st.cache_data(show_spinner=False, ttl=300)
def fetch_msg_rates(token: str, serials: List[int], hours: int, cache_bust: str) -> pd.DataFrame:
    serials = [s for s in (normalize_serial(s) for s in serials) if s is not None]
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
        serial = normalize_serial(sid)
        if serial is None:
            continue
        for item in values:
            rows.append(
                {
                    "serial": serial,
                    "ts": pd.to_datetime(item[0], unit="ms", utc=True),
                    "rate": item[1],
                }
            )
    return pd.DataFrame(rows)


@st.cache_data(show_spinner=False, ttl=600)
def fetch_coverage_polygon(token: str, serial: int, day: str, cache_bust: str) -> List[List[float]]:
    serial_val = normalize_serial(serial)
    if serial_val is None:
        return []
    params = {"days": day, "serials": serial_val}
    payload = _api_get("/range/days", token, params=params)
    day_data = payload.get(day) if isinstance(payload, dict) else None
    if not day_data:
        return []
    ranges = day_data[0].get("ranges", []) if isinstance(day_data, list) else []
    if not ranges:
        return []
    # API returns [distance, lat, lon]
    return [[r[2], r[1]] for r in ranges]


def render_msg_chart(msg_df: pd.DataFrame, serial_order: List[int], label_lookup: Dict[int, str]) -> None:
    if msg_df.empty:
        st.warning("No message rate data returned for the selected window.")
        return
    data = msg_df.copy()
    data["label"] = data["serial"].apply(lambda s: label_lookup.get(s, str(s)))
    data["label"] = data["label"].astype(str)
    domain = [label_lookup.get(s, str(s)) for s in serial_order]
    colors = [serial_hex(s) for s in serial_order]
    chart = (
        alt.Chart(data)
        .mark_line()
        .encode(
            x=alt.X("ts:T", title="Timestamp (UTC)"),
            y=alt.Y("rate:Q", title="Message rate"),
            color=alt.Color(
                "label:N",
                scale=alt.Scale(domain=domain, range=colors),
                legend=alt.Legend(title="Sensor"),
            ),
            tooltip=[
                alt.Tooltip("label:N", title="Sensor"),
                alt.Tooltip("ts:T", title="Timestamp (UTC)"),
                alt.Tooltip("rate:Q", title="Rate"),
            ],
        )
        .properties(height=320)
    )
    st.altair_chart(chart, use_container_width=True)


def render_map(sensor_df: pd.DataFrame, coverage_coords: List[List[float]], coverage_serial: Optional[int]) -> None:
    layers = []
    centers = sensor_df[["latitude", "longitude"]].dropna()
    center_lat = centers["latitude"].mean() if not centers.empty else 0.0
    center_lon = centers["longitude"].mean() if not centers.empty else 0.0

    if coverage_coords:
        fill_color = serial_color(coverage_serial, 80) if coverage_serial is not None else [255, 191, 121, 70]
        line_color = serial_color(coverage_serial, 200) if coverage_serial is not None else [240, 120, 50]
        layers.append(
            pdk.Layer(
                "PolygonLayer",
                data=[{"coords": coverage_coords, "fill_color": fill_color, "line_color": line_color}],
                get_polygon="coords",
                stroked=True,
                filled=True,
                get_fill_color="fill_color",
                get_line_color="line_color",
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
            sensor_df["color"] = sensor_df.apply(
                lambda row: serial_color(row["serial"], 220 if row.get("online", False) else 110), axis=1
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


def render_map_with_polygons(sensor_df: pd.DataFrame, coverage_polygons: List[Dict[str, object]]) -> None:
    layers = []
    centers = sensor_df[["latitude", "longitude"]].dropna()
    center_lat = centers["latitude"].mean() if not centers.empty else 0.0
    center_lon = centers["longitude"].mean() if not centers.empty else 0.0

    polygons = [poly for poly in coverage_polygons if poly.get("coords")]
    if polygons:
        poly_data = []
        for poly in polygons:
            serial = normalize_serial(poly.get("serial"))
            poly_data.append(
                {
                    "coords": poly.get("coords"),
                    "fill_color": serial_color(serial, 70) if serial is not None else [121, 191, 255, 60],
                    "line_color": serial_color(serial, 200) if serial is not None else [40, 120, 200],
                }
            )
        layers.append(
            pdk.Layer(
                "PolygonLayer",
                data=poly_data,
                get_polygon="coords",
                stroked=True,
                filled=True,
                get_fill_color="fill_color",
                get_line_color="line_color",
                line_width_min_pixels=2,
            )
        )
        poly_lats = [c[1] for poly in polygons for c in poly.get("coords", [])]
        poly_lons = [c[0] for poly in polygons for c in poly.get("coords", [])]
        if poly_lats and poly_lons:
            center_lat = sum(poly_lats) / len(poly_lats)
            center_lon = sum(poly_lons) / len(poly_lons)

    if not sensor_df.empty:
        df = sensor_df.copy()
        if "color" not in df.columns:
            df["color"] = df.apply(
                lambda row: serial_color(row["serial"], 220 if row.get("online", False) else 110), axis=1
            )
        layers.append(
            pdk.Layer(
                "ScatterplotLayer",
                data=df,
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
        initial_view_state=pdk.ViewState(latitude=center_lat, longitude=center_lon, zoom=4.5, pitch=30),
        layers=layers,
        tooltip={"text": "Serial: {serial}\nSite: {site}\nOnline: {online}\nLast seen: {last_seen_dt}"},
    )
    st.pydeck_chart(deck, use_container_width=True)


def main() -> None:
    st.set_page_config(page_title="OpenSky Sensor Dashboard", layout="wide")
    st.title("OpenSky Sensor Dashboard")
    st.caption("Monitoring the configured sensor fleet with coverage, status, and message rates.")

    client_id, client_secret = _get_credentials()
    st.session_state.setdefault("api_logs", [])
    st.session_state.setdefault("log_api", True)

    if not client_id or not client_secret:
        st.warning("Set OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET as environment variables to continue.")
        return

    force_refresh = st.button("Refresh now", type="primary")
    if force_refresh:
        st.session_state["api_logs"] = []
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

    tab_site, tab_all = st.tabs(["Site view", "All sensors"])

    with tab_site:
        st.subheader("Single site view")
        col_left, col_right = st.columns([2, 1])
        with col_left:
            site_choice = st.selectbox("Preset site", list(MONITOR_SITES.keys()), key="site_select")
        selected_serials = [
            s for s in (normalize_serial(s) for s in MONITOR_SITES[site_choice]["sensors"]) if s is not None
        ]
        with col_right:
            st.metric("Serials in site", f"{len(selected_serials)}")
            st.caption(f"{', '.join(map(str, selected_serials))}")

        col_a, col_b, col_c = st.columns([1, 1, 1])
        with col_a:
            coverage_serial = st.selectbox("Coverage focus", selected_serials, key="site_coverage_serial")
        with col_b:
            coverage_day = st.date_input(
                "Coverage day",
                value=datetime.utcnow().date() - timedelta(days=1),
                key="site_coverage_day",
                help="Uses /range/days endpoint for the chosen sensor.",
            )
        with col_c:
            rate_hours = st.slider("Msg rate window (hours)", 1, 72, 24, 1, key="site_rate_hours")

        site_df = sensors_df[sensors_df["serial"].isin(selected_serials)].copy()
        if site_df.empty:
            st.warning("The selected site has no matching sensors in API results.")
        else:
            online_count = int(site_df["online"].sum())
            last_seen = site_df["last_seen_dt"].max()
            st.subheader("Fleet snapshot")
            col1, col2, col3 = st.columns(3)
            col1.metric("Sensors in site", f"{len(site_df)}")
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
            render_map(site_df, coverage_coords, coverage_serial)

            st.subheader("Message rates")
            msg_df = pd.DataFrame()
            try:
                msg_df = fetch_msg_rates(token, selected_serials, rate_hours, cache_bust)
            except Exception as exc:  # noqa: BLE001
                st.error(f"Message rates unavailable: {exc}")

            if not msg_df.empty:
                msg_df = msg_df.merge(
                    pd.DataFrame(
                        [{"serial": s, "site": SERIAL_TO_SITE.get(s, {}).get("name", site_choice)} for s in selected_serials]
                    ),
                    on="serial",
                    how="left",
                )
                msg_df = msg_df.sort_values("ts")
            render_msg_chart(
                msg_df,
                selected_serials,
                {s: f"{s} ({SERIAL_TO_SITE.get(s, {}).get('name', site_choice)})" for s in selected_serials},
            )

            st.subheader("Sensor details")
            display_cols = ["serial", "site", "type", "online", "latitude", "longitude", "added_dt", "last_seen_dt"]
            st.dataframe(site_df[display_cols], hide_index=True, use_container_width=True)

        with st.expander("API requests (details)", expanded=False):
            logs = st.session_state.get("api_logs", [])
            if not logs:
                st.caption("No API requests yet.")
            else:
                log_text = "\n".join(
                    f"{entry['url']} params={entry['params']} status={entry['status']}" for entry in logs
                )
                st.code(log_text)

    with tab_all:
        st.subheader("All sensors")
        col_a, col_b = st.columns([1, 1])
        with col_a:
            all_coverage_day = st.date_input(
                "Coverage day (all)",
                value=datetime.utcnow().date() - timedelta(days=1),
                key="all_coverage_day",
                help="Fetches /range/days for each configured sensor.",
            )
        with col_b:
            all_rate_hours = st.slider(
                "Msg rate window (hours, all sensors)", 1, 72, 24, 1, key="all_rate_hours"
            )

        st.subheader("Coverage map (all sensors)")
        coverage_polygons: List[Dict[str, object]] = []
        prev_log_flag = st.session_state.get("log_api", True)
        st.session_state["log_api"] = False
        try:
            with st.spinner("Fetching coverage polygons for all sensors..."):
                for serial in ALL_SERIALS:
                    try:
                        polygon = fetch_coverage_polygon(token, serial, all_coverage_day.strftime("%Y%m%d"), cache_bust)
                        if polygon:
                            coverage_polygons.append({"serial": serial, "coords": polygon})
                    except Exception as exc:  # noqa: BLE001
                        st.warning(f"Coverage unavailable for {serial}: {exc}")
            render_map_with_polygons(sensors_df, coverage_polygons)

            st.subheader("Message rates (all sensors)")
            all_msg_df = pd.DataFrame()
            try:
                all_msg_df = fetch_msg_rates(token, ALL_SERIALS, all_rate_hours, cache_bust)
            except Exception as exc:  # noqa: BLE001
                st.error(f"Message rates unavailable: {exc}")

            if not all_msg_df.empty:
                all_msg_df = all_msg_df.merge(
                    pd.DataFrame(
                        [{"serial": s, "site": SERIAL_TO_SITE.get(s, {}).get("name", "")} for s in ALL_SERIALS]
                    ),
                    on="serial",
                    how="left",
                )
                all_msg_df = all_msg_df.sort_values("ts")
            render_msg_chart(
                all_msg_df,
                ALL_SERIALS,
                {s: f"{s} ({SERIAL_TO_SITE.get(s, {}).get('name', '')})".strip() for s in ALL_SERIALS},
            )
        finally:
            st.session_state["log_api"] = prev_log_flag

        st.subheader("All sensor details")
        display_cols = ["serial", "site", "type", "online", "latitude", "longitude", "added_dt", "last_seen_dt"]
        st.dataframe(sensors_df[display_cols].sort_values(["site", "serial"]), hide_index=True, use_container_width=True)


if __name__ == "__main__":
    main()
