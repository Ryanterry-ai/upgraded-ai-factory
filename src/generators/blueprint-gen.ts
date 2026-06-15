import * as yaml from 'js-yaml';
import type { Blueprint } from '../core/types.js';

export function blueprintToJson(blueprint: Blueprint): string {
  return JSON.stringify(blueprint, null, 2);
}

export function blueprintToYaml(blueprint: Blueprint): string {
  return yaml.dump(blueprint, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
  });
}
