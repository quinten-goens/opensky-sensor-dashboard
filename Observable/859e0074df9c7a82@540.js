import define1 from "./4ce1b3ee4e129444@247.js";

function _1(md){return(
md`# World FIRs with zoom and rotate
you can drag to rotate, and mouse-wheel to zoom.`
)}

function _projectionName(Inputs){return(
Inputs.select(
  new Map([
    ["Orthographic", "geoOrthographic"],
    // ["Bertin 1953", "geoBertin1953"],
    ["Azimuthal Equal-Area", "geoAzimuthalEqualArea"],
    // ["Cahill-Keyes", "geoCahillKeyes"],
    ["Mercator", "geoMercator"]
  ])
)
)}

function _flight_level(Inputs){return(
Inputs.range([0, 400], {
  label: "Flight level",
  step: 5,
  value: 100
})
)}

function _chart(Plot,width,height,colorscale,projection,svg,land50m,land110m,noFirs,firs100,d3,zoom)
{
  const updates = [];
  let chart = Plot.plot({
    width: width,
    height: height,
    color: { range: ["url(#crosshatch)", ...colorscale, ...colorscale] },
    projection,
    // projection: {
    //   type: ({ width, height }) =>
    //     projection.angle(11).fitSize([width, height], { type: "Sphere" })
    // },
    marks: [
      () =>
        // https://github.com/iros/patternfills
        svg`<defs><pattern id="crosshatch" patternUnits="userSpaceOnUse" width="8" height="8"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4JyBoZWlnaHQ9JzgnPgogIDxyZWN0IHdpZHRoPSc4JyBoZWlnaHQ9JzgnIGZpbGw9JyNmZmYnLz4KICA8cGF0aCBkPSdNMCAwTDggOFpNOCAwTDAgOFonIHN0cm9rZS13aWR0aD0nMC41JyBzdHJva2U9JyNhYWEnLz4KPC9zdmc+Cg==" x="0" y="0" width="8" height="8"> </image> </pattern></defs>`,
      Plot.sphere({ fill: "white", render }),
      Plot.geo([land50m, land110m], {
        stroke: "#333",
        strokeOpacity: 0.15,
        fill: "#ced4da",
        render: renderAlternative
      }),
      // Plot.graticule({ render }),
      Plot.geo(noFirs, {
        className: "fir",
        pointerEvents: "fill",
        fill: (d) => " ",
        fillOpacity: 0.4,
        strokeWidth: 1,
        stroke: "#fff",
        strokeOpacity: 0.2,
        title: (elt) => `No FIR area`,
        render: render
      }),
      Plot.geo(firs100, {
        className: "fir",
        pointerEvents: "fill",
        fill: (d) => d.properties.designator[0],
        fillOpacity: 0.4,
        strokeWidth: 1,
        stroke: "#fff",
        strokeOpacity: 0.2,
        title: (d) => `${d.properties.designator}\n${d.properties.name}`,
        render: render
      }),
      Plot.text(
        firs100,
        Plot.geoCentroid({
          text: (d) => `${d.properties.designator}`,
          title: (d) => `${d.properties.designator}\n${d.properties.name}`,
          fill: "black",
          stroke: "white",
          render: render
        })
      ),
      // highlight
      // () =>
      //   svg`<style>
      //     // g[aria-label=text]:has(text) :hover {stroke: red; stroke-width: 3; stroke-opacity: 0.7; transition: stroke-opacity .2s }
      //     // g[aria-label=geo] path:hover {stroke: red; stroke-width: 3; stroke-opacity: 0.7; transition: stroke-opacity .2s }
      //     .fir path:hover {stroke: red; stroke-width: 3; stroke-opacity: 0.7; transition: stroke-opacity .2s }
      //   `,
      // TODO: use POI
      // Plot.dot(
      //   firs100.map((d) => poi(d, projection)),
      //   {
      //     r: 2,
      //     fill: "blue",
      //     render: render
      //   }
      // ),
      () =>
        svg`<style>
          .fir path:hover {stroke: red; stroke-width: 2; stroke-opacity: 1.0; transition: stroke-opacity 1s }
        `,
      Plot.sphere({ stroke: "black", strokeWidth: 1, render: render })

      //
      // NOTE: if I keep this I do not get tooltips
      // Plot.frame({ stroke: "none", pointerEvents: "all" })
    ]
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


function _5(md){return(
md`Many Thanks to [@fil](https://observablehq.com/@fil) for his invaluable [help](https://github.com/observablehq/plot/discussions/2258) and [code](https://observablehq.com/@observablehq/plot-versor-zooming).

-------------------

#### Boring technical details`
)}

function _zoom(d3,versor){return(
function zoom(
  projection,
  {
    // Capture the projection’s original scale, before any zooming.
    scale = projection._scale === undefined
      ? (projection._scale = projection.scale())
      : projection._scale,
    scaleExtent = [0.8, 8]
  } = {}
) {
  let v0, q0, r0, a0, tl;

  const zoom = d3
    .zoom()
    .scaleExtent(scaleExtent.map((x) => x * scale))
    .on("start", zoomstarted)
    .on("zoom", zoomed);

  function point(event, that) {
    const t = d3.pointers(event, that);

    if (t.length !== tl) {
      tl = t.length;
      if (tl > 1) a0 = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
      zoomstarted.call(that, event);
    }

    return tl > 1
      ? [
          d3.mean(t, (p) => p[0]),
          d3.mean(t, (p) => p[1]),
          Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0])
        ]
      : t[0];
  }

  function zoomstarted(event) {
    v0 = versor.cartesian(projection.invert(point(event, this)));
    q0 = versor((r0 = projection.rotate()));
  }

  function zoomed(event) {
    projection.scale(event.transform.k);
    const pt = point(event, this);
    const v1 = versor.cartesian(projection.rotate(r0).invert(pt));
    const delta = versor.delta(v0, v1);
    let q1 = versor.multiply(q0, delta);

    // For multitouch, compose with a rotation around the axis.
    if (pt[2]) {
      const d = (pt[2] - a0) / 2;
      const s = -Math.sin(d);
      const c = Math.sign(Math.cos(d));
      q1 = versor.multiply([Math.sqrt(1 - s * s), 0, 0, c * s], q1);
    }

    projection.rotate(versor.rotation(q1));

    // In vicinity of the antipode (unstable) of q0, restart.
    if (delta[0] < 0.7) zoomstarted.call(this, event);
  }

  return Object.assign(
    (selection) =>
      selection
        .property("__zoom", d3.zoomIdentity.scale(projection.scale()))
        .call(zoom),
    {
      on(type, ...options) {
        return options.length
          ? (zoom.on(type, ...options), this)
          : zoom.on(type);
      }
    }
  );
}
)}

function _width_map(width){return(
width
)}

function _height_map(width){return(
(width * 1.816) / 4.6
)}

function _height(d3,projection,width,sphere)
{
  const [[x0, y0], [x1, y1]] = d3
    .geoPath(projection.fitWidth(width, sphere))
    .bounds(sphere);
  const dy = Math.ceil(y1 - y0),
    l = Math.min(Math.ceil(x1 - x0), dy);
  projection.scale((projection.scale() * (l - 1)) / l).precision(0.2);
  return dy;
}


function _10(projectionName){return(
projectionName
)}

function _projection(d3,projectionName){return(
d3[projectionName]().rotate([13, -43]).precision(0.1)
)}

function _firs100(firsAt,flight_level){return(
firsAt(flight_level).features.filter(
  (d) => d.properties.type !== "NO_FIR"
)
)}

function _noFirs(firsAt){return(
firsAt(100).features.filter((d) => d.properties.type === "NO_FIR")
)}

function _firsAt(topojson,worldfirs,d3){return(
function (fl) {
  /* This function picks all the FIR at a given flight level */
  const firs = topojson.feature(worldfirs, worldfirs.objects.data);
  const fixStitch = function (geometry) {
    const a = d3.geoStitch(geometry);
    a.type = "Polygon";
    a.coordinates = a.coordinates.flat();
    return a;
  };
  firs.features = firs.features
    .filter(
      (elt) =>
        elt.properties.lower <= fl &&
        fl < (elt.properties.upper ? elt.properties.upper : 999)
    )
    .map((elt) =>
      Object({
        type: "Feature",
        properties: {
          ...elt.properties,
          // add an empty string if the designator is empty (NO_FIR areas)
          designator: elt.properties.designator ? elt.properties.designator : ""
        },
        // Fix that bug for geoStitch
        geometry:
          elt.properties.designator === "NZZO"
            ? fixStitch(elt.geometry)
            : d3.geoStitch(elt.geometry)
      })
    );
  return firs;
}
)}

function _sphere(){return(
{ type: "Sphere" }
)}

function _colorscale(){return(
[
  "#393b79",
  "#5254a3",
  "#6b6ecf",
  "#9c9ede",
  "#637939",
  "#8ca252",
  "#b5cf6b",
  "#cedb9c",
  "#8c6d31",
  "#bd9e39",
  "#e7ba52",
  "#e7cb94",
  "#843c39",
  "#ad494a",
  "#d6616b",
  "#e7969c",
  "#7b4173",
  "#a55194",
  "#ce6dbd",
  "#de9ed6",
  "#636363",
  "#969696",
  "#bdbdbd",
  "#d9d9d9"
]
)}

function _land50m(FileAttachment,topojson){return(
FileAttachment("land-50m.json")
  .json()
  .then((world) => topojson.feature(world, world.objects.land))
)}

function _land110m(FileAttachment,topojson){return(
FileAttachment("land-110m.json")
  .json()
  .then((world) => topojson.feature(world, world.objects.land))
)}

function _versor(require){return(
require("versor@0.0.4")
)}

function _20(md){return(
md`Blindly copied from [Plot: Extended projections](https://observablehq.com/@observablehq/plot-extended-projections) page.`
)}

function _d3(require){return(
require.alias({
  d3: "d3@7.7.0/dist/d3.min.js",
  "d3-geo": "d3@7.7.0/dist/d3.min.js",
  "d3-array": "d3@7.7.0/dist/d3.min.js",
  "d3-geo-projection": "d3-geo-projection@4.0.0/dist/d3-geo-projection.min.js",
  "d3-geo-polygon": "d3-geo-polygon@1.12.1/dist/d3-geo-polygon.min.js"
})("d3", "d3-geo-projection", "d3-geo-polygon")
)}

function _worldfirs(FileAttachment){return(
FileAttachment("worldfirs.json").json()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["land-50m.json", {url: new URL("./files/7b6ff41e373e01d7b5b95773e297d40625bd9ccc1936a023a066a7edd8da5eaadec4ab7a565303539e41e001f2e6730f3ee1e259fae4f19dc59e8d6b2f2ec22b.json", import.meta.url), mimeType: "application/json", toString}],
    ["land-110m.json", {url: new URL("./files/eb3cf2004901ac67c600e74bb895394d6e415f6d6dcd96e1576eb8b6f0f7ca2d2277b9165904b6abc883f7e2c85210e9ada547aeeb72390815c7024c804b4577.json", import.meta.url), mimeType: "application/json", toString}],
    ["worldfirs.json", {url: new URL("./files/ec8b0b87b1403a849b74b5467855f392f4155f42ebd410356073b79aedc2543424f5da3651b02a313f4d7d77e3d4766197d222046d3b4986afe8bede974c3aae.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof projectionName")).define("viewof projectionName", ["Inputs"], _projectionName);
  main.variable(observer("projectionName")).define("projectionName", ["Generators", "viewof projectionName"], (G, _) => G.input(_));
  main.variable(observer("viewof flight_level")).define("viewof flight_level", ["Inputs"], _flight_level);
  main.variable(observer("flight_level")).define("flight_level", ["Generators", "viewof flight_level"], (G, _) => G.input(_));
  main.variable(observer("chart")).define("chart", ["Plot","width","height","colorscale","projection","svg","land50m","land110m","noFirs","firs100","d3","zoom"], _chart);
  main.variable(observer()).define(["md"], _5);
  main.variable(observer("zoom")).define("zoom", ["d3","versor"], _zoom);
  main.variable(observer("width_map")).define("width_map", ["width"], _width_map);
  main.variable(observer("height_map")).define("height_map", ["width"], _height_map);
  main.variable(observer("height")).define("height", ["d3","projection","width","sphere"], _height);
  main.variable(observer()).define(["projectionName"], _10);
  main.variable(observer("projection")).define("projection", ["d3","projectionName"], _projection);
  main.variable(observer("firs100")).define("firs100", ["firsAt","flight_level"], _firs100);
  main.variable(observer("noFirs")).define("noFirs", ["firsAt"], _noFirs);
  main.variable(observer("firsAt")).define("firsAt", ["topojson","worldfirs","d3"], _firsAt);
  main.variable(observer("sphere")).define("sphere", _sphere);
  main.variable(observer("colorscale")).define("colorscale", _colorscale);
  main.variable(observer("land50m")).define("land50m", ["FileAttachment","topojson"], _land50m);
  main.variable(observer("land110m")).define("land110m", ["FileAttachment","topojson"], _land110m);
  main.variable(observer("versor")).define("versor", ["require"], _versor);
  main.variable(observer()).define(["md"], _20);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("worldfirs")).define("worldfirs", ["FileAttachment"], _worldfirs);
  const child1 = runtime.module(define1);
  main.import("poi", child1);
  return main;
}
