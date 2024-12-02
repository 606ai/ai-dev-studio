import { FC } from 'react';
import { Box, styled } from '@mui/material';
import Editor from '@monaco-editor/react';

const EditorContainer = styled(Box)({
  flex: 1,
  overflow: 'hidden',
});

const CodeEditor: FC = () => {
  const defaultCode = `import tensorflow as tf

def create_model():
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(10, activation='softmax')
    ])
    return model

model = create_model()
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])`;

  return (
    <EditorContainer>
      <Editor
        height="100%"
        defaultLanguage="python"
        defaultValue={defaultCode}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          suggestOnTriggerCharacters: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </EditorContainer>
  );
};

export default CodeEditor;
