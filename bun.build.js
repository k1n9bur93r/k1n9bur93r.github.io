import html from 'bun-plugin-html';
import { Glob } from "bun";

const sourceDirectory = "./dyn/";
const glob = new Glob('DynPages.ts');
var entrypoints = [...glob.scanSync(sourceDirectory)];
entrypoints = entrypoints.map((x) => sourceDirectory + x);
console.log("Compiling " + entrypoints.length + " typescript files...");
entrypoints.forEach((item)=>{
  console.log(item);
})
const results = await Bun.build({
  entrypoints: entrypoints,
  publicPath: "",
  sourcemap: "linked",
  format:"esm",
  outdir: './out',
});
console.log('fuuc')
if (results.success==false) {
  console.error("Build failed");
  for (const message of results.logs) {
    console.error(message);
  }
}
else {
  console.log("Compiled " + results.outputs.length + " javascript files...");
}
