import * as vscode from 'vscode';
import { Snippet, SnippetStore } from './snippetStore';

// ─── Tree Item Types ──────────────────────────────────────────────────────────

export class LanguageItem extends vscode.TreeItem {
  constructor(public readonly language: string, snippetCount: number) {
    super(language, vscode.TreeItemCollapsibleState.Expanded);
    this.description = `${snippetCount} snippet${snippetCount !== 1 ? 's' : ''}`;
    this.iconPath = new vscode.ThemeIcon('symbol-namespace');
    this.contextValue = 'language';
  }
}

export class SnippetItem extends vscode.TreeItem {
  constructor(public readonly snippet: Snippet) {
    super(snippet.name, vscode.TreeItemCollapsibleState.None);
    this.description = snippet.language;
    this.tooltip = new vscode.MarkdownString(
      `**${snippet.name}** \`${snippet.language}\`\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``
    );
    this.iconPath = new vscode.ThemeIcon('symbol-snippet');
    this.contextValue = 'snippet';
    // Clicking a snippet item inserts it
    this.command = {
      command: 'snapSnip.insertSnippet',
      title: 'Insert Snippet',
      arguments: [this],
    };
  }
}

// ─── Tree Data Provider ───────────────────────────────────────────────────────

export class SnippetTreeProvider
  implements vscode.TreeDataProvider<LanguageItem | SnippetItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    LanguageItem | SnippetItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly store: SnippetStore) {}

  /** Trigger a tree refresh */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: LanguageItem | SnippetItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: LanguageItem | SnippetItem
  ): (LanguageItem | SnippetItem)[] {
    if (!element) {
      // Root level — return language groups
      const grouped = this.store.getGroupedByLanguage();
      if (grouped.size === 0) {
        return [];
      }
      return [...grouped.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([lang, snippets]) => new LanguageItem(lang, snippets.length));
    }

    if (element instanceof LanguageItem) {
      // Children of a language group — return its snippets
      const grouped = this.store.getGroupedByLanguage();
      const snippets = grouped.get(element.language) ?? [];
      return snippets
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => new SnippetItem(s));
    }

    return [];
  }
}
