import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export async function aggregate({ input, output, type }) {
  const raw = readFileSync(input, 'utf8');
  const data = JSON.parse(raw);
  const result = transform(data, type || detect(data));
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(`flatspace: wrote ${output}`);
}

function detect(data) {
  if (Array.isArray(data)) {
    if (data.every(v => v && typeof v === 'object' && typeof v.filename === 'string')) return 'images';
    throw new Error('flatspace aggregate: array input missing filename on every item — pass --type passthrough or --type merge if intentional');
  }
  if (data && typeof data === 'object') {
    const vals = Object.values(data);
    if (vals.length > 0 && vals.every(v => v && typeof v === 'object' && typeof v.date === 'string')) return 'videos';
    throw new Error('flatspace aggregate: object input is not a videos-style map (every value must have a date field) — pass --type passthrough for structured content docs');
  }
  throw new Error('flatspace aggregate: unrecognized input shape');
}

function transform(data, type) {
  if (type === 'images') return images(data);
  if (type === 'videos') return videos(data);
  if (type === 'merge') return merge(data);
  if (type === 'passthrough') return data;
  throw new Error(`flatspace aggregate: unknown type "${type}"`);
}

function images(arr) {
  if (!Array.isArray(arr)) throw new Error('flatspace aggregate images: expected array');
  const out = {};
  for (const item of arr) {
    if (!item.filename) throw new Error('flatspace aggregate images: item missing filename');
    out[item.filename] = { title: slugToTitle(item.filename), description: item.filename, date: item.date, size: item.size };
  }
  return out;
}

function videos(obj) {
  if (Array.isArray(obj)) throw new Error('flatspace aggregate videos: expected object map');
  return Object.values(obj).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function merge(inputs) {
  if (!Array.isArray(inputs)) throw new Error('flatspace aggregate merge: expected array of objects');
  return inputs.reduce((acc, item) => Object.assign(acc, item), {});
}

function slugToTitle(filename) {
  return filename.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ').trim();
}
