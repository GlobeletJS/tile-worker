import { initTileFunctions } from "./tile.js";

const tasks = {};
let tileFuncs;

onmessage = function(msgEvent) {
  const { id, type, payload } = msgEvent.data;

  switch (type) {
    case "setup":
      tileFuncs = initTileFunctions(payload);
      return;
    case "getTile":
      return getTile(payload, id);
    case "cancel":
      return cancel(id);
    default: // Bad message type!
  }
};

function getTile(payload, id) {
  const callback = (err, result) => process(id, err, result, payload);
  const request = tileFuncs.load(payload, callback);
  tasks[id] = { request, status: "requested" };
}

function cancel(id) {
  const task = tasks[id];
  if (task && task.status === "requested") task.request.abort();
  delete tasks[id];
}

function process(id, err, result, tileCoords) {
  const task = tasks[id];
  if (!task) return;  // Task must have been canceled

  if (err) {
    delete tasks[id];
    return postMessage({ id, type: "error", payload: err });
  }

  task.status = "parsing";
  return tileFuncs.process(id, result, tileCoords).then(sendTile);
}

function sendTile({ id, tile, transferables }) {
  const task = tasks[id];
  if (!task) return; // Task must have been canceled

  postMessage({ id, type: "data", payload: tile }, transferables);
  delete tasks[id];
}
