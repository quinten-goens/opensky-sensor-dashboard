function _1(md){return(
md`# Ocean`
)}

function _2(DOM,width,height,d3,projection,ocean,ocean_without_caspian,caspian)
{
  const context = DOM.context2d(width, height),
    path = d3.geoPath(projection, context);

  projection.fitExtent([[2, 2], [width - 2, height - 2]], { type: "Sphere" });

  context.fillStyle = "#eee";
  context.beginPath();
  path(ocean);
  context.fill();

  context.lineCap = "round";
  context.lineWidth = 1;

  context.strokeStyle = "#ccc";
  context.beginPath();
  path(ocean_without_caspian);
  context.stroke();

  context.strokeStyle = "#a00";
  context.beginPath();
  path(caspian);
  context.fill();
  context.stroke();

  return context.canvas;
}


function _3(md){return(
md`The ocean(s) can be described by a super large GeoJSON Polygon that covers the whole sphere and basically contains only holes (*i.e.* counter-clockwise rings) in the shape of continents & islands.

The only clockwise part is the Caspian Sea — it’s a hole in the hole that is Eurasia. We can filter it out if we want: it’s the only ring with a small area. (Oddly, in the 10m-resolution world [topojson](https://github.com/topojson/topojson-specification), there are three other such parts, located in the Maldives archipelago.)

The following derives the Ocean topology from the [world-atlas](https://github.com/topojson/world-atlas) description of the land.`
)}

function _precision(Inputs){return(
Inputs.select(["110m", "50m", "10m"], { label: "precision" })
)}

function _url(precision){return(
`https://unpkg.com/world-atlas@2/land-${precision}.json`
)}

function _world(url){return(
fetch(url).then(d => d.json())
)}

function _7(md){return(
md`In this topojson file, the *land* object is a GeometryCollection containing a list of polygons (in GeoJSON, a “MultiPolygon”) that each describes the coastline of a continent, or of an island, as a list of arcs:`
)}

function _8(world){return(
world.objects.land
)}

function _9(md){return(
md`To create the ocean Polygon, one just needs to run the coastlines in reverse order.

First, extract all the arcs from all the land polygons, as one large list of arcs with:
> …geometries.map(polygon => polygon.arcs).flat(2)

then read the points on the arcs in the reverse order:
> … arcs.map(s => ~s)…

finally, assemble the arcs in reverse order:
> … arcs….reverse()
`
)}

function _objects_ocean(world){return(
{
  type: "GeometryCollection",
  geometries: [
    {
      type: "Polygon",
      arcs: world.objects.land.geometries
        .map(polygon => polygon.arcs).flat(2)
        .map(arcs => arcs.map(s => ~s).reverse())
    }
  ]
}
)}

function _11(md){return(
md`Et voilà:`
)}

function _ocean(topojson,world,objects_ocean){return(
topojson.feature(world, objects_ocean)
)}

function _13(d3,ocean){return(
d3.geoArea(ocean)
)}

function _caspian(ocean,d3)
{
  const s = JSON.parse(JSON.stringify(ocean));
  s.features[0].geometry.coordinates = s.features[0].geometry.coordinates.filter(
    d => d3.geoArea({ type: "Polygon", coordinates: [d] }) < 2 * Math.PI
  );
  return s;
}


function _ocean_without_caspian(ocean,d3)
{
  const s = JSON.parse(JSON.stringify(ocean));
  s.features[0].geometry.coordinates = s.features[0].geometry.coordinates.filter(
    d => d3.geoArea({ type: "Polygon", coordinates: [d] }) >= 2 * Math.PI
  );
  return s;
}


function _16(md){return(
md`---
_boring zone_`
)}

function _topojson(require){return(
require("topojson@3")
)}

function _d3(require){return(
require("d3@7", "d3-geo-polygon@1.8")
)}

function _projection(d3){return(
d3.geoImago()
)}

function _height(width){return(
width * (413 / 954)
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["DOM","width","height","d3","projection","ocean","ocean_without_caspian","caspian"], _2);
  main.variable(observer()).define(["md"], _3);
  main.variable(observer("viewof precision")).define("viewof precision", ["Inputs"], _precision);
  main.variable(observer("precision")).define("precision", ["Generators", "viewof precision"], (G, _) => G.input(_));
  main.variable(observer("url")).define("url", ["precision"], _url);
  main.variable(observer("world")).define("world", ["url"], _world);
  main.variable(observer()).define(["md"], _7);
  main.variable(observer()).define(["world"], _8);
  main.variable(observer()).define(["md"], _9);
  main.variable(observer("objects_ocean")).define("objects_ocean", ["world"], _objects_ocean);
  main.variable(observer()).define(["md"], _11);
  main.variable(observer("ocean")).define("ocean", ["topojson","world","objects_ocean"], _ocean);
  main.variable(observer()).define(["d3","ocean"], _13);
  main.variable(observer("caspian")).define("caspian", ["ocean","d3"], _caspian);
  main.variable(observer("ocean_without_caspian")).define("ocean_without_caspian", ["ocean","d3"], _ocean_without_caspian);
  main.variable(observer()).define(["md"], _16);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("projection")).define("projection", ["d3"], _projection);
  main.variable(observer("height")).define("height", ["width"], _height);
  return main;
}
