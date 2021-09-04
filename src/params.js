import * as chunkedQueue from "chunked-queue";

export function setParams(userParams) {
  const {
    threads = 2,
    context,
    source,
    glyphs,
    layers,
    queue = chunkedQueue.init(),
  } = userParams;

  if (!source) fail("parameters.source is required");

  if (source.type === "vector" && !(source.tiles && source.tiles.length)) {
    fail("no valid vector tile endpoints");
  }

  return {
    threads,
    context,
    source,
    glyphs,
    layers,
    queue,
  };
}

function fail(message) {
  throw Error("ERROR in tile-worker: " + message);
}
