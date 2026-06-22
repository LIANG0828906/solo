const fs = require('fs');

function checkFile(path) {
  console.log(`\n=== ${path} ===`);
  const content = fs.readFileSync(path, 'utf8');
  console.log(`Length: ${content.length}`);
  console.log(`First 100 chars: ${JSON.stringify(content.substring(0, 100))}`);
  console.log(`Last 100 chars: ${JSON.stringify(content.substring(content.length - 100))}`);
}

checkFile('src/App.tsx');
checkFile('src/AudioAnalyzer.ts');
checkFile('src/GameEngine.ts');
checkFile('src/types.ts');
checkFile('src/Renderer.ts');
checkFile('src/ComboSystem.ts');
