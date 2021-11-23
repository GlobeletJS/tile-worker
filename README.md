# tile-worker

![tests](https://github.com/GlobeletJS/tile-worker/actions/workflows/node.js.yml/badge.svg)

Load and parse map tiles on Web Worker threads

Tiles are requested (via HTTP) from the URL endpoints specified in one of the
sources specified in a [MapLibre style document][MapLibre]'s 'sources' property.
The returned tile data is parsed from the [vector tile][] format to [GeoJSON][].
This part of the work is delegated to the [tile-retriever][] module.

The GeoJSON data is then re-mixed to a new set of layers defined by the *style*
[layers][] in the style document. The re-mixed data is also converted to WebGL
buffers and other custom structures that can be rendered more quickly, e.g. by
[tile-setter][]. 
This part of the work is delegated to the [tile-mixer][] module.

tile-worker manages tile-retriever and tile-mixer instances on [Web Worker][]
threads. The buffer data returned from the Workers is then loaded to the GPU.
Loading tasks are broken up into chunks and submitted one at a time via the
[chunked-queue][] module, to avoid [jank][] on the main thread.

[MapLibre]: https://maplibre.org/maplibre-gl-js-docs/style-spec/
[vector tile]: https://github.com/mapbox/vector-tile-spec
[GeoJSON]: https://en.wikipedia.org/wiki/GeoJSON
[tile-retriever]: https://github.com/GlobeletJS/tile-retriever
[layers]: https://maplibre.org/maplibre-gl-js-docs/style-spec/layers/
[tile-setter]: https://github.com/GlobeletJS/tile-setter
[tile-mixer]: https://github.com/GlobeletJS/tile-mixer
[Web Worker]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
[chunked-queue]: https://github.com/GlobeletJS/chunked-queue
[jank]: http://jankfree.org/

## Initialization
A tile-worker instance can be initialized as follows:
```javascript
import * as tileWorker from 'tile-worker';

const loader = tileWorker.init(parameters);
```

The supplied parameters object has the following properties
- `threads`: Number of [Web Workers][Web Worker] that will be used to load 
  and parse tiles from the API. Default: 2
- `context`: A WebGL context wrapper, as created by the [tile-gl][] method
  `initGLpaint`. The returned buffer data will be loaded to the WebGL context
  by this wrapper
- `queue`: an instance of [chunked-queue][] to use for managing long-running
  tasks. If not supplied, tile-mixer will initialize its own queue
- `source`: The desired [source][] value from the 'sources' property of the
  style document. Note that any 'url' property will be ignored. The relevant
  [TileJSON][] properties MUST be supplied directly. REQUIRED
- `glyphs`: The [glyphs][] property from the style document. Used for processing
  text labels in symbol layers
- `spriteData`: The data referenced in the [sprite][] property from the
  style document, loaded into an object with properties `{ image, meta }`,
  as returned by [tile-stencil][]
- `layers`: An array containing the [layers][] from the style document that
  use data from the specified source. REQUIRED

[tile-gl]: https://github.com/GlobeletJS/tile-gl
[source]: https://maplibre.org/maplibre-gl-js-docs/style-spec/sources/
[TileJSON]: https://github.com/mapbox/tilejson-spec
[glyphs]: https://maplibre.org/maplibre-gl-js-docs/style-spec/glyphs/
[sprite]: https://maplibre.org/maplibre-gl-js-docs/style-spec/sprite/
[tile-stencil]: https://github.com/GlobeletJS/tile-stencil/

## API
Initialization returns an object that you can use to request and process
a tile, as follows:
```javascript
const request = loader.request({ z, x, y, getPriority, callback });
```

where the parameters are:
- `z, x, y` (REQUIRED): The coordinate indices of the desired tile
- `getPriority`: An optional function (with no arguments) that will return the 
  current priority of this tile. This can be used to dynamically prioritize
  loading tasks. See [chunked-queue][] for details
- `callback` (REQUIRED): A callback function which will be executed with
  the signature `callback(error, data)` when the request is complete

The return value is a request handle, which can be used to cancel the request
as follows:
```javascript
request.abort();
```

Other API methods on the `loader` object include:
- `.activeTasks()`: Returns the (integer) number of active tasks
- `.workerTasks()`: Returns the number of tasks active on worker threads
- `.queuedTasks()`: Returns the number of tasks queued on the main thread
- `.terminate()`: Cancels all tasks and terminates the Web Workers
