// uuid v11 in CommonJS context — use require to stay compatible
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { v4: uuidv4 } = require('uuid') as { v4: () => string };
import * as vscode from 'vscode';

export interface Snippet {
  id: string;
  name: string;
  language: string;
  code: string;
  createdAt: string;
}

const STORAGE_KEY = 'snippetManager.snippets';

export class SnippetStore {
  constructor(private readonly globalState: vscode.Memento) {}

  /** Return all saved snippets */
  getAll(): Snippet[] {
    return this.globalState.get<Snippet[]>(STORAGE_KEY, []);
  }

  /** Return snippets grouped by language */
  getGroupedByLanguage(): Map<string, Snippet[]> {
    const map = new Map<string, Snippet[]>();
    for (const snippet of this.getAll()) {
      const group = map.get(snippet.language) ?? [];
      group.push(snippet);
      map.set(snippet.language, group);
    }
    return map;
  }

  /** Add a new snippet and persist */
  add(name: string, language: string, code: string): Snippet {
    const snippet: Snippet = {
      id: uuidv4(),
      name,
      language,
      code,
      createdAt: new Date().toISOString(),
    };
    const all = this.getAll();
    all.push(snippet);
    this.globalState.update(STORAGE_KEY, all);
    return snippet;
  }

  /** Bulk import snippets and persist */
  importSnippets(incoming: Partial<Snippet>[]): number {
    const valid = incoming.filter((s): s is Partial<Snippet> & { name: string; code: string } => 
      typeof s?.name === 'string' && s.name.trim().length > 0 && typeof s?.code === 'string'
    );

    if (valid.length === 0) {
      return 0;
    }

    const all = this.getAll();
    for (const s of valid) {
      all.push({
        id: s.id || uuidv4(),
        name: s.name.trim(),
        language: (s.language || 'plaintext').trim().toLowerCase(),
        code: s.code,
        createdAt: s.createdAt || new Date().toISOString(),
      });
    }

    this.globalState.update(STORAGE_KEY, all);
    return valid.length;
  }

  /** Delete a snippet by id */
  delete(id: string): void {
    const filtered = this.getAll().filter((s) => s.id !== id);
    this.globalState.update(STORAGE_KEY, filtered);
  }

  /** Find a single snippet by id */
  findById(id: string): Snippet | undefined {
    return this.getAll().find((s) => s.id === id);
  }
}
