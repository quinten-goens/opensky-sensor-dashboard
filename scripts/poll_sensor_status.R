library(httr)
library(pocketlogR)

POCKETHOST_BASE   <- "https://opdi.pockethost.io"
DETAILS_COLLECTION <- "opensky_sensor_details"
STATUS_COLLECTION  <- "opensky_sensor_status"
MASTER_FLOW_ID     <- "opdi_sensors"

AUTH_URL     <- "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
BASE_API_URL <- "https://opensky-network.org/api"

get_pb_token <- function() {
  email    <- Sys.getenv("POCKETBASE_ADMIN_EMAIL")
  password <- Sys.getenv("POCKETBASE_ADMIN_PASSWORD")
  if (nchar(email) == 0 || nchar(password) == 0) {
    stop("Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD.")
  }
  resp <- POST(
    paste0(POCKETHOST_BASE, "/api/admins/auth-with-password"),
    body = list(identity = email, password = password),
    encode = "json",
    timeout(20)
  )
  stop_for_status(resp)
  content(resp)$token
}

fetch_sensor_details <- function(token) {
  page <- 1
  rows <- list()
  repeat {
    resp <- GET(
      paste0(POCKETHOST_BASE, "/api/collections/", DETAILS_COLLECTION, "/records"),
      add_headers(Authorization = token, `User-Agent` = "opensky-sensor-poll-r"),
      query = list(page = page, perPage = 200, sort = "airport_icao,sensor_serial"),
      timeout(20)
    )
    stop_for_status(resp)
    payload <- content(resp)
    items   <- payload$items
    if (length(items) == 0) break
    rows <- c(rows, items)
    if (length(items) < 200) break
    page <- page + 1
  }
  rows
}

get_opensky_token <- function() {
  client_id     <- Sys.getenv("OPENSKY_CLIENT_ID")
  client_secret <- Sys.getenv("OPENSKY_CLIENT_SECRET")
  if (nchar(client_id) == 0 || nchar(client_secret) == 0) {
    stop("Set OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET.")
  }
  resp <- POST(
    AUTH_URL,
    body = list(
      grant_type    = "client_credentials",
      client_id     = client_id,
      client_secret = client_secret
    ),
    encode = "form",
    timeout(30)
  )
  stop_for_status(resp)
  content(resp)$access_token
}

fetch_sensor_list <- function(token) {
  resp <- GET(
    paste0(BASE_API_URL, "/sensor/list"),
    add_headers(Authorization = paste("Bearer", token)),
    timeout(30)
  )
  stop_for_status(resp)
  content(resp)
}

post_status <- function(pb_token, payload) {
  resp <- POST(
    paste0(POCKETHOST_BASE, "/api/collections/", STATUS_COLLECTION, "/records"),
    add_headers(
      Authorization  = pb_token,
      `Content-Type` = "application/json",
      `User-Agent`   = "opensky-sensor-poll-r"
    ),
    body = payload,
    encode = "json",
    timeout(20)
  )
  stop_for_status(resp)
}

build_serial_to_flow <- function(details) {
  serials <- vapply(details, function(d) {
    s <- d$sensor_serial
    if (is.null(s)) NA_integer_ else as.integer(s)
  }, integer(1))
  icaos <- vapply(details, function(d) {
    toupper(d$airport_icao %||% "unknown")
  }, character(1))

  order_idx <- order(serials)
  icao_counter <- list()
  mapping <- list()

  for (i in order_idx) {
    if (is.na(serials[i])) next
    icao <- icaos[i]
    if (nchar(icao) == 0) icao <- "unknown"
    icao_counter[[icao]] <- (icao_counter[[icao]] %||% 0L) + 1L
    slug <- tolower(gsub("[^a-zA-Z0-9]+", "_", icao))
    flow_id <- sprintf("opdi_sensor_%s_%d", slug, icao_counter[[icao]])
    mapping[[as.character(serials[i])]] <- flow_id
  }
  mapping
}

main <- function() {
  start_time <- Sys.time()

  conn <- pl_connect()

  pb_token     <- get_pb_token()
  details      <- fetch_sensor_details(pb_token)
  serial_to_flow <- build_serial_to_flow(details)
  opensky_token <- get_opensky_token()
  sensors_raw  <- fetch_sensor_list(opensky_token)

  sensors <- list()
  for (s in sensors_raw) {
    serial <- s$serial
    if (!is.null(serial)) sensors[[as.character(serial)]] <- s
  }

  now_ts   <- format(Sys.time(), "%Y-%m-%dT%H:%M:%OS3Z", tz = "UTC")
  n_ok     <- 0
  n_fail   <- 0
  errors   <- character(0)

  for (detail in details) {
    serial <- detail$sensor_serial
    if (is.null(serial)) next

    serial_chr <- as.character(serial)
    flow_id    <- serial_to_flow[[serial_chr]]
    icao       <- toupper(detail$airport_icao %||% "")
    airport    <- detail$airport_name %||% ""
    country    <- detail$country_name %||% ""
    country_iso3 <- toupper(detail$country_iso3 %||% "")

    sensor_info <- sensors[[serial_chr]]
    online      <- if (!is.null(sensor_info)) isTRUE(sensor_info$online) else FALSE

    payload <- list(
      sensor_site_airport_icao = icao,
      sensor_site_airport_name = airport,
      sensor_site_country_name = country,
      sensor_site_country_iso3 = country_iso3,
      sensor_serial            = serial,
      polling_time             = now_ts,
      sensor_online            = online
    )

    result <- tryCatch({
      post_status(pb_token, payload)
      message(sprintf("Posted %s (%s - %s) online=%s", serial, icao, airport, online))
      "ok"
    }, error = function(e) {
      warning(sprintf("Failed to post %s: %s", serial, conditionMessage(e)))
      conditionMessage(e)
    })

    if (!is.null(flow_id)) {
      if (result == "ok") {
        n_ok <- n_ok + 1
        pl_success(conn, flow_id, "sensor_status",
                   message = sprintf("Sensor %s online=%s", serial, online),
                   metadata = list(serial = serial, icao = icao, online = online))
      } else {
        n_fail <- n_fail + 1
        errors <- c(errors, sprintf("%s: %s", serial, result))
        pl_error(conn, flow_id, "sensor_status",
                 message = sprintf("Failed to poll sensor %s: %s", serial, result),
                 metadata = list(serial = serial, icao = icao))
      }
    }
  }

  elapsed <- as.numeric(difftime(Sys.time(), start_time, units = "secs"))

  if (n_fail == 0) {
    pl_success(conn, MASTER_FLOW_ID, "sensor_status",
               message = sprintf("All %d sensors polled successfully", n_ok),
               metadata = list(n_ok = n_ok, duration_s = round(elapsed, 1)))
  } else {
    pl_error(conn, MASTER_FLOW_ID, "sensor_status",
             message = sprintf("%d/%d sensors failed", n_fail, n_ok + n_fail),
             metadata = list(n_ok = n_ok, n_fail = n_fail,
                             errors = errors, duration_s = round(elapsed, 1)))
  }

  message(sprintf("Done: %d ok, %d failed (%.1fs)", n_ok, n_fail, elapsed))
}

main()
