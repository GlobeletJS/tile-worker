import * as chunkedQueue from "chunked-queue";

export function setParams(userParams) {
  const {
    context, threads = 2,
    queue = chunkedQueue.init(),
    source, glyphs, layers, spriteData,
  } = userParams;

  if (source?.type !== "vector") fail("no valid vector tile source");
  if (!source.tiles?.length) fail("no valid vector tile endpoint");

  if (!layers?.length) fail ("no valid array of style layers");
  if (!layers.every(isVector)) fail("not all layers are vector layers");

  const sameSource = layers.every(l => l.source === layers[0].source);
  if (!sameSource) fail("supplied layers use different sources");

  const params = { context, threads, queue, source, glyphs, layers };

  if (spriteData) {
    const { image, meta } = spriteData;
    if (!(image instanceof HTMLImageElement)) fail("invalid spriteData");
    const { width, height } = image;
    params.spriteData = { image: { width, height }, meta };
  }

  return params;
}

function isVector(layer) {
  return ["symbol", "circle", "line", "fill"].includes(layer.type);
}

function fail(message) {
  throw Error("ERROR in tile-worker: " + message);
}
