import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "data", "jurisdictions");

const requiredTop = ["id","name","status","last_verified","regulators","frameworks","typical_paths","marketing_notes","requires_counsel_triggers","disclaimer_level"];
const allowedStatus = new Set(["supported","partial","planned"]);
const isoLike = /^[A-Z]{2}(-[A-Z0-9]{2,})?$/;

function die(msg){ console.error("✖ " + msg); process.exit(1); }
function ok(msg){ console.log("✔ " + msg); }

function isISODate(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s); }
function isURL(s){ return /^https?:\/\/.+/i.test(s); }

if(!fs.existsSync(DIR)) die(`Missing ${DIR}`);

const files = fs.readdirSync(DIR).filter(f=>f.endsWith(".json"));
if(files.length === 0) die("No jurisdiction json files found.");

let count = 0;
for(const file of files){
  const p = path.join(DIR, file);
  let obj;
  try{ obj = JSON.parse(fs.readFileSync(p, "utf8")); }
  catch(e){ die(`Invalid JSON: ${file}: ${e.message}`); }

  for(const k of requiredTop){
    if(!(k in obj)) die(`${file}: missing key '${k}'`);
  }
  if(typeof obj.id !== "string" || !isoLike.test(obj.id)) die(`${file}: invalid id '${obj.id}' (expected ISO2 like CY or composite like AE-DIFC)`);
  if(path.basename(file, ".json") !== obj.id) die(`${file}: filename must match id (expected ${obj.id}.json)`);
  if(!allowedStatus.has(obj.status)) die(`${file}: invalid status '${obj.status}'`);
  if(!isISODate(obj.last_verified)) die(`${file}: last_verified must be YYYY-MM-DD`);
  if(!Array.isArray(obj.regulators) || obj.regulators.length < 1) die(`${file}: regulators must be non-empty array`);
  for(const r of obj.regulators){
    if(!r.name || !r.url) die(`${file}: regulator missing name/url`);
    if(!isURL(r.url)) die(`${file}: regulator url invalid '${r.url}'`);
  }
  if(!Array.isArray(obj.frameworks) || obj.frameworks.length < 1) die(`${file}: frameworks must be non-empty array`);
  for(const fw of obj.frameworks){
    if(!fw.name || !fw.citation || !fw.url) die(`${file}: framework missing name/citation/url`);
    if(!isURL(fw.url)) die(`${file}: framework url invalid '${fw.url}'`);
  }
  if(!Array.isArray(obj.typical_paths) || obj.typical_paths.length < 1) die(`${file}: typical_paths must be non-empty array`);
  for(const tp of obj.typical_paths){
    if(!tp.label || !Array.isArray(tp.bullets) || tp.bullets.length < 1) die(`${file}: typical_paths items require label + bullets[]`);
  }
  if(!Array.isArray(obj.marketing_notes)) die(`${file}: marketing_notes must be array`);
  if(!Array.isArray(obj.requires_counsel_triggers)) die(`${file}: requires_counsel_triggers must be array`);
  count++;
}
ok(`Validated ${count} jurisdiction files in ${DIR}`);
