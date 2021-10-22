import * as tileRetriever from "tile-retriever";
import * as tileMixer from "tile-mixer";
import { initSerializer } from "tile-gl";

const tasks = {};
let loader, mixer, serializer;

onmessage = function(msgEvent) {
  const { id, type, payload } = msgEvent.data;

  switch (type) {
    case "setup":
      return setup(payload);
    case "getTile":
      return getTile(payload, id);
    case "cancel":
      return cancel(id);
    default: // Bad message type!
  }
};

function setup(payload) {
  const { source, glyphs, layers } = payload;
  // NOTE: changing global variables!
  const defaultID = layers[0].id;
  loader = tileRetriever.init({ source, defaultID });
  mixer = tileMixer.init({ layers });
  serializer = initSerializer({ glyphs, layers });
}

function getTile(payload, id) {
  const callback = (err, result) => process(id, err, result, payload);
  const request = loader(payload, callback);
  tasks[id] = { request, status: "requested" };
}

function cancel(id) {
  const task = tasks[id];
  if (task && task.status === "requested") task.request.abort();
  delete tasks[id];
}

function process(id, err, result, tileCoords) {
  // Make sure we still have an active task for this ID
  const task = tasks[id];
  if (!task) return;  // Task must have been canceled

  if (err) {
    delete tasks[id];
    return postMessage({ id, type: "error", payload: err });
  }

  task.status = "parsing";
  const data = mixer(result, tileCoords.z);
  return serializer(data, tileCoords).then(tile => sendTile(id, tile));
}

function sendTile(id, tile) {
  // Make sure we still have an active task for this ID
  const task = tasks[id];
  if (!task) return; // Task must have been canceled

  // Get a list of all the Transferable objects
  const transferables = Object.values(tile.layers)
    .flatMap(l => Object.values(l.buffers).map(b => b.buffer));
  transferables.push(tile.atlas.data.buffer);

  postMessage({ id, type: "data", payload: tile }, transferables);
}
