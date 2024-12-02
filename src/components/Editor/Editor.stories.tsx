import type { Meta, StoryObj } from '@storybook/react';
import { Editor } from './Editor';

const meta = {
  title: 'Components/Editor',
  component: Editor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main code editor component with AI assistance capabilities.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialValue: '// Write your code here',
    language: 'typescript',
  },
};

export const WithAIAssistant: Story = {
  args: {
    initialValue: '// Write your code here',
    language: 'typescript',
    showAIAssistant: true,
  },
};

export const ReadOnly: Story = {
  args: {
    initialValue: '// This is read-only code',
    language: 'typescript',
    readOnly: true,
  },
};
