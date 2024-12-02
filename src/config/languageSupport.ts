import { Monaco } from '@monaco-editor/react';

export interface LanguageConfig {
  id: string;
  extensions: string[];
  aliases: string[];
  mimeTypes: string[];
  configuration: any;
}

export const languages: LanguageConfig[] = [
  {
    id: 'python',
    extensions: ['.py', '.pyw', '.pyi'],
    aliases: ['Python', 'py'],
    mimeTypes: ['text/x-python', 'application/x-python'],
    configuration: {
      comments: {
        lineComment: '#',
        blockComment: ['"""', '"""']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] }
      ]
    }
  },
  {
    id: 'cpp',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h', '.hh', '.hxx'],
    aliases: ['C++', 'Cpp', 'cpp'],
    mimeTypes: ['text/x-c++src', 'text/x-c++hdr'],
    configuration: {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    }
  },
  {
    id: 'javascript',
    extensions: ['.js', '.jsx', '.es6', '.mjs'],
    aliases: ['JavaScript', 'javascript', 'js'],
    mimeTypes: ['text/javascript'],
    configuration: {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string'] },
        { open: '`', close: '`', notIn: ['string'] }
      ]
    }
  }
];

export const sdkIntegrations = {
  esp32: {
    name: 'ESP32',
    sdkPath: '/usr/local/esp-idf',
    toolchain: {
      compiler: 'xtensa-esp32-elf-gcc',
      debugger: 'xtensa-esp32-elf-gdb'
    },
    commands: {
      build: 'idf.py build',
      flash: 'idf.py -p {port} flash',
      monitor: 'idf.py -p {port} monitor'
    }
  },
  arduino: {
    name: 'Arduino',
    sdkPath: '/usr/local/arduino',
    toolchain: {
      compiler: 'arduino-cli',
      uploader: 'avrdude'
    },
    commands: {
      build: 'arduino-cli compile --fqbn {board} {sketch}',
      upload: 'arduino-cli upload -p {port} --fqbn {board} {sketch}'
    }
  }
};

export function configureMonaco(monaco: Monaco) {
  // Register languages
  languages.forEach(lang => {
    monaco.languages.register({
      id: lang.id,
      extensions: lang.extensions,
      aliases: lang.aliases,
      mimeTypes: lang.mimeTypes
    });

    monaco.languages.setLanguageConfiguration(lang.id, lang.configuration);
  });

  // Configure editor settings
  monaco.editor.defineTheme('windsurf-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#2D2D2D',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41'
    }
  });
}
