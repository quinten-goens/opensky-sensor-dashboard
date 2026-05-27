#!/bin/sh
set -e

SCHEDULE="${POLL_SCHEDULE:-0 * * * *}"

printenv | grep -E '^(OPENSKY_|POCKETBASE_|POCKETHOST_|POCKETLOG_)' > /app/env.sh
sed -i 's/^/export /' /app/env.sh

cat > /app/run_poll.sh <<'SCRIPT'
#!/bin/sh
. /app/env.sh
cd /app
Rscript scripts/poll_sensor_status.R >> /proc/1/fd/1 2>> /proc/1/fd/2
SCRIPT
chmod +x /app/run_poll.sh

echo "$SCHEDULE /app/run_poll.sh" > /etc/cron.d/poll-sensors
chmod 0644 /etc/cron.d/poll-sensors
crontab /etc/cron.d/poll-sensors

echo "Starting sensor poller (schedule: $SCHEDULE)"
echo "Running initial poll..."
/app/run_poll.sh

echo "Handing off to cron..."
exec cron -f
