// Trims and slims and converts 311 data to JSON
// run  `node scripts/slim-csv.js [input.csv] [output.json]`
import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const input = process.argv[2] ?? "data/Customer_Service_Requests_20261002.csv";
const output = process.argv[3] ?? "public/requests.json";

function parseLine(line) {
  const fields = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

const rl = createInterface({ input: createReadStream(input), crlfDelay: Infinity });

let latIdx, lngIdx, typeIdx, dateIdx;
const points = [];
let skipped = 0;

const types = [];
const typeIndex = new Map();

function getTypeIndex(name) {
  if (!typeIndex.has(name)) {
    typeIndex.set(name, types.length);
    types.push(name);
  }
  return typeIndex.get(name);
}

function parseDate(text) {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2}) (AM|PM)$/);
  if (!match) return NaN;
  const [, month, day, year, hour, minute, second, ampm] = match;
  let h = Number(hour) % 12;
  if (ampm === "PM") h += 12;
  const date = new Date(Number(year), Number(month) - 1, Number(day), h, Number(minute), Number(second));
  return Math.floor(date.getTime() / 1000);
}

for await (const line of rl) {
  const fields = parseLine(line);
  if (latIdx === undefined) {
    latIdx = fields.indexOf("Latitude");
    lngIdx = fields.indexOf("Longitude");
    typeIdx = fields.indexOf("Service Request Type");
    dateIdx = fields.indexOf("Created Date");
    if ([latIdx, lngIdx, typeIdx, dateIdx].includes(-1)) throw new Error("Expected columns not found");
    continue;
  }
  const lat = parseFloat(fields[latIdx]);
  const lng = parseFloat(fields[lngIdx]);
  const time = parseDate(fields[dateIdx]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0 || !Number.isFinite(time)) {
    skipped++;
    continue;
  }
  points.push([+lng.toFixed(5), +lat.toFixed(5), getTypeIndex(fields[typeIdx]), time]);
}

writeFileSync(output, JSON.stringify({ types, points }));
console.log(`Wrote ${points.length} points to ${output} (skipped ${skipped} rows without coordinates or a valid date)`);
