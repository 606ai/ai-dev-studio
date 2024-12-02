import * as monaco from 'monaco-editor';
import { OpenAIApi, Configuration } from 'openai';
import { languages } from 'monaco-editor/esm/vs/editor/editor.api';
import { EventEmitter } from 'events';

export interface CodeSuggestion {
  text: string;
  range: monaco.Range;
  kind: monaco.languages.CompletionItemKind;
  detail?: string;
  documentation?: string;
}

export interface CodeSnippet {
  name: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
}

export interface LanguageConfig {
  id: string;
  extensions: string[];
  aliases: string[];
  mimetypes: string[];
  configuration: monaco.languages.LanguageConfiguration;
}

export class CodeEditorService extends EventEmitter {
  private openai: OpenAIApi;
  private snippets: Map<string, CodeSnippet[]> = new Map();
  private languageConfigs: Map<string, LanguageConfig> = new Map();
  private modelContexts: Map<string, string[]> = new Map();

  constructor(openAIKey: string) {
    super();
    
    const configuration = new Configuration({
      apiKey: openAIKey
    });
    
    this.openai = new OpenAIApi(configuration);
    this.initializeLanguageConfigs();
    this.initializeSnippets();
    this.initializeModelContexts();
  }

  private initializeLanguageConfigs(): void {
    // Python configuration
    this.languageConfigs.set('python', {
      id: 'python',
      extensions: ['.py'],
      aliases: ['Python', 'py'],
      mimetypes: ['text/x-python'],
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
        ],
        surroundingPairs: [
          ['{', '}'],
          ['[', ']'],
          ['(', ')'],
          ['"', '"'],
          ["'", "'"]
        ],
        onEnterRules: [
          {
            beforeText: /^\s*(?:def|class|for|if|elif|else|while|try|with|finally|except|async|match|case).*?\s*$/,
            action: { indentAction: monaco.languages.IndentAction.Indent }
          }
        ]
      }
    });

    // R configuration
    this.languageConfigs.set('r', {
      id: 'r',
      extensions: ['.r', '.R'],
      aliases: ['R', 'r'],
      mimetypes: ['text/x-r'],
      configuration: {
        comments: {
          lineComment: '#'
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
        ],
        surroundingPairs: [
          ['{', '}'],
          ['[', ']'],
          ['(', ')'],
          ['"', '"'],
          ["'", "'"]
        ]
      }
    });

    // Julia configuration
    this.languageConfigs.set('julia', {
      id: 'julia',
      extensions: ['.jl'],
      aliases: ['Julia', 'julia'],
      mimetypes: ['text/x-julia'],
      configuration: {
        comments: {
          lineComment: '#',
          blockComment: ['#=', '=#']
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
        ],
        surroundingPairs: [
          ['{', '}'],
          ['[', ']'],
          ['(', ')'],
          ['"', '"'],
          ["'", "'"]
        ]
      }
    });
  }

  private initializeSnippets(): void {
    // Python ML/AI snippets
    this.snippets.set('python', [
      {
        name: 'sklearn_model',
        description: 'Basic scikit-learn model template',
        language: 'python',
        tags: ['machine-learning', 'sklearn'],
        code: `from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# Prepare data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create and train model
model = ${1:ModelClass}()
model.fit(X_train, y_train)

# Make predictions
y_pred = model.predict(X_test)

# Evaluate model
accuracy = accuracy_score(y_test, y_pred)
print(f'Accuracy: {accuracy:.2f}')
print('\\nClassification Report:')
print(classification_report(y_test, y_pred))`
      },
      {
        name: 'pytorch_model',
        description: 'PyTorch neural network template',
        language: 'python',
        tags: ['deep-learning', 'pytorch'],
        code: `import torch
import torch.nn as nn
import torch.optim as optim

class Net(nn.Module):
    def __init__(self):
        super(Net, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(${1:input_size}, ${2:hidden_size}),
            nn.ReLU(),
            nn.Linear(${2:hidden_size}, ${3:output_size})
        )
    
    def forward(self, x):
        return self.layers(x)

# Create model and optimizer
model = Net()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters())

# Training loop
for epoch in range(num_epochs):
    for inputs, targets in dataloader:
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()`
      }
    ]);

    // R ML/AI snippets
    this.snippets.set('r', [
      {
        name: 'tidymodels_workflow',
        description: 'Basic tidymodels workflow template',
        language: 'r',
        tags: ['machine-learning', 'tidymodels'],
        code: `library(tidymodels)

# Create recipe
recipe <- recipe(${1:target} ~ ., data = ${2:training_data}) %>%
  step_normalize(all_predictors()) %>%
  step_dummy(all_nominal_predictors())

# Create model specification
model_spec <- ${3:algorithm}() %>%
  set_engine("${4:engine}") %>%
  set_mode("${5:mode}")

# Create workflow
workflow <- workflow() %>%
  add_recipe(recipe) %>%
  add_model(model_spec)

# Fit model
fit <- workflow %>%
  fit(data = ${2:training_data})

# Make predictions
predictions <- fit %>%
  predict(new_data = ${6:testing_data})`
      }
    ]);

    // Julia ML/AI snippets
    this.snippets.set('julia', [
      {
        name: 'flux_model',
        description: 'Flux.jl neural network template',
        language: 'julia',
        tags: ['deep-learning', 'flux'],
        code: `using Flux

# Define model architecture
model = Chain(
    Dense(${1:input_size}, ${2:hidden_size}, relu),
    Dense(${2:hidden_size}, ${3:output_size})
)

# Define loss function
loss(x, y) = Flux.mse(model(x), y)

# Create optimizer
opt = ADAM()

# Training loop
for epoch in 1:num_epochs
    Flux.train!(loss, params(model), train_data, opt)
end`
      }
    ]);
  }

  private initializeModelContexts(): void {
    // Add common ML/AI imports and contexts for different languages
    this.modelContexts.set('python', [
      'import numpy as np',
      'import pandas as pd',
      'import torch',
      'import tensorflow as tf',
      'from sklearn.model_selection import train_test_split',
      'from sklearn.metrics import accuracy_score, classification_report'
    ]);

    this.modelContexts.set('r', [
      'library(tidyverse)',
      'library(tidymodels)',
      'library(caret)',
      'library(keras)'
    ]);

    this.modelContexts.set('julia', [
      'using Flux',
      'using Statistics',
      'using DataFrames',
      'using MLJ'
    ]);
  }

  public async getCompletionSuggestions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    maxSuggestions: number = 5
  ): Promise<CodeSuggestion[]> {
    const wordAtPosition = model.getWordUntilPosition(position);
    const range = new monaco.Range(
      position.lineNumber,
      wordAtPosition.startColumn,
      position.lineNumber,
      wordAtPosition.endColumn
    );

    // Get current line and previous lines for context
    const currentLine = model.getLineContent(position.lineNumber);
    const previousLines = model.getLinesContent().slice(
      Math.max(0, position.lineNumber - 5),
      position.lineNumber - 1
    );

    try {
      // Get AI-powered suggestions
      const response = await this.openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `${previousLines.join('\n')}\n${currentLine}\n`,
        max_tokens: 100,
        n: maxSuggestions,
        temperature: 0.3,
        stop: ['\n']
      });

      return response.data.choices.map(choice => ({
        text: choice.text || '',
        range,
        kind: monaco.languages.CompletionItemKind.Snippet,
        detail: 'AI Suggestion',
        documentation: 'Generated by OpenAI'
      }));
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [];
    }
  }

  public getSnippets(language: string, tag?: string): CodeSnippet[] {
    const languageSnippets = this.snippets.get(language) || [];
    if (tag) {
      return languageSnippets.filter(snippet => snippet.tags.includes(tag));
    }
    return languageSnippets;
  }

  public getLanguageConfig(language: string): LanguageConfig | undefined {
    return this.languageConfigs.get(language);
  }

  public getModelContext(language: string): string[] {
    return this.modelContexts.get(language) || [];
  }

  public registerLanguage(config: LanguageConfig): void {
    this.languageConfigs.set(config.id, config);
    monaco.languages.register({
      id: config.id,
      extensions: config.extensions,
      aliases: config.aliases,
      mimetypes: config.mimetypes
    });
    monaco.languages.setLanguageConfiguration(config.id, config.configuration);
  }

  public registerSnippet(language: string, snippet: CodeSnippet): void {
    const languageSnippets = this.snippets.get(language) || [];
    languageSnippets.push(snippet);
    this.snippets.set(language, languageSnippets);
  }

  public dispose(): void {
    this.removeAllListeners();
  }
}

export default CodeEditorService;
