import { existsSync } from 'fs';
import { join } from 'path';
import { getAllFiles, readFile, type ValidationFinding } from './validators.js';

const CLIENT_HOOKS = [
  'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo',
  'useReducer', 'useContext', 'useLayoutEffect', 'useImperativeHandle',
];

const CLIENT_APIS = [
  'window', 'document', 'navigator', 'localStorage', 'sessionStorage',
  'fetch(', 'addEventListener', 'removeEventListener', 'setTimeout', 'setInterval',
  'requestAnimationFrame', 'IntersectionObserver', 'MutationObserver',
];

const CLIENT_EVENTS = [
  'onClick', 'onChange', 'onSubmit', 'onFocus', 'onBlur', 'onKeyDown', 'onKeyUp',
  'onMouseEnter', 'onMouseLeave', 'onScroll', 'onDrag', 'onDrop',
];

export function validateClientComponents(projectDir: string): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const tsFiles = getAllFiles(projectDir).filter(f => f.endsWith('.tsx') && f.startsWith('src/'));

  for (const file of tsFiles) {
    if (file.includes('layout.tsx') || file.includes('route.ts')) continue;

    const content = readFile(join(projectDir, file));
    const hasClient = content.startsWith('"use client"') || content.includes('\n"use client"');

    const usesHooks = CLIENT_HOOKS.some(hook => content.includes(hook));
    const usesClientApi = CLIENT_APIS.some(api => content.includes(api));
    const usesEvents = CLIENT_EVENTS.some(evt => content.includes(evt));

    if ((usesHooks || usesClientApi || usesEvents) && !hasClient) {
      const reasons: string[] = [];
      if (usesHooks) reasons.push('hooks');
      if (usesClientApi) reasons.push('browser APIs');
      if (usesEvents) reasons.push('event handlers');
      findings.push({
        severity: 'critical', category: 'client-component', file,
        message: `Missing "use client" directive (uses ${reasons.join(', ')})`,
      });
    }

    if (hasClient) {
      const imports = content.match(/import\s+(?:React,?\s*)?{([^}]+)}\s+from\s+['"]react['"]/);
      if (imports) {
        const names = imports[1].split(',').map(s => s.trim());
        for (const name of names) {
          if (CLIENT_HOOKS.includes(name) && !content.includes(`${name}(`)) {
            findings.push({
              severity: 'minor', category: 'client-component', file,
              message: `Imports ${name} but doesn't use it`,
            });
          }
        }
      }
    }
  }

  return findings;
}
