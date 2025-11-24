import define1 from "./b2bbebd2f186ed03@1312.js";
import define2 from "./859e0074df9c7a82@540.js";

function _1(md){return(
md`# OpenSky Network dashboard`
)}

function _2(md){return(
md`## Number of daily messages`
)}

function _logscale(Inputs){return(
Inputs.toggle({ label: "Log scale" })
)}

function _max_date(Inputs,til){return(
Inputs.range(["2013", til], {
  value: til,
  step: 1,
  label: "Until"
})
)}

function _5(Plot,api_stats,max_date,annotations,d3,width,logscale){return(
Plot.plot({
  marks: [
    Plot.line(
      api_stats.filter((elt) => elt.date < new Date(`${max_date + 1}-01-01`)),
      Plot.windowY({
        x: "date",
        y: "daily",
        k: max_date >= 2017 ? 28 : 1,
        stroke: "#f58518"
        // TODO: to put the month tick for Mar, Jun and Sep? [but how?], Apr/Jul/Oct see below Plot.axisX
        // tickFormat: formatDate
      })
    ),
    Plot.axisX({ ticks: "3 months" }),
    Plot.text(
      annotations
        .filter((elt) => elt.date < new Date(`2016-01-01`))
        .filter((elt) => elt.date < new Date(`${max_date + 1}-01-01`)),
      {
        x: (d) => d.date,
        y: "value",
        text: (d) => `${d3.timeFormat("%B %Y")(d.date)}\n${d.text}`,
        lineHeight: 1.3,
        dx: 5,
        textAnchor: "start"
      }
    ),
    Plot.text(
      annotations
        .filter((elt) => elt.date >= new Date(`2016-01-01`))
        .filter((elt) => elt.date < new Date(`${max_date + 1}-01-01`)),
      {
        x: (d) => d.date - new Date(10 * 24 * 3600000),
        y: "value",
        text: (d) => `${d3.timeFormat("%B %Y")(d.date)}\n${d.text}`,
        lineHeight: 1.3,
        dx: -5,
        textAnchor: "end"
      }
    ),
    Plot.arrow(
      annotations
        .filter((elt) => elt.date < new Date(`2016-01-01`))
        .filter((elt) => elt.date < new Date(`${max_date + 1}-01-01`)),
      {
        x2: "date",
        x1: (d) => d.date,
        y1: "value",
        y2: (d) =>
          api_stats.find((t) => t.date.toISOString() === d.date.toISOString())
            .daily,
        bend: -10,
        inset: 0,
        head: null,
        strokeOpacity: 0.5
      }
    ),
    Plot.arrow(
      annotations
        .filter((elt) => elt.date >= new Date(`2016-01-01`))
        .filter((elt) => elt.date < new Date(`${max_date + 1}-01-01`)),
      {
        x2: "date",
        x1: (d) => d.date - new Date(10 * 24 * 3600000),
        y1: "value",
        y2: (d) =>
          api_stats.find((t) => t.date.toISOString() === d.date.toISOString())
            .daily,
        bend: 10,
        inset: 0,
        head: null,
        strokeOpacity: 0.5
      }
    )
  ],
  width,
  grid: true,
  y: {
    label: "↑ Number of messages",
    type: logscale ? "log" : "linear",
    tickFormat: "s"
  },
  caption: "Number of daily messages received by the OpenSky Network"
})
)}

function _total(d3,api_stats,max_date){return(
d3.format("s")(d3.sum(
  api_stats
    .filter((elt) => elt.date < new Date(`${max_date + 1}-01-01`))
    .map((elt) => elt.daily)
))
)}

function _7(md){return(
md`Feel free to add more events in the list below!`
)}

function* _annotations(d3,api_stats,max_date)
{
  const max_value = d3.max(
    api_stats
      .filter((elt) => elt.date < new Date(`${max_date + 1}-01-01`))
      .map((elt) => elt.daily)
  );
  yield [
    {
      date: new Date("2020-03-22"),
      value: 25e9,
      text: "COVID-19"
    },
    {
      date: new Date("2019-02-27"),
      value: 28e9,
      text: "Stopped anonymous feeding"
    },
    {
      date: new Date("2016-11-01"),
      value: 3.5e9,
      text: "Open network to anonymous feeders"
    },
    {
      date: new Date("2016-03-01"),
      value: 1.5e9,
      text: "Storing Mode S messages"
    },
    {
      date: new Date("2013-06-15"),
      value: d3.max([28e6, d3.min([5e9, 0.5 * max_value])]),
      text: "Initial deployment with 10 SBS-3 receivers"
    }
  ];
}


function _9(md){return(
md`## Sensors

If only one sensor is selected (filtered or ticked), you should see its coverage area on the map below. (Consider a more local projection)`
)}

function _searchSensors(Inputs,sensors_list,online,findCountry,d3,years){return(
Inputs.search(
  sensors_list
    .filter((x) => x.lastConnectionEvent > 0)
    .filter((elt) => (online === null ? true : elt.online === online))
    .map(
      (x) =>
        new Object({
          ...x,
          latitude: x.position.latitude,
          longitude: x.position.longitude,
          added: new Date(x.added * 1000),
          lastConnectionEvent: new Date(x.lastConnectionEvent * 1000),
          country: findCountry([x.position.longitude, x.position.latitude])
            ?.properties.sovereignt
        })
    )
    .filter(
      (elt) =>
        (d3.timeFormat("%Y")(elt.added) >= years[0]) &
        (d3.timeFormat("%Y")(elt.added) <= years[1])
    ),
  {
    placeholder: "Search sensors"
  }
)
)}

function _online(Inputs){return(
Inputs.radio(new Map([["All", null], ["online only", true], ["offline only", false]]), {label: "Online/offline:", value: null})
)}

function _sensors(Inputs,searchSensors,html,d3){return(
Inputs.table(searchSensors, {
  columns: [
    "uid",
    "type",
    "latitude",
    "longitude",
    "serial",
    "online",
    "added",
    "lastConnectionEvent",
    "country"
  ],
  sort: "lastConnectionEvent",
  reverse: true,
  layout: "auto",
  format: {
    serial: (elt) => html`<code>${elt}</code>`,
    lastConnectionEvent: (elt) => d3.timeFormat("%Y-%m-%d")(elt)
  },
  header: { lastConnectionEvent: "connected" }
})
)}

function _years(rangeSlider){return(
rangeSlider({
  min: 2017,
  max: 2024,
  step: 1,
  //title: "The optional title",
  description: "Filter by year interval"
})
)}

function _projectionName(Inputs){return(
Inputs.select(
  new Map([
    ["World (Orthographic)", "geoOrthographic"],
    ["World (Bertin 1953)", "geoBertin1953"],
    ["Europe", "Europe"],
    ["Europe - France", "France"],
    ["Europe - Germany", "Germany"],
    ["Europe - Georgia", "Georgia"],
    // ["Europe", "geoAzimuthalEqualArea"],
    // ["Cahill-Keyes", "geoCahillKeyes"],
    ["Mercator", "geoMercator"]
  ]),
  { label: "Projection" }
)
)}

function _15(md){return(
md`Grey = offline`
)}

function _map(Plot,projection,land50m,land110m,countries,d3,sensors,coverage_poly,width,height,zoom)
{
  const updates = [];

  let chart = Plot.plot({
    projection,
    marks: [
      Plot.geo(
        { type: "Sphere" },
        { fill: "#73cdff44", stroke: "#bab0ac", render: render }
      ),
      Plot.geo([land50m, land110m], {
        stroke: "#333",
        strokeOpacity: 0.15,
        fill: "#ced4da",
        render: renderAlternative
      }),
      Plot.geo(countries, {
        stroke: "#333",
        strokeWidth: 0.2,
        fill: "#ced4da",
        render: render,
        title: (d) => `${d.properties.name}`
      }),
      Plot.graticule({ stroke: "#222", render: render }),
      Plot.geo(
        d3
          .sort(sensors, (elt) => elt.online)
          .map((x) =>
            Object({
              type: "Point",
              coordinates: [x.longitude, x.latitude],
              properties: x
            })
          ),
        {
          fill: (elt) => (elt.properties.online ? "#f58518" : "#bab0ac"),
          opacity: (elt) => (elt.properties.online ? 0.7 : 0.4),
          title: (x) => `${x.properties.uid}\n(${x.properties.country})`,
          render: render
        }
      ),
      Plot.geo(coverage_poly, {
        fill: "#ffbf7999",
        stroke: "#f58518",
        render: render
      })
    ],
    width,
    height
  });

  // https://observablehq.com/@d3/testing-projection-visibility
  function tester(projection, X, Y) {
    let visible;
    const stream = projection.stream({
      point() {
        visible = true;
      }
    });
    return (i) => ((visible = false), stream.point(X[i], Y[i]), visible);
  }

  // Replaces the output when zooming; this also covers marks such as Plot.dot that have x and y channels
  function render(i, s, v, d, c, n) {
    let g = n(i, s, v, d, c);
    if (v.x && v.y && !this.curve) {
      const X = v.channels.x.value;
      const Y = v.channels.y.value;
      updates.push(() => {
        i = d3.range(v.x.length).filter(tester(projection, X, Y));
        for (const j of i) [v.x[j], v.y[j]] = projection([X[j], Y[j]]);
        g.replaceWith((g = n(i, s, v, d, c)));
      });
    } else {
      updates.push(() => g.replaceWith((g = n(i, s, v, d, c))));
    }
    return g;
  }

  // This alternative (for Plot.geo only) renders the second or first geometry,
  // depending on whether the zoom is active
  function renderAlternative(i, s, v, d, c, n) {
    let g = n([0], s, v, d, c);
    updates.push((active) => g.replaceWith((g = n([active], s, v, d, c))));
    return g;
  }

  return d3
    .select(chart)
    .call(
      zoom(projection)
        .on("zoom.render", () => updates.forEach((update) => update(1)))
        .on("end.render", () => updates.forEach((update) => update(0)))
    )
    .node();
}


function _17(d3,sensors,Plot)
{
  const data = new Array(
    ...d3.rollup(
      sensors.filter((x) => x.online),
      (g) => g.length,
      (elt) => elt.country
    )
  ).map((x) => Object({ country: x[0], count: x[1] }));
  const thres = d3.quantile(
    data.map((x) => x.count),
    0.85
  );
  const max = d3.max(data.map((x) => x.count));
  return Plot.plot({
    marks: [
      Plot.barX(
        data.filter((x) => x.count > thres),
        { y: "country", x: "count", sort: { y: "x", reverse: true } }
      ),
      Plot.text(
        data.filter((x) => x.count > thres).filter((x) => x.count >= 0.3 * max),
        {
          x: "count",
          y: "country",
          text: "country",
          textAnchor: "end",
          fill: "white",
          fontSize: 14,
          dx: -5
        }
      ),
      Plot.text(
        data.filter((x) => x.count > thres).filter((x) => x.count < 0.3 * max),
        {
          x: "count",
          y: "country",
          text: "country",
          textAnchor: "start",
          fill: "black",
          fontSize: 14,
          dx: 5
        }
      )
    ],
    y: { label: "", tickFormat: (x) => "" },
    caption: "Countries with more sensors"
  });
}


function _18(d3,sensors,Plot)
{
  let data = new Array(
    ...d3.rollup(
      sensors.filter((x) => x.online),
      (g) => g.length,
      (elt) => elt.uid
    )
  ).map((x) => Object({ uid: x[0], count: x[1] }));
  const thres = d3.quantile(
    data.map((x) => x.count),
    0.8
  );
  data = data.filter((x) => x.count > thres).slice(0, 15);
  const max = d3.max(data.map((x) => x.count));
  return Plot.plot({
    marks: [
      Plot.barX(data, {
        y: "uid",
        x: "count",
        sort: { y: "x", reverse: true }
      }),
      Plot.text(
        data.filter((x) => x.count >= 0.3 * max),
        {
          x: "count",
          y: "uid",
          text: "uid",
          textAnchor: "end",
          fill: "white",
          fontSize: 14,
          dx: -5
        }
      ),
      Plot.text(
        data.filter((x) => x.count < 0.3 * max),
        {
          x: "count",
          y: "uid",
          text: "uid",
          textAnchor: "start",
          fill: "black",
          fontSize: 14,
          dx: 5
        }
      )
    ],
    y: { label: "", tickFormat: (x) => "" },
    caption: "Users with more sensors"
  });
}


function _19(md){return(
md`## Message rates`
)}

function* _20(d3,rates,Plot)
{
  let data = new Array(
    ...d3.rollup(
      rates.filter((x) => x.type !== "Asterix"),
      (g) => g.length,
      (elt) => elt.type
    )
  ).map((x) => Object({ type: x[0], count: x[1] }));
  yield Plot.plot({
    marks: [
      Plot.barX(data, { x: "count", y: "type", fill: "type" }),
      Plot.text(
        data.filter((x) => x.count < 200),
        {
          x: "count",
          y: "type",
          text: (elt) => ` ${elt.count}`,
          textAnchor: "start",
          offsetX: 10
        }
      )
    ],
    marginLeft: 80,
    x: { label: "Number of active receivers →" },
    y: { label: "" },
    text: { fontSize: 14 }
  });
}


function _21(Plot,rates){return(
Plot.plot({
  marks: [
    Plot.rectY(
      rates.filter((x) => x.type !== "Asterix" && x.mean > 0),
      Plot.binX(
        { y: "count" },
        { x: { thresholds: 50, value: "mean" }, fill: "type" }
      )
    ),
    Plot.ruleY([0])
  ],
  color: { legend: true },
  y: {
    //type: "symlog",
    domain: [0, 50],
    clamp: true,
    label: "↑ Number of receivers (clipped at 50)"
  },
  x: { /*domain: [0, 2000],*/ label: "Average rate of message per second →" },
  height: 300
  // width
})
)}

function _height(width)
{
  // const [[x0, y0], [x1, y1]] = d3
  //   .geoPath(projection.fitWidth(width, sphere))
  //   .bounds(sphere);
  // const dy = Math.ceil(y1 - y0),
  //   l = Math.min(Math.ceil(x1 - x0), dy);
  // projection.scale((projection.scale() * (l - 1)) / l).precision(0.2);
  // return dy;
  return width;
}


function _24(sensors){return(
sensors.length
)}

function _25(sensors){return(
sensors
)}

function _coverage_poly(coverage,yesterday){return(
coverage !== undefined
  ? new Object({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates:
          coverage[yesterday].length > 0
            ? [coverage[yesterday][0].ranges.map((x) => [x[2], x[1]])]
            : []
      }
    })
  : []
)}

function* _coverage(yesterday,serial,URLSearchParams,CORS_PROXY,TOKEN)
{
  const targetUrl = "https://opensky-network.org/api/range/days";

  // Parameters to be added to the target URL
  const params = {
    days: yesterday,
    serials: serial
  };

  // Create the query string for the target URL
  const queryString = new URLSearchParams(params).toString();

  // Encode the full target URL
  const encodedTargetUrl = encodeURIComponent(`${targetUrl}?${queryString}`);

  yield fetch(CORS_PROXY + `${targetUrl}?${queryString}` /*encodedTargetUrl*/, {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  }).then((x) => x.json());
}


function _28(coverage,yesterday){return(
coverage[yesterday][0].sensorPosition
)}

function _29(coverage,yesterday){return(
coverage[yesterday][0].serial
)}

function _serial(sensors){return(
sensors[0].serial
)}

function _yesterday(d3){return(
d3.timeFormat("%Y%m%d")(new Date() - 3600000 * 24)
)}

function _til(){return(
new Date().getUTCFullYear()
)}

function _formatDate(d3)
{
  const formatYear = d3.timeFormat("%Y");
  const formatMonth = d3.timeFormat("%b");
  return d => (((d.getDate() === 1 && d.getMonth() === 1)) ? formatYear : formatMonth)(d);
}


function _bbox_europe(turf){return(
turf.bboxPolygon([-1.422729, 38.362118, 26.174927, 54.33174])
)}

function _bbox_north_america(turf){return(
turf.bboxPolygon([
  -171.255569, 13.705366, -46.965179, 74.019543
])
)}

function _bbox_south_america(turf){return(
turf.bboxPolygon([
  -95.392914, -57.153748, -32.111664, 18.28217
])
)}

function _projection_europe(d3,margin,width,height,eu){return(
d3
  .geoAzimuthalEquidistant()
  .rotate([-9, -34])
  // .fitSize([width, height], bbox_europe)
  // .fitExtent(
  //   [
  //     [0, 0],
  //     [width - 0, height - 0]
  //   ],
  //   bbox_europe
  // )
  .fitExtent(
    [
      [margin, margin],
      [width - margin, height - margin]
    ],
    // deu
    // isl,
    // geo,
    eu
  )
  .precision(0.1)
)}

function _projection_georgia(d3,margin,width,height,geo){return(
d3
  .geoAzimuthalEquidistant()
  .rotate([-9, -34])
  // .fitSize([width, height], bbox_europe)
  // .fitExtent(
  //   [
  //     [0, 0],
  //     [width - 0, height - 0]
  //   ],
  //   bbox_europe
  // )
  .fitExtent(
    [
      [margin, margin],
      [width - margin, height - margin]
    ],
    // deu
    // isl,
    geo
    // eu
  )
  .precision(0.1)
)}

function _projection_france(d3,margin,width,height){return(
d3
  .geoAzimuthalEquidistant()
  .rotate([-9, -34])
  .fitExtent(
    [
      [margin, margin],
      [width - margin, height - margin]
    ],
    // bbox France metro: -5.680523,41.095912,10.321591,51.412912
    {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [-5.680523, 41.095912]
          }
        },
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [10.321591, 51.412912]
          }
        }
      ]
    }
  )
  .precision(0.1)
)}

function _projection_germany(d3,margin,width,height,deu){return(
d3
  .geoAzimuthalEquidistant()
  .rotate([-9, -34])
  // .fitSize([width, height], bbox_europe)
  // .fitExtent(
  //   [
  //     [0, 0],
  //     [width - 0, height - 0]
  //   ],
  //   bbox_europe
  // )
  .fitExtent(
    [
      [margin, margin],
      [width - margin, height - margin]
    ],
    deu
  )
  .precision(0.1)
)}

function _margin(){return(
10
)}

function _projection(projectionName,projection_europe,projection_france,projection_germany,projection_georgia,d3,width,height,sphere)
{
  const margin = 10;
  // const projEurope = d3
  //   .geoAzimuthalEqualArea()
  //   // .rotate([-12.593343052928994, -48.2953339204481, 6.8206436530138586])
  //   // .scale(1200)
  //   .fitExtent(
  //     [
  //       [margin, margin],
  //       [width - margin, height - margin]
  //     ],
  //     bbox_europe
  //   )
  //   .precision(0.1);

  let proj = null;
  switch (projectionName) {
    case "Europe":
      proj = projection_europe;
      break;
    case "France":
      proj = projection_france;
      break;
    case "Germany":
      proj = projection_germany;
      break;
    case "Georgia":
      proj = projection_georgia;
      break;
    default:
      proj = d3[projectionName]()
        .rotate([13, -43])
        .fitExtent(
          [
            [margin, margin],
            [width - margin, height - margin]
          ],
          sphere
        )
        .precision(0.1);
  }
  return proj;
}


function _sphere(){return(
{ type: "Sphere" }
)}

function _countries(d3){return(
d3.json(
  "https://unpkg.com/visionscarto-world-atlas@0.0.6/world/50m_countries.geojson"
)
)}

function _api_json(CORS_PROXY,TOKEN){return(
fetch(
  CORS_PROXY + "https://opensky-network.org/api/stats/facts?extended=true",
  {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  }
).then((x) => x.json())
)}

function _api_stats(api_json){return(
api_json["Message Counts"].map(
  (x) => new Object({ date: new Date(x[0]), daily: x[1], cumul: x[2] })
)
)}

function _sensors_list(CORS_PROXY,TOKEN){return(
fetch(
  CORS_PROXY + "https://opensky-network.org/api/sensor/list",
  {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  }
).then((d) => d.json())
)}

function _TOKEN(){return(
"eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ0SVIwSDB0bmNEZTlKYmp4dFctWEtqZ0RYSWExNnR5eU5DWHJxUzJQNkRjIn0.eyJleHAiOjE3NTk2Nzg0NjEsImlhdCI6MTc1OTY3NjY2MSwianRpIjoiYTEwYmJiYmEtM2EzYS00ZmJlLTk3ZjQtOGEzNGExNDA2ODUxIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLm9wZW5za3ktbmV0d29yay5vcmcvYXV0aC9yZWFsbXMvb3BlbnNreS1uZXR3b3JrIiwiYXVkIjpbIndlYnNpdGUtdWkiLCJhY2NvdW50Il0sInN1YiI6ImQ5MTk5ZWVhLWNmOTktNDY5NS05ZTE4LWRiZDMxZjliYjdmYSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImVzcGluaWVsbGktYXBpLWNsaWVudCIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJPUEVOU0tZX0FQSV9ERUZBVUxUIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLW9wZW5za3ktbmV0d29yayJdfSwicmVzb3VyY2VfYWNjZXNzIjp7IndlYnNpdGUtdWkiOnsicm9sZXMiOlsib3BlbnNreV93ZWJzaXRlX3VzZXIiXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoiZXNwaW5pZWxsaS1hcGktY2xpZW50IiwiY2xpZW50SG9zdCI6IjEwOS4xMzYuMTExLjczIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtZXNwaW5pZWxsaS1hcGktY2xpZW50IiwiY2xpZW50QWRkcmVzcyI6IjEwOS4xMzYuMTExLjczIn0.XcByiRb8cFWNgDTUtIEzMFyFPYVWdrRqwSzZs11aKVgQMfJfDCf2HmdPty6mvI1A0rVLnvq-SoTD15XUYBI5ckHL5_ER2aoPzi2tTpRThd9gcrtWgZwwHntg2XlkZu5lr73xq8RBw_leEI1Q-54cbvz56d5ebBh1pA3MiWiV4272L8NFY9RpSUF_PfBfkVgBroIbAxaOr7sRdzIGNAbfk8mfsoWvrVfcY1xYjtMda04bHP0y4WWRzbCqtZ9lLxTbtFSSK8XdP5bNFgCGYoh1X6tHJtxWefplS0PZunBjc3xDBX03isefAXFInv5vVDhfPG3e7-bs3SyJlBtMNP1weg"
)}

function _types(sensors_list){return(
new Map(sensors_list.map((x) => [x.serial, x.type]))
)}

function _rates(axios,CORS_PROXY,types,d3){return(
axios({
  method: "get",
  url: CORS_PROXY + "https://opensky-network.org/api/stats/msg-rates"
  /* params: {
    begin: +d3.timeParse("%Y-%m-%d %Z")("2023-08-01 12:00Z") / 1000,
    end: +d3.timeParse("%Y-%m-%d %Z")("2023-08-02 13:00Z") / 1000,
    serials: sensors_list
      .filter((elt) => elt.active)
      .map((elt) => elt.serial)
      .join(",")
  }*/
}).then((x) =>
  Object.entries(x.data.series)
    .map(
      (x) =>
        new Object({
          serial: +x[0],
          type: types.get(+x[0]),
          values: x[1].map(
            (x) => new Object({ time: new Date(x[0]), value: x[1] })
          ),
          mean: d3.mean(x[1].map((elt) => elt[1])),
          max: d3.max(x[1].map((elt) => elt[1]))
        })
    )
    .filter((x) => x.type)
)
)}

function _deu(countries){return(
countries.features.filter((d) => d.properties.name == "Germany")[0]
)}

function _isl(countries){return(
countries.features.filter((d) => d.properties.name == "Iceland")[0]
)}

function _geo(countries){return(
countries.features.filter((d) => d.properties.name == "Georgia")[0]
)}

function _eu(goo,countries){return(
goo.featurecollection(
  countries.features.filter(
    (d) =>
      (d.properties.name == "Georgia") |
      (d.properties.name == "Armenia") |
      ((d.properties.continent == "Europe") &
        // filter Russia out so as to avoid to include the whole of Asia
        (d.properties.name != "Russia") &
        // filter out all the ex-colonies
        (d.properties.name != "Netherlands") &
        (d.properties.name != "France") &
        (d.properties.name != "United Kingdom"))
  )
)
)}

function _findCountry(width,d3,countries)
{
  const w = width;
  const projection = d3.geoEquirectangular().fitExtent(
    [
      [0, 0],
      [w, w >> 1]
    ],
    { type: "Sphere" }
  );
  const id0 = new Uint16Array((w * w) >> 1);
  const context = d3
    .create("canvas")
    .attr("width", w)
    .attr("height", w >> 1)
    .node()
    .getContext("2d");
  const path = d3.geoPath(projection, context);

  let r = 0;
  for (const f of countries.features) {
    ++r;
    context.clearRect(0, 0, w, w >> 1);
    context.beginPath();
    path(f);
    context.fill();
    const { data } = context.getImageData(0, 0, w, w >> 1);
    for (let i = 0; i < data.length >> 2; ++i) {
      if (data[4 * i + 3]) {
        id0[i] = r;
      }
    }
  }

  return function ([lon, lat]) {
    const [x, y] = projection([lon, lat]);
    const x0 = Math.floor(x),
      y0 = Math.floor(y);
    const i = id0[y0 * w + x0] - 1;
    if (i >= 0) return countries.features[i];
  };
}


function _CORS_PROXY(){return(
"http://localhost:8888/"
)}

function _axios(require){return(
require("axios")
)}

function _d3(require){return(
require("d3@7", "d3-geo@3", "d3-geo-projection@4", "d3-ease@2")
)}

function _turf(require){return(
require("@turf/turf@5")
)}

function _versor(require){return(
require("versor@0.0.4")
)}

function _goo(require){return(
require("geotoolbox@2")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("viewof logscale")).define("viewof logscale", ["Inputs"], _logscale);
  main.variable(observer("logscale")).define("logscale", ["Generators", "viewof logscale"], (G, _) => G.input(_));
  main.variable(observer("viewof max_date")).define("viewof max_date", ["Inputs","til"], _max_date);
  main.variable(observer("max_date")).define("max_date", ["Generators", "viewof max_date"], (G, _) => G.input(_));
  main.variable(observer()).define(["Plot","api_stats","max_date","annotations","d3","width","logscale"], _5);
  main.variable(observer("total")).define("total", ["d3","api_stats","max_date"], _total);
  main.variable(observer()).define(["md"], _7);
  main.variable(observer("annotations")).define("annotations", ["d3","api_stats","max_date"], _annotations);
  main.variable(observer()).define(["md"], _9);
  main.variable(observer("viewof searchSensors")).define("viewof searchSensors", ["Inputs","sensors_list","online","findCountry","d3","years"], _searchSensors);
  main.variable(observer("searchSensors")).define("searchSensors", ["Generators", "viewof searchSensors"], (G, _) => G.input(_));
  main.variable(observer("viewof online")).define("viewof online", ["Inputs"], _online);
  main.variable(observer("online")).define("online", ["Generators", "viewof online"], (G, _) => G.input(_));
  main.variable(observer("viewof sensors")).define("viewof sensors", ["Inputs","searchSensors","html","d3"], _sensors);
  main.variable(observer("sensors")).define("sensors", ["Generators", "viewof sensors"], (G, _) => G.input(_));
  main.variable(observer("viewof years")).define("viewof years", ["rangeSlider"], _years);
  main.variable(observer("years")).define("years", ["Generators", "viewof years"], (G, _) => G.input(_));
  main.variable(observer("viewof projectionName")).define("viewof projectionName", ["Inputs"], _projectionName);
  main.variable(observer("projectionName")).define("projectionName", ["Generators", "viewof projectionName"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _15);
  main.variable(observer("map")).define("map", ["Plot","projection","land50m","land110m","countries","d3","sensors","coverage_poly","width","height","zoom"], _map);
  main.variable(observer()).define(["d3","sensors","Plot"], _17);
  main.variable(observer()).define(["d3","sensors","Plot"], _18);
  main.variable(observer()).define(["md"], _19);
  main.variable(observer()).define(["d3","rates","Plot"], _20);
  main.variable(observer()).define(["Plot","rates"], _21);
  main.variable(observer("height")).define("height", ["width"], _height);
  main.variable(observer()).define(["sensors"], _24);
  main.variable(observer()).define(["sensors"], _25);
  main.variable(observer("coverage_poly")).define("coverage_poly", ["coverage","yesterday"], _coverage_poly);
  main.variable(observer("coverage")).define("coverage", ["yesterday","serial","URLSearchParams","CORS_PROXY","TOKEN"], _coverage);
  main.variable(observer()).define(["coverage","yesterday"], _28);
  main.variable(observer()).define(["coverage","yesterday"], _29);
  main.variable(observer("serial")).define("serial", ["sensors"], _serial);
  main.variable(observer("yesterday")).define("yesterday", ["d3"], _yesterday);
  main.variable(observer("til")).define("til", _til);
  main.variable(observer("formatDate")).define("formatDate", ["d3"], _formatDate);
  main.variable(observer("bbox_europe")).define("bbox_europe", ["turf"], _bbox_europe);
  main.variable(observer("bbox_north_america")).define("bbox_north_america", ["turf"], _bbox_north_america);
  main.variable(observer("bbox_south_america")).define("bbox_south_america", ["turf"], _bbox_south_america);
  main.variable(observer("projection_europe")).define("projection_europe", ["d3","margin","width","height","eu"], _projection_europe);
  main.variable(observer("projection_georgia")).define("projection_georgia", ["d3","margin","width","height","geo"], _projection_georgia);
  main.variable(observer("projection_france")).define("projection_france", ["d3","margin","width","height"], _projection_france);
  main.variable(observer("projection_germany")).define("projection_germany", ["d3","margin","width","height","deu"], _projection_germany);
  main.variable(observer("margin")).define("margin", _margin);
  main.variable(observer("projection")).define("projection", ["projectionName","projection_europe","projection_france","projection_germany","projection_georgia","d3","width","height","sphere"], _projection);
  main.variable(observer("sphere")).define("sphere", _sphere);
  const child1 = runtime.module(define1);
  main.import("rangeSlider", child1);
  main.variable(observer("countries")).define("countries", ["d3"], _countries);
  main.variable(observer("api_json")).define("api_json", ["CORS_PROXY","TOKEN"], _api_json);
  main.variable(observer("api_stats")).define("api_stats", ["api_json"], _api_stats);
  main.variable(observer("sensors_list")).define("sensors_list", ["CORS_PROXY","TOKEN"], _sensors_list);
  main.variable(observer("TOKEN")).define("TOKEN", _TOKEN);
  main.variable(observer("types")).define("types", ["sensors_list"], _types);
  main.variable(observer("rates")).define("rates", ["axios","CORS_PROXY","types","d3"], _rates);
  main.variable(observer("deu")).define("deu", ["countries"], _deu);
  main.variable(observer("isl")).define("isl", ["countries"], _isl);
  main.variable(observer("geo")).define("geo", ["countries"], _geo);
  main.variable(observer("eu")).define("eu", ["goo","countries"], _eu);
  main.variable(observer("findCountry")).define("findCountry", ["width","d3","countries"], _findCountry);
  main.variable(observer("CORS_PROXY")).define("CORS_PROXY", _CORS_PROXY);
  main.variable(observer("axios")).define("axios", ["require"], _axios);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  const child2 = runtime.module(define2);
  main.import("zoom", child2);
  main.import("land50m", child2);
  main.import("land110m", child2);
  main.variable(observer("turf")).define("turf", ["require"], _turf);
  main.variable(observer("versor")).define("versor", ["require"], _versor);
  main.variable(observer("goo")).define("goo", ["require"], _goo);
  return main;
}
