import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs"; // Needed for earcut
import { worker } from "./worker-plugin.js";
import pkg from "../package.json";

export default [{
  input: "src/worker.js",
  plugins: [
    resolve({ dedupe: ["pbf-esm"] }),
    commonjs(),
  ],
  output: {
    file: "build/worker.bundle.js",
    format: "esm",
    name: pkg.name,
  }
}, {
  input: "src/main.js",
  plugins: [
    resolve({ dedupe: ["pbf-esm"] }),
    commonjs(),
    worker(),
  ],
  output: {
    file: pkg.main,
    format: "esm",
    name: pkg.name,
  }
}];
