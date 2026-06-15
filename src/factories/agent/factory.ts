import { Factory } from '../../core/engine.js';
import type { FactoryConfig, FactoryResult, StudioInput, EngineConfig, Blueprint, GeneratedFile } from '../../core/types.js';
import { processInput } from '../../inputs/index.js';
import { generatePage, generateLayout, generateStyles, generateConfig, generatePackageJson, generateTsConfig, generateTailwindConfig, generatePostcssConfig, sanitizeProjectName } from '../../generators/codegen.js';

export class AgentFactory extends Factory {
  readonly config: FactoryConfig = {
    name: 'AI Agent Factory',
    type: 'agent',
    description: 'Generates AI agents with chat UI, knowledge base, and integrations',
    supportedInputs: ['prompt', 'url', 'screenshot'],
    outputFormats: ['nextjs'],
    version: '0.1.0',
  };

  canHandle(input: StudioInput): boolean {
    if (input.prompt) {
      const lower = input.prompt.toLowerCase();
      return /agent|chatbot|chat|ai|assistant|bot|llm|gpt|conversational/i.test(lower);
    }
    return false;
  }

  async execute(input: StudioInput, config: EngineConfig): Promise<FactoryResult> {
    const startTime = Date.now();
    const files: GeneratedFile[] = [];
    const processed = await processInput(input);
    const blueprint = this.buildBlueprint(processed.prompt, processed.metadata);
    const projectName = blueprint.project.name;
    files.push(...this.generateProjectFiles(blueprint));

    if (!config.dryRun) {
      const fs = await import('fs');
      const path = await import('path');
      const outDir = path.join(config.outputDir, projectName);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      for (const file of files) {
        const filePath = path.join(outDir, file.path);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, file.content);
      }
      await this.writeBlueprint(blueprint, config.outputDir, projectName);
    }

    return this.createResult(true, 'agent', config.outputDir, files, blueprint, startTime, 'prompt');
  }

  private buildBlueprint(prompt: string, _metadata: Record<string, unknown>): Blueprint {
    const name = this.extractName(prompt);
    return this.createBlueprint({
      project: { name, description: prompt.slice(0, 200), framework: 'nextjs', styling: 'tailwind', language: 'typescript', generatedAt: new Date().toISOString(), version: '0.1.0' },
      pages: [
        { path: '/', name: 'Chat', description: 'Main chat interface', components: ['ChatLayout', 'ChatMessages', 'ChatInput'], isPrimary: true },
        { path: '/settings', name: 'Settings', description: 'Agent settings', components: ['SettingsForm'], isPrimary: false },
      ],
      components: [
        { name: 'ChatLayout', type: 'template', tag: 'div', classes: [], props: [{ name: 'children', type: 'ReactNode', required: true }], variants: [], children: [], parent: null, selector: '.chat-layout' },
        { name: 'ChatMessages', type: 'organism', tag: 'div', classes: [], props: [{ name: 'messages', type: 'Message[]', required: true }], variants: [], children: [], parent: null, selector: '.chat-messages' },
        { name: 'ChatInput', type: 'molecular', tag: 'form', classes: [], props: [{ name: 'onSend', type: '(text: string) => void', required: true }], variants: [], children: [], parent: null, selector: '.chat-input' },
        { name: 'MessageBubble', type: 'molecular', tag: 'div', classes: [], props: [{ name: 'message', type: 'Message', required: true }], variants: [], children: [], parent: null, selector: '.message-bubble' },
        { name: 'Button', type: 'atomic', tag: 'button', classes: [], props: [{ name: 'variant', type: 'string', required: false }], variants: [], children: [], parent: null, selector: 'button' },
      ],
      apiContracts: [
        { method: 'POST', path: '/api/chat', description: 'Send message', request: { message: 'string', conversationId: 'string' }, response: { reply: 'string', conversationId: 'string' } },
      ],
    });
  }

  private extractName(prompt: string): string {
    const match = prompt.match(/(?:called?|named?|for)\s+["']?([A-Z][^"']+)["']?/i);
    return match?.[1] || 'AI Assistant';
  }

  private generateProjectFiles(blueprint: Blueprint): GeneratedFile[] {
    const name = sanitizeProjectName(blueprint.project.name);
    return [
      { path: 'src/app/page.tsx', content: this.genChatPage(), type: 'page' },
      { path: 'src/app/layout.tsx', content: generateLayout(name, ''), type: 'page' },
      { path: 'src/app/globals.css', content: generateStyles(), type: 'style' },
      { path: 'src/components/ChatLayout.tsx', content: this.genChatLayout(), type: 'component' },
      { path: 'src/components/ChatMessages.tsx', content: this.genChatMessages(), type: 'component' },
      { path: 'src/components/ChatInput.tsx', content: this.genChatInput(), type: 'component' },
      { path: 'src/components/MessageBubble.tsx', content: this.genMessageBubble(), type: 'component' },
      { path: 'src/lib/types.ts', content: this.genTypes(), type: 'type' },
      { path: 'src/app/api/chat/route.ts', content: this.genChatApi(), type: 'api' },
      { path: generateConfig(name).filename, content: generateConfig(name).content, type: 'config' },
      { path: 'package.json', content: generatePackageJson(name), type: 'config' },
      { path: 'tsconfig.json', content: generateTsConfig(), type: 'config' },
      { path: generateTailwindConfig().filename, content: generateTailwindConfig().content, type: 'config' },
      { path: generatePostcssConfig().filename, content: generatePostcssConfig().content, type: 'config' },
    ];
  }

  private genChatPage(): string {
    return `"use client";
import React, { useState } from 'react';
import { ChatLayout } from '@/components/ChatLayout';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import type { Message } from '@/lib/types';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! How can I help you today?', timestamp: new Date().toISOString() },
  ]);

  const handleSend = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const data = await res.json();
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {}
  };

  return (
    <ChatLayout>
      <ChatMessages messages={messages} />
      <ChatInput onSend={handleSend} />
    </ChatLayout>
  );
}
`;
  }

  private genChatLayout(): string {
    return `import React from 'react';

export function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b px-6 py-4"><h1 className="text-lg font-semibold">AI Assistant</h1></header>
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
`;
  }

  private genChatMessages(): string {
    return `import React from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@/lib/types';

export function ChatMessages({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
    </div>
  );
}
`;
  }

  private genChatInput(): string {
    return `"use client";
import React, { useState } from 'react';

export function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (text.trim()) { onSend(text.trim()); setText(''); } };
  return (
    <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 border rounded-lg px-4 py-2" />
      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Send</button>
    </form>
  );
}
`;
  }

  private genMessageBubble(): string {
    return `import React from 'react';
import type { Message } from '@/lib/types';

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={\`flex \${isUser ? 'justify-end' : 'justify-start'}\`}>
      <div className={\`max-w-[70%] rounded-lg px-4 py-2 \${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100'}\`}>
        <p>{message.content}</p>
      </div>
    </div>
  );
}
`;
  }

  private genTypes(): string {
    return `export interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; }
export interface Conversation { id: string; messages: Message[]; createdAt: string; }
`;
  }

  private genChatApi(): string {
    return `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { message } = await request.json();
  return NextResponse.json({ reply: \`I received your message: "\${message}". This is a placeholder response.\`, conversationId: 'conv-1' });
}
`;
  }
}
