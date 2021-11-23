import * as tileRetriever from "tile-retriever";
import * as tileMixer from "tile-mixer";
import { initSerializer } from "tile-gl";

export function initTileFunctions({ source, glyphs, spriteData, layers }) {
  const defaultID = layers[0].id;
  const load = tileRetriever.init({ source, defaultID });

  const mixer = tileMixer.init({ layers });
  const serializer = initSerializer({ glyphs, spriteData, layers });

  function process(id, result, tileCoords) {
    const data = mixer(result, tileCoords.z);
    return serializer(data, tileCoords)
      .then(tile => getTransferables(id, tile));
  }

  function getTransferables(id, tile) {
    const transferables = Object.values(tile.layers)
      .flatMap(l => Object.values(l.buffers).map(b => b.buffer));
    transferables.push(tile.atlas.data.buffer);

    return { id, tile, transferables };
  }

  return { load, process };
}
