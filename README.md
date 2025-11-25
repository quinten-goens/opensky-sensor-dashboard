# OpenSky Sensor Dashboard (Streamlit)

A Streamlit remake of Xavier’s Olive Observable dashboard, focused on the predefined sensor fleet. It shows sensor status, coverage, and message rates for each site.

## Features
- Preset sites (ESSA, EYVI, EYPA, UGTB, UGSB, UGKO) with their known sensor serials and locations.
- OAuth2 client-credentials authentication to the OpenSky API.
- Sensor metadata table (online/offline, last connection, position).
- Coverage polygon for a chosen sensor/day via `/range/days`.
- Message rate time series for selected site sensors via `/stats/msg-rates`.

## Setup
1. Configure credentials  
   - Environment variables: `OPENSKY_CLIENT_ID`, `OPENSKY_CLIENT_SECRET`, or  
   - `.streamlit/secrets.toml`:
     ```toml
     opensky_client_id = "your-client-id"
     opensky_client_secret = "your-client-secret"
     ```
2. Install deps:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```
3. Run:
   ```bash
   streamlit run app.py
   ```

Use the sidebar to pick a site, sensor for coverage, coverage date (defaults to yesterday), and the message-rate lookback window. Click “Refresh now” to force a fresh fetch.
