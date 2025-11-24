function _1(md){return(
md`<div style="color: grey; font: 13px/25.5px var(--sans-serif); text-transform: uppercase;"><h1 style="display: none;">Plot: Voronoi labels</h1><a href="/plot">Observable Plot</a> › <a href="/@observablehq/plot-gallery">Gallery</a></div>

# Voronoi labels

Using the [Voronoi diagram](https://github.com/d3/d3-delaunay) to limit label occlusion. See also [D3: Voronoi labels](https://observablehq.com/@d3/voronoi-labels), [occlusion](https://observablehq.com/@fil/occlusion), and [Plot issue #27](https://github.com/observablehq/plot/issues/27).`
)}

function _showVoronoi(Inputs){return(
Inputs.toggle({ label: "show voronoi", value: true })
)}

function _activate(Inputs){return(
Inputs.toggle({ label: "move to centroids", value: true })
)}

function _4(Plot,width,showVoronoi,airports,maybeVoronoiCentroids){return(
Plot.plot({
  width,
  height: width * 0.7,
  inset: 20,
  marks: [
    Plot.frame(),
    showVoronoi
      ? Plot.voronoiMesh(airports, { x: "longitude", y: "latitude" })
      : null,
    Plot.arrow(
      airports,
      maybeVoronoiCentroids({
        x1: "longitude",
        y1: "latitude",
        x2: "longitude",
        y2: "latitude",
        stroke: "black",
        strokeWidth: 0.7,
        bend: true,
        headLength: 0
      })
    ),
    Plot.dot(airports, {
      x: "longitude",
      y: "latitude",
      r: 1.5,
      fill: "black"
    }),
    Plot.text(
      airports,
      maybeVoronoiCentroids({
        x: "longitude",
        y: "latitude",
        text: (d) => d.name.split(/ /)[0],
        stroke: "white",
        strokeWidth: 7,
        fill: "black"
      })
    )
  ]
})
)}

function _5(md){return(
md`The custom **voronoiCentroids** options transform (code below) modifies the ﹤x, y﹥ position channels (for the text mark)—and ﹤x2, y2﹥, for the link mark— to reflect the cendroid of the associated polygon in the Voronoi diagram created by the data. This allows to position text labels where there is more space, thus limiting occlusion. If you pass a link or arrow mark, that has ﹤x1, y1, x2, y2﹥ positions, the ﹤x1, y1﹥ channels are left intact as the starting point, with ﹤x2, y2﹥ being the end point.`
)}

function _voronoiCentroids(Plot,d3){return(
(options) =>
  Plot.initializer(
    options,
    function (
      data,
      facets,
      { x: X0, y: Y0, x2: X2, y2: Y2 },
      { x, y },
      { width, height, marginLeft, marginRight, marginTop, marginBottom },
      context
    ) {
      const X = X2 ?? X0;
      const Y = Y2 ?? Y0;
      if (X.scale !== "x") x = (x) => x;
      if (Y.scale !== "y") y = (y) => y;

      for (const I of facets) {
        const v = d3.Delaunay.from(
          I,
          (i) => x(X.value[i]),
          (i) => y(Y.value[i])
        ).voronoi([
          marginLeft,
          marginTop,
          width - marginRight,
          height - marginBottom
        ]);
        let cell;
        for (const [i, k] of I.entries()) {
          if ((cell = v.cellPolygon(k))) {
            const [x, y] = d3.polygonCentroid(cell);
            X.value[i] = x;
            Y.value[i] = y;
          }
        }
      }
      delete X.scale;
      delete Y.scale;
      return { data, facets };
    }
  )
)}

function _maybeVoronoiCentroids(activate,voronoiCentroids){return(
activate ? voronoiCentroids : (options) => options
)}

function _8(md){return(
md`---
_data_`
)}

function _airports(FileAttachment){return(
FileAttachment("airports.csv")
  .csv({ typed: true })
  .then((data) => data.filter((d, i) => i % 20 === 0))
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["airports.csv", {url: new URL("./files/3ba6ffc2faf6f7ee4be0ed0566243932de17192846f8645847a5f7b580b339f9ba604a70b017eeaa8c4a5e1a4032d5a87e828a8e73512d5445226b3b83ac7a29.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof showVoronoi")).define("viewof showVoronoi", ["Inputs"], _showVoronoi);
  main.variable(observer("showVoronoi")).define("showVoronoi", ["Generators", "viewof showVoronoi"], (G, _) => G.input(_));
  main.variable(observer("viewof activate")).define("viewof activate", ["Inputs"], _activate);
  main.variable(observer("activate")).define("activate", ["Generators", "viewof activate"], (G, _) => G.input(_));
  main.variable(observer()).define(["Plot","width","showVoronoi","airports","maybeVoronoiCentroids"], _4);
  main.variable(observer()).define(["md"], _5);
  main.variable(observer("voronoiCentroids")).define("voronoiCentroids", ["Plot","d3"], _voronoiCentroids);
  main.variable(observer("maybeVoronoiCentroids")).define("maybeVoronoiCentroids", ["activate","voronoiCentroids"], _maybeVoronoiCentroids);
  main.variable(observer()).define(["md"], _8);
  main.variable(observer("airports")).define("airports", ["FileAttachment"], _airports);
  return main;
}
