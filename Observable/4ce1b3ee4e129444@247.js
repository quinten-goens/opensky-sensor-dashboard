import define1 from "./369418c199de0b44@186.js";

function _1(md){return(
md`# POI/Polylabel transform`
)}

function _2(Plot,width,height,projection,countries,poi){return(
Plot.plot({
  width,
  height,
  r: { type: "identity" },
  projection: ({ width, height }) =>
    projection.fitSize([width, height], { type: "Sphere" }),
  marks: [
    Plot.geo(countries),
    Plot.sphere(),
    Plot.dot(
      countries.features.map((d) => poi(d, projection)),
      {
        r: "distance",
        fill: "#f3f0d0",
        symbol: {
          // ellipse
          draw(context, size) {
            const r = Math.sqrt(size / Math.PI) * 0.95;
            context._ = `M 0 ${-r / 3} a ${r},${r / 3} 0 1,0 1,0`;
          }
        }
      }
    ),
    Plot.dot(
      countries.features.map((d) => poi(d, projection)),
      {
        r: 2,
        fill: "green"
      }
    ),
    Plot.dot(
      countries.features,
      Plot.centroid({
        r: 2,
        fill: "blue"
      })
    ),
    Plot.dot(
      countries.features,
      Plot.geoCentroid({
        r: 2,
        fill: "red"
      })
    ),
    Plot.tip(
      countries.features,
      Plot.pointer(
        Plot.centroid({
          geometry: (d) => ({
            type: "Point",
            coordinates: poi(d, projection) ?? []
          }),
          title: (d) => d.properties.name
        })
      )
    )
  ]
})
)}

function _polylabel(){return(
import("https://esm.sh/polylabel@2").then((d) => d.default)
)}

function _projection(geoHealpix,width,height){return(
geoHealpix()
  .rotate([-10, 0])
  .fitSize([width, height], { type: "Sphere" })
)}

function _height(width){return(
0.5 * width
)}

function _geoHealpix(){return(
import("https://esm.sh/d3-geo-polygon@next").then(
  (d) => d.geoHealpix
)
)}

function _poi(d3,polylabel){return(
function poi(g, projection = d3.geoIdentity().reflectY(true), alpha = 2) {
  const polygons = [];
  const holes = [];
  let ring;
  const context = {
    arc(x, y) {},
    moveTo(x, y) {
      ring = [[x, -alpha * y]];
    },
    lineTo(x, y) {
      ring.push([x, -alpha * y]);
    },
    closePath() {
      ring.push(ring[0]);
      if (d3.polygonArea(ring) > 0) polygons.push([ring]);
      else holes.push(ring);
    }
  };
  d3.geoPath(projection, context)(g);
  for (const h of holes)
    polygons.find(([ring]) => d3.polygonContains(ring, h[0]))?.push(h);
  const a = d3.greatest(
    polygons.map((d) => polylabel(d, 0.01)),
    (d) => d.distance
  );
  if (a) {
    [a[0], a[1]] = projection.invert([a[0], -a[1] / alpha]);
    return a;
  }
  return d3.geoPath(projection).centroid(g);
}
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["Plot","width","height","projection","countries","poi"], _2);
  main.variable(observer("polylabel")).define("polylabel", _polylabel);
  main.variable(observer("projection")).define("projection", ["geoHealpix","width","height"], _projection);
  main.variable(observer("height")).define("height", ["width"], _height);
  const child1 = runtime.module(define1);
  main.import("countries", child1);
  main.variable(observer("geoHealpix")).define("geoHealpix", _geoHealpix);
  main.variable(observer("poi")).define("poi", ["d3","polylabel"], _poi);
  return main;
}
