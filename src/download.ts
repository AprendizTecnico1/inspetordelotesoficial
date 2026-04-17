import https from 'https';
import fs from 'fs';

function downloadAsBase64(url: string, filename: string) {
  https.get(url, (res) => {
    const data: Buffer[] = [];
    res.on('data', (chunk) => data.push(chunk));
    res.on('end', () => {
      const buffer = Buffer.concat(data);
      const base64 = buffer.toString('base64');
      fs.writeFileSync(filename, `data:${res.headers['content-type']};base64,${base64}`);
      console.log(`Saved ${filename}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${url}: ${err.message}`);
  });
}

downloadAsBase64('https://logodownload.org/wp-content/uploads/2020/02/shineray-logo.png', 'shineray.txt');
