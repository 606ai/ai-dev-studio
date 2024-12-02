import React, { useEffect } from 'react';
import CodeMirror from 'codemirror';
import Split from 'split.js';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/mode/python/python';

function App() {
  useEffect(() => {
    // Initialize CodeMirror
    const editor = CodeMirror(document.getElementById('editor'), {
      mode: 'python',
      theme: 'monokai',
      lineNumbers: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      value: `import tensorflow as tf\n\ndef create_model():\n    model = tf.keras.Sequential([\n        tf.keras.layers.Dense(128, activation='relu'),\n        tf.keras.layers.Dropout(0.2),\n        tf.keras.layers.Dense(10, activation='softmax')\n    ])\n    return model`,
    });

    // Initialize Split.js
    Split(['#editor-container', '#visualization-container'], {
      sizes: [50, 50],
      minSize: 300,
      gutterSize: 8,
      snapOffset: 0,
    });

    return () => {
      // Cleanup
      editor.toTextArea();
    };
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>AI Development Studio</h1>
        <div className="header-controls">
          <button onClick={() => console.log('Toggle theme')}>Toggle Theme</button>
          <button onClick={() => console.log('Deploy')}>Deploy</button>
          <button onClick={() => console.log('Debug')}>Debug</button>
        </div>
      </header>

      <div className="main-content">
        <div id="editor-container" className="editor-container">
          <div id="editor"></div>
        </div>
        <div id="visualization-container" className="visualization-container">
          <h3>AI Canvas</h3>
          <div id="aiCanvas"></div>
        </div>
      </div>
    </div>
  );
}

export default App;
