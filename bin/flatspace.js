#!/usr/bin/env node
import { aggregate } from '../src/aggregate.js';

const [,, cmd, ...args] = process.argv;
if (cmd === 'aggregate') {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') opts.input = args[++i];
    if (args[i] === '--output') opts.output = args[++i];
    if (args[i] === '--type') opts.type = args[++i];
  }
  if (!opts.input) { console.error('flatspace aggregate: --input required'); process.exit(1); }
  if (!opts.output) { console.error('flatspace aggregate: --output required'); process.exit(1); }
  aggregate(opts).catch(e => { console.error(e.message); process.exit(1); });
} else {
  console.error('flatspace: unknown command', cmd);
  console.error('usage: flatspace aggregate --input <file> --output <file> [--type images|videos|merge]');
  process.exit(1);
}
