import * as vscode from 'vscode';
import { Snippet } from './snippetStore';

export class SnippetWebview {
  private static currentPanel: vscode.WebviewPanel | undefined;

  static show(context: vscode.ExtensionContext, snippet: Snippet): void {
    const column = vscode.ViewColumn.Beside;

    if (SnippetWebview.currentPanel) {
      SnippetWebview.currentPanel.reveal(column);
      SnippetWebview.currentPanel.title = snippet.name;
      SnippetWebview.currentPanel.webview.html = SnippetWebview.buildHtml(snippet);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'snippetPreview',
      snippet.name,
      column,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    panel.webview.html = SnippetWebview.buildHtml(snippet);
    panel.onDidDispose(() => {
      SnippetWebview.currentPanel = undefined;
    });

    SnippetWebview.currentPanel = panel;
  }

  private static buildHtml(snippet: Snippet): string {
    // Escape HTML entities to prevent injection from user code
    const escaped = snippet.code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const date = new Date(snippet.createdAt).toLocaleString();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${snippet.name}</title>

  <!-- Highlight.js for syntax highlighting -->
  <link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
      background: var(--vscode-editor-background, #1e1e1e);
      color: var(--vscode-editor-foreground, #d4d4d4);
      padding: 24px;
    }
    .header {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--vscode-panel-border, #444);
      padding-bottom: 16px;
    }
    h1 { font-size: 1.4rem; font-weight: 600; }
    .meta {
      font-size: 0.8rem;
      color: var(--vscode-descriptionForeground, #888);
      display: flex;
      gap: 16px;
    }
    .badge {
      background: var(--vscode-badge-background, #4d4d4d);
      color: var(--vscode-badge-foreground, #fff);
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    pre {
      margin: 0;
      border-radius: 8px;
      overflow: auto;
      font-size: 0.9rem;
      line-height: 1.6;
    }
    code { font-family: var(--vscode-editor-font-family, 'Courier New', monospace); }
    .copy-btn {
      display: inline-block;
      margin-top: 14px;
      padding: 6px 16px;
      border: none;
      border-radius: 6px;
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, #fff);
      cursor: pointer;
      font-size: 0.85rem;
    }
    .copy-btn:hover { opacity: 0.85; }
    .copied { background: #2d6a2d !important; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${snippet.name}</h1>
    <div class="meta">
      <span class="badge">${snippet.language}</span>
      <span>Saved ${date}</span>
    </div>
  </div>

  <pre><code class="language-${snippet.language}">${escaped}</code></pre>

  <button class="copy-btn" id="copyBtn">📋 Copy to Clipboard</button>

  <script>
    document.addEventListener('DOMContentLoaded', () => hljs.highlightAll());

    document.getElementById('copyBtn').addEventListener('click', () => {
      const code = ${JSON.stringify(snippet.code)};
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = '✅ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '📋 Copy to Clipboard';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  </script>
</body>
</html>`;
  }
}
