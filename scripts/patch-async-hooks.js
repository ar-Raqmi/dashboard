const fs = require('fs');
const path = require('path');

function patchDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      patchDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('"async_hooks"')) {
        content = content.replace(/"async_hooks"/g, '"node:async_hooks"');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Patched ${fullPath}`);
      }
      if (content.includes("'async_hooks'")) {
        content = content.replace(/'async_hooks'/g, "'node:async_hooks'");
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Patched ${fullPath}`);
      }
    }
  }
}

const targetDir = path.join(__dirname, '../.vercel/output/static/_worker.js/__next-on-pages-dist__/functions');
console.log('Patching async_hooks in', targetDir);
patchDir(targetDir);
