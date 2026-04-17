import fs from 'fs';

const shinerayBase64 = fs.readFileSync('shineray.txt', 'utf8');

const sbmSvg = `<svg viewBox="0 0 310 110" xmlns="http://www.w3.org/2000/svg">
  <polygon points="10,15 95,15 95,35 45,35 95,65 95,85 10,85 10,65 60,65 10,35" fill="#e32222" />
  <path d="M 105,15 L 190,15 L 190,85 L 105,85 Z M 130,42 L 165,42 L 165,28 L 130,28 Z M 130,72 L 165,72 L 165,55 L 130,55 Z" fill="#e32222" fill-rule="evenodd" />
  <polygon points="200,85 200,15 230,15 250,50 270,15 300,15 300,85 275,85 275,45 250,85 225,45 225,85" fill="#e32222" />
  <rect x="10" y="95" width="85" height="10" fill="#65b32e" />
  <rect x="200" y="95" width="100" height="10" fill="#e32222" />
</svg>`;

const sbmDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(sbmSvg)}`;

const fileContent = `export const SHINERAY_LOGO = "${shinerayBase64}";\nexport const SBM_LOGO = "${sbmDataUri}";\n`;

fs.writeFileSync('src/lib/logos.ts', fileContent);
console.log('Created src/lib/logos.ts');
