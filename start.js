const { spawn } = require('child_process');

const deploy = spawn('node', ['deploy.js']);
deploy.stdout.pipe(process.stdout);

deploy.on('close', () => {
  const loader = spawn('node', ['loader.js']);
  loader.stdout.pipe(process.stdout);
});