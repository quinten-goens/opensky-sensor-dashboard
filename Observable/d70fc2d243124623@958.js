import define1 from "./ac578c640b130824@243.js";
import define2 from "./1ea380bf05fbf68c@338.js";

function _1(md){return(
md`# Geo: Rewind

## Ignore (and fix) poorly defined geometries

A recurring issue with spherical GeoJSON is errors in the winding order of the
polygons. This stream transform is an attempt to guard against these errors. It
can make a projection fool-proof, and it can fix your GeoJSON files.

The maps below show what happens with a base geometry and a base projection
(left); on the right, the projection automatically normalizes bad geometries.
(Rotate and zoom the maps to observe the differences.)
`
)}

function _2(width,DOM,d3,geoRewindProjection,simple,shape,geoRewindFeature,zoom,html)
{
  const W = width / 2 - 1;
  const contexts = [DOM.context2d(W, W + 20), DOM.context2d(W, W + 20)];
  const projection = d3
    .geoOrthographic()
    .rotate([0, -35])
    .fitExtent(
      [
        [2, 2],
        [W - 20, W - 20]
      ],
      { type: "Sphere" }
    )
    .clipExtent([
      [0, 0],
      [W, W]
    ]);

  function renderMap(context, i) {
    context.save();
    context.clearRect(0, 0, width, W + 30);
    const path =
      i === 0
        ? d3.geoPath(projection, context)
        : i === 1
        ? d3.geoPath(geoRewindProjection(projection, simple), context)
        : d3.geoPath(projection, context);
    const obj = i < 2 ? shape : geoRewindFeature(shape, simple);
    context.strokeStyle = "black";
    context.lineWidth = 0.5;
    context.globalAlpha = 0.6;
    context.beginPath();
    path(obj);
    context.fillStyle = "lime";
    context.fill();
    context.globalAlpha = 1;
    context.stroke();

    context.beginPath();
    context.lineWidth = 0.125;
    path(d3.geoGraticule10());
    context.stroke();

    context.lineWidth = 2;
    context.beginPath();
    path({ type: "Sphere" });
    context.stroke();

    context.fillStyle = "black";
    context.fillText(
      i === 0
        ? "Base GeoJSON & projection"
        : i === 1
        ? "Base GeoJSON, modified projection"
        : "Modified GeoJSON, base projection",
      0,
      W + 10
    );
  }
  function render() {
    contexts.forEach(renderMap);
  }

  d3.selectAll(contexts.map((d) => d.canvas))
    .call(zoom(projection).on("zoom.render end.render", render))
    .call(render);

  return html`<div style="display:flex">${contexts.map((d) => d.canvas)}`;
}


function _shape(Inputs,shapes){return(
Inputs.radio(shapes, {
  label: "shape",
  value: shapes.get("reversed poly with a hole")
})
)}

function _simple(Inputs){return(
Inputs.toggle({
  label: "rewind simple polygons larger than a hemisphere",
  value: true
})
)}

function _5(md){return(
md`A recurring issue with spherical GeoJSON polygons is errors in the winding order (see [#138](https://github.com/d3/d3-geo/issues/138)). The root cause of these errors is not always the same. It could be that you are using a file that respects a different convention than D3 and TopoJSON; or, because the shapes were modified in a program that doesn’t care for winding order and expected everything to be planar; other times, a rounding error during data handling… Alas when it happens, it’s painful: a shape that represents a tiny speck of land becomes inflated to represent the whole globe minus that tiny speck of land, the map fills with a uniform color, the local projection explodes.

This stream transform is an attempt to guard against these errors, and to fix them. It will rewind (in other words, change the winding order of) all the polygonal coordinates that trigger one of the following rules:
1. A simple polygon (with no holes) is larger than an hemisphere.
2. A polygon with a hole, whose outer ring does not contain the first point of its first hole.
3. A hole that doesn’t contain the first point of its parent.

*Note that rule 1 is optional: pass simple=false to deactivate it. We could even make it so that it configures the number of hemispheres that is acceptable (e.g. simple~=1.8 would cover most of the problematics cases).*

Usage:

\`\`\`js
// make a projection rewind
import {rewind} from "@fil/rewind"
const projection = d3.geoMercator();
const path = d3.geoPath(rewind(projection[, simple])[, context]);

// rewind a feature
import {rewind} from "@fil/rewind"
feature = rewind(feature[, simple]);

// raw stream (for developers)
import {geoRewindStream} from "@fil/rewind"
rewind = geoRewindStream([simple]);

\`\`\`

Making the projection fool-proof is the easiest approach to set up. However, it has two drawbacks. It requires more computations, so it is in theory slower (though I haven’t been able to measure a difference in practice); and in the case of simple polygons there is no unique solution: most of the time, it is because of a winding error— but for example, a [geoCircle](https://github.com/d3/d3-geo#geoCircle) with a radius greater than 90° is legitimate. For both these reasons, the best option might be to fix the geometries when you see they are incorrect.

---
`
)}

function _rewind(geoRewindProjection,geoRewindFeature){return(
function rewind(duck, simple) {
  return duck?.stream
    ? geoRewindProjection(duck, simple)
    : duck?.type
    ? geoRewindFeature(duck, simple)
    : Array.isArray(duck)
    ? Array.from(duck, (d) => rewind(d, simple))
    : duck;
}
)}

function _geoRewindFeature(geoProjectSimple,geoRewindStream){return(
(feature, simple) =>
  geoProjectSimple(feature, geoRewindStream(simple))
)}

function _8(d3,shape,rewind){return(
d3.geoArea(shape) - d3.geoArea(rewind(shape))
)}

function _9(rewind,shape){return(
rewind(shape)
)}

function _geoRewindProjection(geoRewindStream){return(
(projection, simple) => {
  const { stream: normalize } = geoRewindStream(simple);
  return { stream: (s) => normalize(projection.stream(s)) };
}
)}

function _geoRewindStream(d3){return(
function geoRewindStream(simple = true) {
  const { geoContains, geoArea } = d3;

  let ring, polygon;
  return d3.geoTransform({
    polygonStart() {
      this.stream.polygonStart();
      polygon = [];
    },
    lineStart() {
      if (polygon) polygon.push((ring = []));
      else this.stream.lineStart();
    },
    lineEnd() {
      if (!polygon) this.stream.lineEnd();
    },
    point(x, y) {
      if (polygon) ring.push([x, y]);
      else this.stream.point(x, y);
    },
    polygonEnd() {
      for (let [i, ring] of polygon.entries()) {
        ring.push(ring[0].slice());
        if (
          i
            ? // a hole must contain the first point of the polygon
              !geoContains(
                { type: "Polygon", coordinates: [ring] },
                polygon[0][0]
              )
            : polygon[1]
            ? // the outer ring must contain the first point of its first hole (if any)
              !geoContains(
                { type: "Polygon", coordinates: [ring] },
                polygon[1][0]
              )
            : // a single ring polygon must be smaller than a hemisphere (optional)
              simple &&
              geoArea({ type: "Polygon", coordinates: [ring] }) > 2 * Math.PI
        ) {
          ring.reverse();
        }

        this.stream.lineStart();
        ring.pop();
        for (const [x, y] of ring) this.stream.point(x, y);
        this.stream.lineEnd();
      }
      this.stream.polygonEnd();
      polygon = null;
    }
  });
}
)}

function _12(md){return(
md`The function below creates a shallow clone of the object, passing its coordinates through the projection. It is simpler than d3.geoProject, since it doesn’t try to rewind the projected polygons—and thus is suitable to pass the object through a function that maps spherical coordinates to spherical coordinates. (See an interesting [use case](https://observablehq.com/d/c062aa7bfcab40be).)`
)}

function _geoProjectSimple(d3)
{
  const { geoStream } = d3;
  return function (object, projection) {
    const stream = projection.stream;
    let project;
    if (!stream) throw new Error("invalid projection");
    switch (object && object.type) {
      case "Feature":
        project = projectFeature;
        break;
      case "FeatureCollection":
        project = projectFeatureCollection;
        break;
      default:
        project = projectGeometry;
        break;
    }
    return project(object, stream);
  };

  function projectFeatureCollection(o, stream) {
    return { ...o, features: o.features.map((f) => projectFeature(f, stream)) };
  }

  function projectFeature(o, stream) {
    return { ...o, geometry: projectGeometry(o.geometry, stream) };
  }

  function projectGeometryCollection(o, stream) {
    return {
      ...o,
      geometries: o.geometries.map((o) => projectGeometry(o, stream))
    };
  }

  function projectGeometry(o, stream) {
    return !o
      ? null
      : o.type === "GeometryCollection"
      ? projectGeometryCollection(o, stream)
      : o.type === "Polygon" || o.type === "MultiPolygon"
      ? projectPolygons(o, stream)
      : o;
  }

  function projectPolygons(o, stream) {
    let coordinates = [];
    let polygon, line;
    geoStream(
      o,
      stream({
        polygonStart() {
          coordinates.push((polygon = []));
        },
        polygonEnd() {},
        lineStart() {
          polygon.push((line = []));
        },
        lineEnd() {
          line.push(line[0].slice());
        },
        point(x, y) {
          line.push([x, y]);
        }
      })
    );
    if (o.type === "Polygon") coordinates = coordinates[0];
    return { ...o, coordinates, rewind: true };
  }
}


function _14(md){return(
md`---
*Supporting files for the demo*`
)}

function _shapes(ocean,d3){return(
new Map([
  [
    "reversed poly with a hole",
    {
      type: "Polygon",
      coordinates: [
        [
          [0, 0.5],
          [0, 30.5],
          [30, 30.5],
          [30, 0.5],
          [0, 0.5]
        ].reverse(),
        [
          [4, 4.4],
          [26, 4.4],
          [26, 26.4],
          [4, 26.4],
          [4, 4.4]
        ]
      ]
    }
  ],
  [
    "poly with a reversed hole",
    {
      type: "Polygon",
      coordinates: [
        [
          [0, 0.5],
          [0, 30.5],
          [30, 30.5],
          [30, 0.5],
          [0, 0.5]
        ],
        [
          [4, 4.4],
          [26, 4.4],
          [26, 26.4],
          [4, 26.4],
          [4, 4.4]
        ].reverse()
      ]
    }
  ],

  [
    "reversed poly with a reversed hole",
    {
      type: "Polygon",
      coordinates: [
        [
          [0, 0.5],
          [0, 30.5],
          [30, 30.5],
          [30, 0.5],
          [0, 0.5]
        ].reverse(),
        [
          [4, 4.4],
          [26, 4.4],
          [26, 26.4],
          [4, 26.4],
          [4, 4.4]
        ].reverse()
      ]
    }
  ],
  [
    "poly with a hole",
    {
      type: "Polygon",
      coordinates: [
        [
          [0, 0.5],
          [0, 30.5],
          [30, 30.5],
          [30, 0.5],
          [0, 0.5]
        ],
        [
          [4, 4.4],
          [26, 4.4],
          [26, 26.4],
          [4, 26.4],
          [4, 4.4]
        ]
      ]
    }
  ],
  ["ocean", ocean],
  [
    "simple reversed poly",
    {
      type: "Polygon",
      coordinates: [
        [
          [16, 16],
          [35, 0],
          [33, 6],
          [24, 26],
          [16, 16]
        ]
      ]
    }
  ],
  [
    "simple legal poly",
    {
      type: "Polygon",
      coordinates: [
        [
          [16, 16],
          [24, 26],
          [33, 6],
          [35, 0],
          [16, 16]
        ]
      ]
    }
  ],
  ["circle 33°", d3.geoCircle().radius(33)()],
  ["circle 110°", d3.geoCircle().radius(110)()]
])
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["width","DOM","d3","geoRewindProjection","simple","shape","geoRewindFeature","zoom","html"], _2);
  main.variable(observer("viewof shape")).define("viewof shape", ["Inputs","shapes"], _shape);
  main.variable(observer("shape")).define("shape", ["Generators", "viewof shape"], (G, _) => G.input(_));
  main.variable(observer("viewof simple")).define("viewof simple", ["Inputs"], _simple);
  main.variable(observer("simple")).define("simple", ["Generators", "viewof simple"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _5);
  main.variable(observer("rewind")).define("rewind", ["geoRewindProjection","geoRewindFeature"], _rewind);
  main.variable(observer("geoRewindFeature")).define("geoRewindFeature", ["geoProjectSimple","geoRewindStream"], _geoRewindFeature);
  main.variable(observer()).define(["d3","shape","rewind"], _8);
  main.variable(observer()).define(["rewind","shape"], _9);
  main.variable(observer("geoRewindProjection")).define("geoRewindProjection", ["geoRewindStream"], _geoRewindProjection);
  main.variable(observer("geoRewindStream")).define("geoRewindStream", ["d3"], _geoRewindStream);
  main.variable(observer()).define(["md"], _12);
  main.variable(observer("geoProjectSimple")).define("geoProjectSimple", ["d3"], _geoProjectSimple);
  main.variable(observer()).define(["md"], _14);
  main.variable(observer("shapes")).define("shapes", ["ocean","d3"], _shapes);
  const child1 = runtime.module(define1);
  main.import("ocean", child1);
  const child2 = runtime.module(define2);
  main.import("zoom", child2);
  return main;
}
