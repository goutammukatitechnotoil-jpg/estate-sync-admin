const fs = require('fs');
const s = fs.readFileSync('app/properties/bulk-upload/page.tsx','utf8');
const regex = /<(\/)?([A-Za-z0-9_\.]+)([^>]*)>/g;
const stack = [];
let m;
const selfClosingRE = /\/\s*>$/;
while ((m = regex.exec(s)) !== null) {
  const full = m[0];
  const close = m[1];
  const tag = m[2];
  if (tag.startsWith('!--')) continue;
  if (close) {
    if (stack.length === 0) {
      console.log('unexpected close', tag, 'at', s.slice(0, m.index).split('\n').length); break;
    }
    const top = stack.pop();
    if (top !== tag) {
      console.log('mismatch', top, 'vs', tag, 'at', s.slice(0, m.index).split('\n').length); break;
    }
  } else {
    if (selfClosingRE.test(full) || ['input','img','br','hr','meta','link'].includes(tag.toLowerCase())) continue;
    if (full.includes(' />')) continue;
    stack.push(tag);
  }
}
console.log('stack end', stack.slice(-10));