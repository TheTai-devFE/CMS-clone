const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, '../src'), function(filePath) {
  if (filePath.endsWith('.dto.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace: propertyName: type; -> propertyName!: type;
    let modified = content.replace(/^(\s+)([a-zA-Z0-9_]+): ([^;\n]+);$/gm, (match, spaces, name, type) => {
      return `${spaces}${name}!: ${type};`;
    });
    if (content !== modified) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});
