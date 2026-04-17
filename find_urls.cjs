const fs = require('fs');
const path = require('path');

function findUrls(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
      const fullPath = path.join(dir, file);
      try {
        if (fs.statSync(fullPath).isDirectory()) {
          findUrls(fullPath);
        } else if (file.endsWith('.txt') || file.endsWith('.json') || file.endsWith('.log')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const urls = content.match(/https:\/\/storage\.googleapis\.com\/aistudio-user-uploads-us-central1\/[^)"'\s]+/g);
          if (urls) {
            console.log(`Found in ${fullPath}:`);
            urls.forEach(url => console.log(url));
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

findUrls('/app');
findUrls('/workspace');

