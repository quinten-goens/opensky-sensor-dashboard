import define1 from "./e93997d5089d7165@2173.js";

function _1(md,PINNED_SLUG){return(
md`# Range Slider

**Jump to:
[Examples](#doc_examples) | [Usage](#doc_usage) | [Changelog](#doc_changelog)**

This notebook implements a themable range input for lower and upper bounds.

<details>
<summary style="outline:none !important"><i>View a demonstration</i></summary>
<img src=https://i.imgur.com/KkHoemh.gif style="max-width:500px;border:1px solid #ddd">
</details>

Also provided is an optional light wrapper that mimics the widget APIs from Jeremy Ashkenas' [Inputs](https://observablehq.com/@jashkenas/inputs) notebook.

Import the slider factory into your notebook:
~~~js
import {rangeSlider} from '${PINNED_SLUG}'
~~~

`
)}

function _doc_examples(md){return(
md`---
## Examples

Resize this slider's range by dragging either end, or drag the range as a whole to move it.
`
)}

function _test(rangeSlider,themes,theme,color){return(
rangeSlider({
  min: .5,
  max: 3,
  // Note that values must be specified as array of length 2.
  value: this ? this.value : [1, 1.9],
  // Custom slider CSS, replaces all styles.
  theme: themes[theme],
  // Overrides the range color. Support for range colors is up to the theme.
  color,
  format: '.0%',
  title: 'The optional title',
  description: 'The optional description.',
})
)}

function _4(md){return(
md`The widget value is an array containing the selected min and max value.`
)}

function _5(test){return(
test
)}

function _6(md){return(
md`Below are some controls to modify the example slider. Why don't you ...`
)}

function _theme(radioWidget,themes){return(
radioWidget({
  title: '<span style="font-family:var(--serif);font-size:initial">... pick a different theme ...',
  options: Object.keys(themes),
  value: 'Flat',
})
)}

function _color(colorWidget){return(
colorWidget({
  title: '<span style="font-family:var(--serif);font-size:initial">... or range color?',
  value: '#3b99fc',
})
)}

function _doc_usage(md){return(
md`---
## Usage

Create a slider (all properties are optional):
`
)}

function _myValue(rangeSlider,theme_NoUiSlider){return(
rangeSlider({
  title: 'My slider title',
  description: 'My slider description.',
  min: .5,
  max: 3,
  // Default value. Note that values must be specified as array of length 2.
  value: [1, 1.9],
  // Custom slider CSS, replaces all styles. If you want to use one of the predefined
  // themes, remember to import it along with rangeSlider.
  theme: theme_NoUiSlider,
  // Overrides the range color. Support for range colors is up to the theme.
  color: 'hsl(20, 100%, 40%)',
  format: '.0%',
})
)}

function _11(md){return(
md`Available configuration options are listed below.`
)}

function _12(signature,rangeSlider,md){return(
signature(rangeSlider, {
  description: md`
*Inputs* widget with an API similar to [\`slider()\`](https://observablehq.com/@jashkenas/inputs#slider).

Supports all [<code>rangeInput()</code>](#doc_rangeInput) options. Additionally the following options are supported:
${Object.entries({
      title: 'Title above widget, string. Optional.',
      description: 'Description below widget, string. Optional.',
      submit: 'Display submit button to apply changes, boolean. Optional, defaults to <code>false</code>.',
      getValue: 'Value callback, Function. Optional, defaults to <code>n => n.value.map(roundToPrecision)</code>.',
      color: 'CSS color for range. Optional, overrides theme\'s default color.',
      separator: 'Value separator. Optional, defaults to <code>" … "</code>.',
      precision: 'Number of decimals as Number. Optional, defaults to <code>3</code>.',
      format: 'Display format as [d3-format](https://github.com/d3/d3-format) string or Function. Optional, defaults to <code>v => v</code>.',
      display: 'Display formatter as Function. Optional, defaults to <code>v => v.map(format).join(separator)</code>',
    }).map(([k,v]) => `- \`${k}:\` ${v}\n`)}`

})
)}

function _rangeSlider(rangeInput,d3format,widget,html){return(
function rangeSlider(options = {}) {
  const {min = 0, max = 1, step = 'any', value, color, theme} = options;
  const input = rangeInput({min, max, step, value, theme});
  if(color) input.style.color = color;

  const {precision = 3, format = v => v, display: _display, separator = ' … '} = options;
  const round   = (p => (p = 10 ** p, v => Math.round(v * p) / p))(precision);
  const output  = typeof format === 'function' ? format : d3format.format(format);
  const display = _display || (v => v.map(output).join(separator));
  
  const {
    title, description, submit,
    getValue = n => n.value.map(round),
  } = options;
  
  const w = widget({
    title, description, submit, display, getValue,
    form: Object.assign(html`<form>${input}`, {input}),
  });
  
  w.querySelector('output').style.display = 'inline-block';
  return w;
}
)}

function _doc_rangeInput(signature,rangeInput,md){return(
signature(rangeInput, {
  description: md`
Basic input implementation. Supports custom themes.

Options:
${Object.entries({
  min: 'Minimum value, number. Optional, defaults to <code>0</code>.',
  max: 'Maximum value, number. Optional, defaults to <code>100</code>.',
  step: 'Range step, number. Optional, defaults to <code>1</code>.',
  value: 'Lower and upper range bounds, array of number. Optional, defaults to <code>[min, max]</code>.',
  theme: 'Widget CSS, string. Optional, defaults to [<code>theme_Flat</code>](#doc_theme_Flat).',
}).map(([k,v]) => `- \`${k}:\` ${v}\n`)}

`
})
)}

function _rangeInput(theme_Flat,randomScope,DOM,html,clamp,invalidation){return(
function rangeInput(options = {}) {
  const {
    min = 0,
    max = 100,
    step = 1,
    value: defaultValue = [min, max],
    theme = theme_Flat,
  } = options;
  
  const controls = {};
  const scope = randomScope();
  // Will be used to sanitize values while avoiding floating point issues.
  const input = DOM.element('input', {type: 'range', min, max, step});
  
  const dom = html`<div class="${scope} range-slider" style="--range-min:10px;--range-max:80px">
  ${controls.track = html`<div class="range-track">
    ${controls.zone = html`<div class="range-track-zone">
      ${controls.range = html`<div class="range-select" tabindex=0>
        ${controls.min = html`<div class="thumb thumb-min" tabindex=0>`}
        ${controls.max = html`<div class="thumb thumb-max" tabindex=0>`}
      `}
    `}
  `}
  ${html`<style>${theme.replace(/:scope\b/g, '.'+scope)}`}
</div>`;

  let value = [];
  Object.defineProperty(dom, 'value', {
    get: () => [...value],
    set: ([a, b]) => {
      value = sanitize(a, b);
      updateRange();
    },
  });

  const sanitize = (a, b) => {
    a = isNaN(a) ? min : ((input.value = a), input.valueAsNumber);
    b = isNaN(b) ? max : ((input.value = b), input.valueAsNumber);
    return [Math.min(a, b), Math.max(a, b)];
  }
  
  const updateRange = () => {
    const ratio = v => (v - min) / (max - min);
    dom.style.setProperty('--range-min', `${ratio(value[0]) * 100}%`);
    dom.style.setProperty('--range-max', `${ratio(value[1]) * 100}%`);
  };
  
  const setValue = (vmin, vmax) => {
    const [pmin, pmax] = value;
    value = sanitize(vmin, vmax);
    updateRange();
    // Only dispatch if values have changed.
    if(pmin !== value[0] || pmax !== value[1]) {
      dom.dispatchEvent(new CustomEvent('input', {bubbles: true}));
    }
  };
  
  setValue(...defaultValue);
  
  // Mousemove handlers.
  const handlers = new Map([
    [controls.min, (dt, ov) => {
      const v = clamp(min, ov[1], ov[0] + dt * (max - min));
      setValue(v, ov[1]);
    }],
    [controls.max, (dt, ov) => {
      const v = clamp(ov[0], max, ov[1] + dt * (max - min));
      setValue(ov[0], v);
    }],
    [controls.range, (dt, ov) => {
      const d = ov[1] - ov[0];
      const v = clamp(min, max - d, ov[0] + dt * (max - min));
      setValue(v, v + d);
    }],
  ]);
  
  // Returns client offset object.
  const pointer = e => e.touches ? e.touches[0] : e;
  // Note: Chrome defaults passive for touch events to true.
  const on  = (e, fn) => e.split(' ').map(e => document.addEventListener(e, fn, {passive: false}));
  const off = (e, fn) => e.split(' ').map(e => document.removeEventListener(e, fn, {passive: false}));
  
  let initialX, initialV, target, dragging = false;
  function handleDrag(e) {
    // Gracefully handle exit and reentry of the viewport.
    if(!e.buttons && !e.touches) {
      handleDragStop();
      return;
    }
    dragging = true;
    const w = controls.zone.getBoundingClientRect().width;
    e.preventDefault();
    handlers.get(target)((pointer(e).clientX - initialX) / w, initialV);
  }
  
  
  function handleDragStop(e) {
    off('mousemove touchmove', handleDrag);
    off('mouseup touchend', handleDragStop);
  }
  
  invalidation.then(handleDragStop);
  
  dom.ontouchstart = dom.onmousedown = e => {
    dragging = false;
    if(!handlers.has(e.target)) return;
    on('mousemove touchmove', handleDrag);
    on('mouseup touchend', handleDragStop);
    e.preventDefault();
    e.stopPropagation();
    
    target = e.target;
    initialX = pointer(e).clientX;
    initialV = value.slice();
  };
  
  controls.track.onclick = e => {
    if(dragging) return;
    const r = controls.zone.getBoundingClientRect();
    const t = clamp(0, 1, (pointer(e).clientX - r.left) / r.width);
    const v = min + t * (max - min);
    const [vmin, vmax] = value, d = vmax - vmin;
    if(v < vmin) setValue(v, v + d);
    else if(v > vmax) setValue(v - d, v);
  };
  
  return dom;
}
)}

function _doc_themes(md){return(
md`---
## Themes
`
)}

function _doc_theme_Flat(signature){return(
signature('theme_Flat', {
  name: 'theme_Flat',
  description: `Default theme. An unshaded version of [\`theme_GoogleChrome_MacOS1013\`](#doc_theme_GoogleChrome_MacOS1013).`
})
)}

function _theme_Flat(){return(
`
:scope {
  position: relative;
  display: inline-block;
  width: 240px;
  --thumb-size: 15px;
  --thumb-radius: calc(var(--thumb-size) / 2);
  padding: var(--thumb-radius) 0;
  color: #3b99fc;
  margin: 2px;
  vertical-align: middle;
}
:scope .range-track {
  box-sizing: border-box;
  position: relative;
  height: 7px;
  background-color: hsl(0, 0%, 80%);
  overflow: visible;
  border-radius: 4px;
  padding: 0 var(--thumb-radius);
}
:scope .range-track-zone {
  box-sizing: border-box;
  position: relative;
}
:scope .range-select {
  box-sizing: border-box;
  position: relative;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  cursor: ew-resize;
  background: currentColor;
  height: 7px;
  border: inherit;
}
/* Expands the hotspot area. */
:scope .range-select:before {
  content: "";
  position: absolute;
  width: 100%;
  height: var(--thumb-size);
  left: 0;
  top: calc(2px - var(--thumb-radius));
}
:scope .range-select:focus,
:scope .thumb:focus {
  outline: none;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  width: var(--thumb-size);
  height: var(--thumb-size);

  background: #fcfcfc;
  top: -4px;
  border-radius: 100%;
  border: 1px solid hsl(0,0%,55%);
  cursor: default;
  margin: 0;
}
:scope .thumb:active {
  box-shadow: inset 0 var(--thumb-size) #0002;
}
:scope .thumb-min {
  left: calc(-1px - var(--thumb-radius));
}
:scope .thumb-max {
  right: calc(-1px - var(--thumb-radius));
}
`
)}

function _doc_theme_GoogleChrome_MacOS1013(signature){return(
signature('theme_GoogleChrome_MacOS1013', {
  name: 'theme_GoogleChrome_MacOS1013',
  description: `Matches the style of range inputs in Google Chrome on macOS 10.13.`
})
)}

function _theme_GoogleChrome_MacOS1013(){return(
`
:scope {
  position: relative;
  display: inline-block;
  width: 240px;
  --thumb-size: 15px;
  --thumb-radius: calc(var(--thumb-size) / 2);
  padding: var(--thumb-radius) 0;
  color: #3b99fc;
  margin: 2px;
  vertical-align: middle;
}
:scope .range-track {
  box-sizing: border-box;
  position: relative;
  height: 5px;
  background-color: hsl(0, 0%, 80%);
  box-shadow: inset 0 1px 3px -1px rgba(0,0,0,0.33);
  overflow: visible;
  border-radius: 3px;
  border: 1px inset hsl(0, 0%, 70%);
  padding: 0 var(--thumb-radius);
}
:scope .range-track-zone {
  box-sizing: border-box;
  position: relative;
}
:scope .range-select {
  box-sizing: border-box;
  position: relative;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  cursor: ew-resize;
  background: currentColor;
  height: 5px;
  top: -1px;
  border: inherit;
}
/* Expands the hotspot area. */
:scope .range-select:before {
  content: "";
  position: absolute;
  width: 100%;
  height: var(--thumb-size);
  left: 0;
  top: calc(2px - var(--thumb-radius));
}
:scope .range-select:focus,
:scope .thumb:focus {
  outline: none;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  width: var(--thumb-size);
  height: var(--thumb-size);

  background: #eee linear-gradient(0deg, #fff0 50%, #fff9 50%, #fff5);
  top: -5px;
  border-radius: 100%;
  border: 1px solid hsl(0,0%,55%);
  cursor: default;
  margin: 0;
}
:scope .thumb:active {
  box-shadow: inset 0 var(--thumb-size) #0002;
}
:scope .thumb-min {
  left: calc(-1px - var(--thumb-radius));
}
:scope .thumb-max {
  right: calc(-1px - var(--thumb-radius));
}
`
)}

function _doc_theme_Retro1(signature){return(
signature('theme_Retro1', {
  name: 'theme_Retro1',
  description: `Minimal theme that showcases the bare requirements.`
})
)}

function _theme_Retro1(){return(
`
:scope {
  position: relative;
  display: inline-block;
  width: 240px;
  color: #3b99fc;
  vertical-align: -10px;
  margin: 2px;
}
:scope .range-track {
  height: 20px;
  border: 2px solid #000;
  padding: 0 18px;
  position: relative;
  background: #fff url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAPUlEQVQoU2NkYGD4z8DAwMiAH/wnpACunWyFIGeAAIYB6ALYFILFiLGaaIXY3YIrlLBZjdVDIIXoAY7VQwD4rQoH9uQ3nwAAAABJRU5ErkJggg==");
}
:scope .range-track-zone {
  position: relative;
  height: 100%;
}
:scope .range-select {
  box-sizing: border-box;
  position: relative;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  height: 100%;
  cursor: ew-resize;
  background: currentColor url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAK0lEQVQoU2NkwA/+g6QZqaEIbAY2k8BWIMuRrQjDmTCTMKxAVkmSIrwhAQBStQYIBYnwugAAAABJRU5ErkJggg==") fixed;
}
:scope .range-select:focus,
:scope .thumb:focus {
  outline: none;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  height: 100%;
  top: 0;
  width: 20px;
  background: #fff;
  border: 2px solid #000;
  border-width: 0 2px;
  cursor: default;
}
:scope .thumb:active {
  background: #000;
}
:scope .thumb-min {
  left: -20px;
}
:scope .thumb-max {
  right: -20px;
}
`
)}

function _doc_theme_NoUiSlider(signature){return(
signature('theme_NoUiSlider', {
  name: 'theme_NoUiSlider',
  description: `Replicates the style of the [noUiSlider library](https://refreshless.com/nouislider/examples/).`
})
)}

function _theme_NoUiSlider(){return(
`
:scope {
  box-sizing: border-box;
  display: inline-block;
  width: 240px;
  color: #3b99fc;
  vertical-align: middle;
}

:scope .range-track {
  box-sizing: border-box;
  margin: 10px 17px;
  position: relative;
  background: #FAFAFA;
  border-radius: 4px;
  border: 1px solid #D3D3D3;
  box-shadow: inset 0 1px 1px #F0F0F0, 0 3px 6px -5px #BBB;
  height: 18px;
}
:scope .range-select {
  box-sizing: border-box;
  position: absolute;
  background: currentColor;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  height: 100%;
  cursor: ew-resize;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  width: 34px;
  height: 28px;
  top: -6px;
  border: 1px solid #D9D9D9;
  border-radius: 3px;
  background: #FFF;
  cursor: default;
  box-shadow: inset 0 0 1px #FFF, inset 0 1px 7px #EBEBEB, 0 3px 6px -3px #BBB;
}
:scope .thumb:before,
:scope .thumb:after {
  content: "";
  display: block;
  position: absolute;
  height: 14px;
  width: 1px;
  background: #E8E7E6;
  left: 14px;
  top: 6px;
}
:scope .thumb:after {
  left: 17px;
}
:scope .thumb-min {
  left: -17px;
}
:scope .thumb-max {
  right: -17px;
}
`
)}

function _25(md){return(
md`---
## Helpers
`
)}

function _randomScope(){return(
function randomScope(prefix = 'scope-') {
  return prefix + (performance.now() + Math.random()).toString(32).replace('.', '-');
}
)}

function _clamp(){return(
function clamp(a, b, v) {
  return v < a ? a : v > b ? b : v;
}
)}

function _themes(theme_Flat,theme_GoogleChrome_MacOS1013,theme_NoUiSlider,theme_Retro1){return(
{
  'Flat': theme_Flat,
  'Chrome macOS': theme_GoogleChrome_MacOS1013,
  'noUiSlider': theme_NoUiSlider,
  'Retro': theme_Retro1,
}
)}

function _lazyImport(){return(
async function lazyImport(slug, cells, builtins) {
  const [{Runtime}, {default: define}] = await Promise.all([
    import('https://cdn.jsdelivr.net/npm/@observablehq/runtime/dist/runtime.js'),
    import(`https://api.observablehq.com/${slug}.js?v=3`)
  ]);
  const map = (o, fn) => Object.fromEntries(Object.entries(o).map(fn));
  let _builtins;
  if(builtins) _builtins = map(builtins, ([n, v]) => [n, () => v]);
  const module = new Runtime(_builtins).module(define);
  return Object.fromEntries(
    await Promise.all(cells.map((n) => module.value(n).then((v) => [n, v])))
  );
}
)}

function _PINNED_SLUG(){return(
(n=>fetch(`https://api.observablehq.com/${n}.js?v=1`).then(r=>r.text()).then(t=>'@'+t.match(/\n\/\/ Version:\s+(\d+)/)[1]).catch(e=>'').then(v=>n+v))('@mootari/range-slider')
)}

function _31(md){return(
md`---
## Optional Dependencies

The basic implementation \`rangeInput()\` has no additional dependencies.
`
)}

async function _signature(lazyImport,require,html,DOM,md,Generators){return(
(await lazyImport(
  '@mootari/signature',
  ['signature'],
  {require, html, DOM, md, Generators}
)).signature
)}

function _34(md){return(
md`---
## Demo Dependencies`
)}

function _doc_changelog(md)
{
  const rev = (d, n = '') => `${d} ([${n || 'latest'}](https://observablehq.com/@mootari/range-slider${n}))`;
  return md`
---

## Changelog
- ${rev('2022-01-13')}:
  - Added setter to \`rangeInput()\` and \`interval()\`.
  - Fixed \`interval()\` events not bubbling.
- ${rev('2021-12-31', '@1208')}:
  - Added provisional \`interval()\` widget to match the style of Observable's \`Inputs\` library. Thanks to [Sylvain Lesage](https://observablehq.com/@severo) for suggesting the name!
  - Removed a few static imports.
- ${rev('2020-03-27', '@1004')}: Added new default theme "Flat", a more neutral version of the macOS Chrome theme. (via [Jed Fox](https://observablehq.com/@j-f1))
- ${rev('2020-03-27', '@930')}: Changelog start.
`;
}


function _36(md){return(
md`---
## Remaining Tasks / Work in progress

*Code in this section is subject to change. Only import with a pinned version!*

- Options for min/max delta
- synthetic change event
- Keyboard controls
- Move non-default themes into separate notebook?
- Compare with control guidelines in https://material.io/components/sliders
- Add observablehq/inputs theme
`
)}

function _testInterval(Inputs,interval,html){return(
Inputs.form([
  interval(),
  interval([0.001, .002], {step: .0001, label: 'the label'}),
  interval([0, 1], {label: html`<strong>the label`}),
])
)}

function _foo(interval){return(
interval()
)}

function _39(foo){return(
foo
)}

function _40($0){return(
$0.value = [NaN, 3]
)}

function _41(testInterval){return(
testInterval
)}

function _interval(DOM,rangeInput,html,Element){return(
function interval(range = [], options = {}) {
  const [min = 0, max = 1] = range,
        {step = .001, label = null, value = [min, max]} = options;

  const __ns__ = DOM.uid('scope').id;
  const css = `
#${__ns__} {
  font: 13px/1.2 var(--sans-serif);
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  max-width: 100%;
  width: auto;
}
@media only screen and (min-width: 30em) {
  #${__ns__} {
    flex-wrap: nowrap;
    width: 360px;
  }
}
#${__ns__} .label {
  width: 120px;
  padding: 5px 0 4px 0;
  margin-right: 6.5px;
  flex-shrink: 0;
}
#${__ns__} .form {
  display: flex;
  width: 100%;
}
#${__ns__} .range {
  flex-shrink: 1;
  width: 100%;
}
#${__ns__} .range-slider {
  width: 100%;
}
  `;
  
  const $range = rangeInput({min, max, value: [value[0], value[1]], step});
  const $label = label != null
    ? html`<div class="label">${label instanceof Element ? label : DOM.text(label)}`
    : '';
  const $output1 = html`<output>`;
  const $output2 = html`<output>`;
  const $view = html`<div id=${__ns__}>
${$label}
<div class=form>
  <div class=range>
    ${$range}<div class=range-output>${$output1} … ${$output2}</div>
  </div>
</div>
${html`<style>${css}`}
  `;

  const update = () => {
    $output1.value = $range.value[0];
    $output2.value = $range.value[1];
  };
  $range.oninput = update;
  update();
  
  return Object.defineProperty($view, 'value', {
    get: () => $range.value,
    set: ([a, b]) => {
      $range.value = [a, b];
      update();
    },
  });
}
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md","PINNED_SLUG"], _1);
  main.variable(observer("doc_examples")).define("doc_examples", ["md"], _doc_examples);
  main.variable(observer("viewof test")).define("viewof test", ["rangeSlider","themes","theme","color"], _test);
  main.variable(observer("test")).define("test", ["Generators", "viewof test"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _4);
  main.variable(observer()).define(["test"], _5);
  main.variable(observer()).define(["md"], _6);
  main.variable(observer("viewof theme")).define("viewof theme", ["radioWidget","themes"], _theme);
  main.variable(observer("theme")).define("theme", ["Generators", "viewof theme"], (G, _) => G.input(_));
  main.variable(observer("viewof color")).define("viewof color", ["colorWidget"], _color);
  main.variable(observer("color")).define("color", ["Generators", "viewof color"], (G, _) => G.input(_));
  main.variable(observer("doc_usage")).define("doc_usage", ["md"], _doc_usage);
  main.variable(observer("viewof myValue")).define("viewof myValue", ["rangeSlider","theme_NoUiSlider"], _myValue);
  main.variable(observer("myValue")).define("myValue", ["Generators", "viewof myValue"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _11);
  main.variable(observer()).define(["signature","rangeSlider","md"], _12);
  main.variable(observer("rangeSlider")).define("rangeSlider", ["rangeInput","d3format","widget","html"], _rangeSlider);
  main.variable(observer("doc_rangeInput")).define("doc_rangeInput", ["signature","rangeInput","md"], _doc_rangeInput);
  main.variable(observer("rangeInput")).define("rangeInput", ["theme_Flat","randomScope","DOM","html","clamp","invalidation"], _rangeInput);
  main.variable(observer("doc_themes")).define("doc_themes", ["md"], _doc_themes);
  main.variable(observer("doc_theme_Flat")).define("doc_theme_Flat", ["signature"], _doc_theme_Flat);
  main.variable(observer("theme_Flat")).define("theme_Flat", _theme_Flat);
  main.variable(observer("doc_theme_GoogleChrome_MacOS1013")).define("doc_theme_GoogleChrome_MacOS1013", ["signature"], _doc_theme_GoogleChrome_MacOS1013);
  main.variable(observer("theme_GoogleChrome_MacOS1013")).define("theme_GoogleChrome_MacOS1013", _theme_GoogleChrome_MacOS1013);
  main.variable(observer("doc_theme_Retro1")).define("doc_theme_Retro1", ["signature"], _doc_theme_Retro1);
  main.variable(observer("theme_Retro1")).define("theme_Retro1", _theme_Retro1);
  main.variable(observer("doc_theme_NoUiSlider")).define("doc_theme_NoUiSlider", ["signature"], _doc_theme_NoUiSlider);
  main.variable(observer("theme_NoUiSlider")).define("theme_NoUiSlider", _theme_NoUiSlider);
  main.variable(observer()).define(["md"], _25);
  main.variable(observer("randomScope")).define("randomScope", _randomScope);
  main.variable(observer("clamp")).define("clamp", _clamp);
  main.variable(observer("themes")).define("themes", ["theme_Flat","theme_GoogleChrome_MacOS1013","theme_NoUiSlider","theme_Retro1"], _themes);
  main.variable(observer("lazyImport")).define("lazyImport", _lazyImport);
  main.variable(observer("PINNED_SLUG")).define("PINNED_SLUG", _PINNED_SLUG);
  main.variable(observer()).define(["md"], _31);
  const child1 = runtime.module(define1);
  main.import("input", "widget", child1);
  main.import("d3format", child1);
  main.import("color", "colorWidget", child1);
  main.import("radio", "radioWidget", child1);
  main.variable(observer("signature")).define("signature", ["lazyImport","require","html","DOM","md","Generators"], _signature);
  main.variable(observer()).define(["md"], _34);
  main.variable(observer("doc_changelog")).define("doc_changelog", ["md"], _doc_changelog);
  main.variable(observer()).define(["md"], _36);
  main.variable(observer("viewof testInterval")).define("viewof testInterval", ["Inputs","interval","html"], _testInterval);
  main.variable(observer("testInterval")).define("testInterval", ["Generators", "viewof testInterval"], (G, _) => G.input(_));
  main.variable(observer("viewof foo")).define("viewof foo", ["interval"], _foo);
  main.variable(observer("foo")).define("foo", ["Generators", "viewof foo"], (G, _) => G.input(_));
  main.variable(observer()).define(["foo"], _39);
  main.variable(observer()).define(["viewof foo"], _40);
  main.variable(observer()).define(["testInterval"], _41);
  main.variable(observer("interval")).define("interval", ["DOM","rangeInput","html","Element"], _interval);
  return main;
}
