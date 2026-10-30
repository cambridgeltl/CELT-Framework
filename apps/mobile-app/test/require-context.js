// Test-only implementation of Metro's require.context (see babel-plugin-require-context.js).
const fs = require('fs');
const path = require('path');

global.__requireContext = (base, dir = '.', recursive = true, regex = /^\.\/.*$/) => {
  const root = path.resolve(base, dir);
  const keys = [];
  const walk = (current) => {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (recursive) walk(full);
      } else {
        const key = './' + path.relative(root, full).split(path.sep).join('/');
        if (regex.test(key)) keys.push(key);
      }
    }
  };
  walk(root);
  const context = (key) => {
    const file = path.join(root, key);
    // Binary assets (audio/images) resolve to their path, like Metro's asset ids.
    return /\.(json|js|ts|tsx)$/.test(file) ? require(file) : file;
  };
  context.keys = () => keys;
  context.resolve = (key) => path.join(root, key);
  context.id = root;
  return context;
};
