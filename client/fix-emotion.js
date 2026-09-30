const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'node_modules', '@emotion', 'react', 'isolated-hoist-non-react-statics-do-not-use-this-in-your-code', 'dist');

if (fs.existsSync(targetDir)) {
  const esmSource = path.join(targetDir, 'emotion-react-isolated-hoist-non-react-statics-do-not-use-this-in-your-code.esm.js');
  const esmDest = path.join(targetDir, 'emotion-react-isolated-hoist-non-react-statics-do-not-use-this-in-your-code.browser.esm.js');
  
  const cjsSource = path.join(targetDir, 'emotion-react-isolated-hoist-non-react-statics-do-not-use-this-in-your-code.cjs.js');
  const cjsDest = path.join(targetDir, 'emotion-react-isolated-hoist-non-react-statics-do-not-use-this-in-your-code.browser.cjs.js');

  if (fs.existsSync(esmSource) && !fs.existsSync(esmDest)) {
    fs.copyFileSync(esmSource, esmDest);
  }
  if (fs.existsSync(cjsSource) && !fs.existsSync(cjsDest)) {
    fs.copyFileSync(cjsSource, cjsDest);
  }
}
