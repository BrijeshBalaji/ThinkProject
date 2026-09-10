const fs = require('fs');

const code = fs.readFileSync('App.tsx', 'utf8');

const regex = /fetch\s*\(/g;
let match;
while ((match = regex.exec(code)) !== null) {
  console.log(`Found fetch at index ${match.index}`);
  const context = code.substring(Math.max(0, match.index - 50), match.index + 50);
  console.log(`Context: ...${context}...`);
}

const xhrRegex = /XMLHttpRequest/g;
while ((match = xhrRegex.exec(code)) !== null) {
  console.log(`Found XHR at index ${match.index}`);
}
