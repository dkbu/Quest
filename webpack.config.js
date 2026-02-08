const path = require('path');
const fs = require('fs');

// Custom plugin to inject CSS
class InjectCSSPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('InjectCSSPlugin', (compilation, callback) => {
      const cssPath = path.resolve(__dirname, 'styles/quest-task-manager.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      // Create CSS injection code
      const cssInjectionCode = `
// Auto-inject CSS
(function() {
  const css = \`${cssContent}\`;
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = css;
  document.getElementsByTagName('head')[0].appendChild(style);
})();
`;

      // Find the main asset
      const mainAsset = compilation.assets['quest-task-manager-standalone.js'];
      if (mainAsset) {
        const originalSource = mainAsset.source();
        const newSource = cssInjectionCode + '\n' + originalSource;
        
        compilation.assets['quest-task-manager-standalone.js'] = {
          source: () => newSource,
          size: () => newSource.length
        };
      }
      
      callback();
    });
  }
}

module.exports = [
  // Standard build without CSS
  {
    entry: './src/quest-task-manager.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'quest-task-manager.js',
      library: 'QuestTaskManager',
      libraryTarget: 'umd',
      libraryExport: 'default',
      globalObject: 'this'
    },
    resolve: {
      extensions: ['.js', '.css'],
    }
  },
  // Build with CSS included
  {
    entry: './src/quest-task-manager.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'quest-task-manager-standalone.js',
      library: 'QuestTaskManager',
      libraryTarget: 'umd',
      libraryExport: 'default',
      globalObject: 'this'
    },
    plugins: [
      new InjectCSSPlugin()
    ],
    resolve: {
      extensions: ['.js', '.css'],
    }
  }
];