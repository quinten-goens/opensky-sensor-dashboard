# AIU Logger — Flow Integration Guide

This file is intended to be copied into another project's `CLAUDE.md` so Claude knows how to create flow definitions and add operational logging using `pocketlogR`.

## Architecture

- **Flow registration is centralised** in the `aiu-logger` repo (`config/flows_config.json`).
- **Logging happens from any repo** — scripts call `pl_success` / `pl_error` at runtime using the flow name.
- When adding new flows, you generate a `flows_config.json` **fragment** in this repo, then it gets merged into `aiu-logger`.

## 1. Creating a flows_config.json fragment

Create a file called `flows_config.json` (or `flows_config_fragment.json`) with the following structure:

```json
{
  "flows": [
    {
      "id": "my_etl_job",
      "description": "Monthly airport traffic ETL; loads traffic data from source and validates row counts",
      "type": "data_job",
      "schedule": "0 6 15 * *",
      "status": "ongoing",
      "owner": "AIU/OPS",
      "metadata": {
        "source": "NM",
        "depends_on": ["upstream_flow_name"]
      }
    }
  ]
}
```

### Required fields

| Field         | Description                                                                                  |
|---------------|----------------------------------------------------------------------------------------------|
| `id`          | Unique snake_case identifier. Must be globally unique across all repos.                      |
| `description` | One-liner: what it is + what the check/job does. E.g. `"CO2 emissions dataset (xlsx); checks dataset exists and is downloadable, and verifies data timeframe is up to date"` |
| `type`        | What kind of process this is (see Flow Types below)                                          |
| `schedule`    | Cron expression (`"0 9 15 * *"` = 9am on the 15th monthly). Use `"0 0 31 2 *"` for one-off/manual flows |
| `status`      | `"ongoing"` (actively monitored) or `"discontinued"` (archived, not registered in PocketBase) |
| `owner`       | Team or person responsible, e.g. `"AIU/OPS"`, `"AIU/ENV"`, `"AIU/ECO"`, `"AIU/CBA"`         |

### Optional fields

| Field         | When to use                                                                             |
|---------------|-----------------------------------------------------------------------------------------|
| `url`         | Target URL — the website or dataset download link being checked                         |
| `format`      | For `dataset_check` flows: `"xlsx"`, `"xlsm"`, `"csv"`, `"csv.bz2"`, `"parquet"`       |
| `time_column` | For `dataset_check` flows: array of column names used for freshness checks, e.g. `["YEAR", "MONTH"]` |
| `sheet`       | For `dataset_check` flows: Excel sheet name containing the data, e.g. `"DATA"`, `"csv"` |
| `metadata`    | Arbitrary JSON object for extra context (git repo URL, API keys reference, etc.)         |

### Flow types

| `type`           | Use for                                                        |
|------------------|----------------------------------------------------------------|
| `data_job`       | ETL / data load pipeline                                       |
| `dataset_check`  | Verify a published dataset is accessible and data is up to date|
| `website_status` | Check a website is online and its git repo is recently updated |
| `email_check`    | Check if an expected email was received                        |
| `db_check`       | Database freshness check                                       |

Any string is accepted — these are conventions, not enforced enums.

### Description conventions

Descriptions should follow this pattern:
```
<What it is> (<format/variant if applicable>); <what the check or job does>
```

Examples:
- `"Airport traffic (daily IFR arrivals/departures) (xlsx); checks dataset exists and is downloadable, and verifies data timeframe is up to date"`
- `"Aviation Intelligence Portal; checks website is online and verifies last commit timestamp and version tag are within the expected update schedule"`
- `"Monthly NM traffic ETL; loads IFR movements from Network Manager and validates row counts against previous month"`

### Dataset flows with yearly CSV splits

When a dataset is published as one CSV per year, create one flow per year. Use the pattern:

```json
{
  "id": "my_dataset_csv_2026",
  "description": "My dataset (2026); checks dataset exists and is downloadable, and verifies data timeframe is up to date",
  "type": "dataset_check",
  "format": "csv",
  "url": "https://example.com/data/my_dataset_2026.csv",
  "schedule": "0 9 15 * *",
  "status": "ongoing",
  "owner": "AIU/OPS",
  "time_column": ["YEAR", "MONTH_NUM"],
  "sheet": "csv"
}
```

Past years should have `"status": "discontinued"` and `"schedule": "0 0 31 2 *"`.

## 2. Adding logging to an R script

### Install pocketlogR

```r
# install.packages("devtools")
devtools::install_github("euctrl-pru/pocketlogR")
```

### Environment variables (never hardcode)

Set in `.Renviron` or system environment:

| Variable             | Description                 |
|----------------------|-----------------------------|
| `POCKETLOG_URL`      | PocketBase instance URL     |
| `POCKETLOG_EMAIL`    | Service account email       |
| `POCKETLOG_PASSWORD` | Service account password    |

### Basic pattern

```r
library(pocketlogR)

conn <- pl_connect()

tryCatch({
  # ... your work here ...

  pl_success(conn, "my_flow_name", "data_job",
             message = "Completed successfully",
             metadata = list(rows = n, duration_s = elapsed))
}, error = function(e) {
  pl_error(conn, "my_flow_name", "data_job",
           message = conditionMessage(e))
})
```

### Logging function signatures

```r
pl_success(conn, flow, log_type, message = NULL, metadata = NULL)
pl_error(conn,   flow, log_type, message = NULL, metadata = NULL)
pl_fatal(conn,   flow, log_type, message = NULL, metadata = NULL)
```

- `flow` — the `id` from `flows_config.json` (must be registered in PocketBase first)
- `log_type` — free-text label for the kind of check: `"data_job"`, `"website_online"`, `"website_status"`, `"db_check"`, `"email_check"`
- `metadata` — any named R list, serialised to JSON automatically
- These functions never throw — they retry 3x internally, then warn and return NULL

### What NOT to do

- Do not call `pl_setup()` — collections already exist
- Do not call `pl_connect_admin()` — not needed for logging
- Do not call `pl_create_flow()` — flows are registered centrally via `aiu-logger`
- Do not wrap `pl_success` / `pl_error` in `tryCatch` — they handle errors internally
- Do not log inside tight loops — log once per job run

## 3. Workflow: end to end

1. **Define your flows** — create a `flows_config.json` fragment in your repo following the schema above
2. **Submit to aiu-logger** — copy/merge the fragment entries into `aiu-logger/config/flows_config.json`
3. **Register flows** — run `Rscript R/setup_flows.R` in `aiu-logger` (only creates new flows, skips existing ones)
4. **Add logging** — in your repo's R scripts, use `pl_connect()` + `pl_success()` / `pl_error()` with the flow `id`
5. **Verify** — check PocketBase or use `pl_get_status(conn, "my_flow_name")` to confirm logs arrive
