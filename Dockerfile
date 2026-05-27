FROM r-base:latest

RUN apt-get update && apt-get install -y --no-install-recommends \
    cron libcurl4-openssl-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

RUN R -e 'install.packages(c("httr", "remotes"), repos = "https://cran.r-project.org")' && \
    R -e 'remotes::install_github("euctrl-pru/pocketlogR")'

WORKDIR /app

COPY scripts/poll_sensor_status.R scripts/
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
