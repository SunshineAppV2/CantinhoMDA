
const fs = require('fs');
const lines = fs.readFileSync('src/users/users.service.ts', 'utf-8').split('\n');
const start = 498;
const end = 560;
console.log(lines.slice(start, end).join('\n'));
