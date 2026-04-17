import fs from 'fs';
const data = fs.readFileSync('shineray.txt', 'utf8');
console.log(data.length);
