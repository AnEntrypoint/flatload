#!/usr/bin/env node
import { aggregate } from '../src/aggregate.js';
import { buildCli } from '../src/build-node.js';

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
} else if (cmd === 'build') {
  buildCli(args).catch(e => { console.error(e.stack || e.message); process.exit(1); });
} else {
  console.error('flatspace — usage:');
  console.error('  flatspace build                       # build static site using flatspace.config.{mjs,js} in cwd');
  console.error('  flatspace aggregate --input <f> --output <f> [--type images|videos|merge|passthrough]');
  process.exit(cmd ? 1 : 0);
}
