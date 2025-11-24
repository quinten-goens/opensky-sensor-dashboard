import define1 from "./d70fc2d243124623@958.js";
import define2 from "./e2b859b59f7bc3e6@213.js";

function _1(md){return(
md`# geo

This is a collection of useful geo symbols, shapes, projections & tools, that I want around when I work on maps. Feel free to use them too! You can either fork this notebook or import symbols directly from it:

Usage:
~~~js
import {symbol} from "@visionscarto/geo"
~~~
`
)}

function _2(md){return(
md`---
#### Rewind poorly-oriented polygons

~~~js
import {rewind} from "@visionscarto/geo"
rewind(feature[, true]) // or rewind(projection[, true])
~~~`
)}

function _4(md){return(
md`---
#### Plot

~~~js
// No need to load it since I haven’t made additions wrt the version in stdlib
// import {Plot} from "@visionscarto/geo"
Plot.geo(feature).plot()
~~~`
)}

function _5(md){return(
md`---
#### voronoiCentroids

~~~js
import {voronoiCentroids} from "@visionscarto/geo"
Plot.text(data, voronoiCentroids({x: "lon", y: "lat", text: "text"}))
~~~`
)}

function _7(md){return(
md`---
#### airports

~~~js
import {airports} from "@visionscarto/geo"
>> "name", "longitude", "latitude"
~~~`
)}

function _airports(FileAttachment){return(
FileAttachment("airports.csv").csv({ typed: true })
)}

function _9(md){return(
md`---
#### nuts
*European regions*

~~~js
import {nuts} from "@visionscarto/geo"
~~~`
)}

function _nuts(FileAttachment){return(
FileAttachment("nuts.json").json()
)}

function _11(md){return(
md`---
### cities

*source: [Geonames](https://www.geonames.org/about.html). Data wrangling in [this notebook](https://observablehq.com/@fil/cities-csv-data-preparation).*
`
)}

function _cities1k(FileAttachment){return(
FileAttachment("cities1000.csv").csv({ typed: true })
)}

function _cities10k(FileAttachment){return(
FileAttachment("cities10000.csv").csv({ typed: true })
)}

function _basemaps(md){return(
md`---
### topojson base maps / world-atlas

These base maps are originally from the [topojson/world-atlas](https://github.com/topojson/world-atlas) project, derived from Natural Earth. We modified them to reflect the United Nations’ position on the integrity of Ukraine and the non-self-governing territory of Western Sahara, but they include three places that are not independent according to the United Nations: Somaliland, Taiwan, and Kosovo. We also fixed a few topology errors. Each feature on the map has a numerical ID, and its properties are a name and a three-letter code (a3). [This notebook](/@visionscarto/world-atlas-topojson) details the changes and the motivation.`
)}

function _15(md){return(
md`*110m as topojson and geojson*`
)}

function _world110m2020(FileAttachment){return(
FileAttachment("world-110m-2024.json").json()
)}

function _world110m(world110m2020){return(
world110m2020
)}

function _countries110m(topojson,world110m){return(
topojson.feature(world110m, world110m.objects.countries)
)}

function _countries(countries110m){return(
countries110m
)}

function _land110m(topojson,world110m){return(
topojson.feature(world110m, world110m.objects.land)
)}

function _land(land110m){return(
land110m
)}

function _22(md){return(
md`*50m as topojson and geojson*`
)}

function _world50m2020(FileAttachment){return(
FileAttachment("world-50m-2024.json").json()
)}

function _world50m(world50m2020){return(
world50m2020
)}

function _countries50m(topojson,world50m){return(
topojson.feature(world50m, world50m.objects.countries)
)}

function _land50m(topojson,world50m){return(
topojson.feature(world50m, world50m.objects.land)
)}

function _27(md){return(
md`---
### libraries
*with more modules than in stdlib*`
)}

function _topojson(require){return(
require("topojson-client@3", "topojson-server@3", "topojson-simplify@3")
)}

function _d3(require){return(
require("d3@7", "d3-geo-projection@4", "d3-geo-polygon@1", "d3-geo-voronoi@2")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["airports.csv", {url: new URL("./files/3ba6ffc2faf6f7ee4be0ed0566243932de17192846f8645847a5f7b580b339f9ba604a70b017eeaa8c4a5e1a4032d5a87e828a8e73512d5445226b3b83ac7a29.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["nuts.json", {url: new URL("./files/719b0a9f138f506bcfd3460e317ad0fd13fee21e7a27cdf043d2f5ee90b4241241a63130a3a6e791b9f129a4d8af556f54e8a2bf9a1522dbbc15a921bd62caba.json", import.meta.url), mimeType: "application/json", toString}],
    ["cities1000.csv", {url: new URL("./files/a6b773acb7153167ba298aeb43b3d5419fd1273af9413373896150c4577973648f1e3a1a2238b9341738912ee1291b756cede1e570b09fc24a127b34beb77e28.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["cities10000.csv", {url: new URL("./files/2989e7c7a455d4f213adadd9661530ab9044e417d4fde5c0e55ccf0d749b858ff4c1ce72c43b5ce2419dead2abbba333e55a6d4febb068fef900c136776996e3.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["world-110m-2024.json", {url: new URL("./files/968707e8f839656e81c2d6c732bbd26fa37b9dd2e08dd227bb503ee9911dbebe508e634b705cff62882661929bac3af7d84cd30f775240fe87df4aa250f4ab80.json", import.meta.url), mimeType: "application/json", toString}],
    ["world-50m-2024.json", {url: new URL("./files/2a343fc544ad30b7dd20a5d87644f111300b7523d80b6fbf78af2f6f2a06dada7ee44a539744fe41175fc9c16f45ca154338644cea8152df734f1dcfe484c0b2.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  const child1 = runtime.module(define1);
  main.import("rewind", child1);
  main.variable(observer()).define(["md"], _4);
  main.variable(observer()).define(["md"], _5);
  const child2 = runtime.module(define2);
  main.import("voronoiCentroids", child2);
  main.variable(observer()).define(["md"], _7);
  main.variable(observer("airports")).define("airports", ["FileAttachment"], _airports);
  main.variable(observer()).define(["md"], _9);
  main.variable(observer("nuts")).define("nuts", ["FileAttachment"], _nuts);
  main.variable(observer()).define(["md"], _11);
  main.variable(observer("cities1k")).define("cities1k", ["FileAttachment"], _cities1k);
  main.variable(observer("cities10k")).define("cities10k", ["FileAttachment"], _cities10k);
  main.variable(observer("basemaps")).define("basemaps", ["md"], _basemaps);
  main.variable(observer()).define(["md"], _15);
  main.variable(observer("world110m2020")).define("world110m2020", ["FileAttachment"], _world110m2020);
  main.variable(observer("world110m")).define("world110m", ["world110m2020"], _world110m);
  main.variable(observer("countries110m")).define("countries110m", ["topojson","world110m"], _countries110m);
  main.variable(observer("countries")).define("countries", ["countries110m"], _countries);
  main.variable(observer("land110m")).define("land110m", ["topojson","world110m"], _land110m);
  main.variable(observer("land")).define("land", ["land110m"], _land);
  main.variable(observer()).define(["md"], _22);
  main.variable(observer("world50m2020")).define("world50m2020", ["FileAttachment"], _world50m2020);
  main.variable(observer("world50m")).define("world50m", ["world50m2020"], _world50m);
  main.variable(observer("countries50m")).define("countries50m", ["topojson","world50m"], _countries50m);
  main.variable(observer("land50m")).define("land50m", ["topojson","world50m"], _land50m);
  main.variable(observer()).define(["md"], _27);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  return main;
}
