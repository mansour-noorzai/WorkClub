import { readFileSync } from 'fs';
import { resolve } from 'path';
import YAML from 'yaml';

const candidates = [
  resolve(process.cwd(), 'openapi.yaml'),
  resolve(process.cwd(), 'backend/openapi.yaml'),
  resolve(__dirname, '../../openapi.yaml'),
];

export function loadOpenApiDocument(): Record<string, unknown> {
  const path = candidates.find((candidate) => {
    try {
      readFileSync(candidate);
      return true;
    } catch {
      return false;
    }
  });
  if (!path) throw new Error('Unable to locate backend/openapi.yaml.');
  return YAML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}
