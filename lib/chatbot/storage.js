const fs = require('fs');
const path = require('path');
const { safeJsonParse } = require('./utils');

class JsonStore {
  constructor(baseDir) {
    this.baseDir = path.resolve(process.cwd(), baseDir);
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  file(name) {
    return path.join(this.baseDir, name);
  }

  read(name, fallback) {
    const filePath = this.file(name);
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return safeJsonParse(content, fallback);
  }

  write(name, value) {
    const filePath = this.file(name);
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  }
}

module.exports = {
  JsonStore
};
