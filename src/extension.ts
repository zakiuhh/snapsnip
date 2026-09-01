import * as vscode from 'vscode';
import { SnippetStore } from './snippetStore';
import { SnippetItem, SnippetTreeProvider } from './snippetTreeProvider';
import { SnippetWebview } from './snippetWebview';

export function activate(context: vscode.ExtensionContext) {
  // ── Store (global: uses globalState, persists across workspaces) ───────────
  const store = new SnippetStore(context.globalState);

  // ── Sidebar tree ───────────────────────────────────────────────────────────
  const treeProvider = new SnippetTreeProvider(store);
  const treeView = vscode.window.createTreeView('snapSnipView', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  // ── Helper: refresh tree ──────────────────────────────────────────────────
  const refresh = () => treeProvider.refresh();

  // ── Command: Save Snippet (Ctrl+Alt+S) ────────────────────────────────────
  const saveCmd = vscode.commands.registerCommand(
    'snapSnip.saveSnippet',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found.');
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage(
          'Please select some code before saving a snippet.'
        );
        return;
      }

      const code = editor.document.getText(selection);
      // Auto-detect language from the active document
      const language = editor.document.languageId;

      const name = await vscode.window.showInputBox({
        prompt: 'Enter a name for your snippet',
        placeHolder: 'e.g. "Debounce function"',
        validateInput: (v) =>
          v.trim().length === 0 ? 'Name cannot be empty.' : undefined,
      });

      if (name === undefined) {
        return; // user cancelled
      }

      store.add(name.trim(), language, code);
      refresh();

      vscode.window.showInformationMessage(
        `✅ Snippet "${name.trim()}" saved as [${language}]`
      );
    }
  );

  // ── Command: Insert Snippet ───────────────────────────────────────────────
  const insertCmd = vscode.commands.registerCommand(
    'snapSnip.insertSnippet',
    async (item?: SnippetItem) => {
      let snippet = item?.snippet;

      // If triggered from command palette (no item), let user pick
      if (!snippet) {
        const all = store.getAll();
        if (all.length === 0) {
          vscode.window.showInformationMessage(
            'No snippets saved yet. Select code and press Ctrl+Alt+S to save one!'
          );
          return;
        }
        const picked = await vscode.window.showQuickPick(
          all.map((s) => ({
            label: s.name,
            description: s.language,
            detail: s.code.split('\n')[0].trim(),
            snippet: s,
          })),
          { placeHolder: 'Choose a snippet to insert' }
        );
        if (!picked) {
          return;
        }
        snippet = picked.snippet;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage(
          'No active editor — open a file first.'
        );
        return;
      }

      editor.edit((editBuilder) => {
        editBuilder.replace(editor.selection, snippet!.code);
      });
    }
  );

  // ── Command: Delete Snippet ───────────────────────────────────────────────
  const deleteCmd = vscode.commands.registerCommand(
    'snapSnip.deleteSnippet',
    async (item?: SnippetItem) => {
      let snippetId: string | undefined;
      let snippetName: string | undefined;

      if (item?.snippet) {
        snippetId = item.snippet.id;
        snippetName = item.snippet.name;
      } else {
        // Command palette fallback
        const all = store.getAll();
        const picked = await vscode.window.showQuickPick(
          all.map((s) => ({ label: s.name, description: s.language, id: s.id })),
          { placeHolder: 'Choose a snippet to delete' }
        );
        if (!picked) {
          return;
        }
        snippetId = picked.id;
        snippetName = picked.label;
      }

      const confirm = await vscode.window.showWarningMessage(
        `Delete snippet "${snippetName}"?`,
        { modal: true },
        'Delete'
      );
      if (confirm !== 'Delete') {
        return;
      }

      store.delete(snippetId!);
      refresh();
      vscode.window.showInformationMessage(`🗑️ Snippet "${snippetName}" deleted.`);
    }
  );

  // ── Command: Preview Snippet (Webview) ────────────────────────────────────
  const previewCmd = vscode.commands.registerCommand(
    'snapSnip.previewSnippet',
    async (item?: SnippetItem) => {
      let snippet = item?.snippet;

      if (!snippet) {
        const all = store.getAll();
        const picked = await vscode.window.showQuickPick(
          all.map((s) => ({ label: s.name, description: s.language, snippet: s })),
          { placeHolder: 'Choose a snippet to preview' }
        );
        if (!picked) {
          return;
        }
        snippet = picked.snippet;
      }

      SnippetWebview.show(context, snippet);
    }
  );

  // ── Command: Import Snippets from JSON (e.g. from Web App) ────────────────
  const importCmd = vscode.commands.registerCommand(
    'snapSnip.importSnippets',
    async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        openLabel: 'Import Snippets',
        filters: {
          'JSON Files': ['json'],
        },
      });

      if (!uris || uris.length === 0) {
        return;
      }

      try {
        const fileData = await vscode.workspace.fs.readFile(uris[0]);
        const contentStr = new TextDecoder('utf-8').decode(fileData);
        const parsed = JSON.parse(contentStr);

        let snippetList: any[] = [];
        if (Array.isArray(parsed)) {
          snippetList = parsed;
        } else if (parsed && Array.isArray(parsed.snippets)) {
          snippetList = parsed.snippets;
        } else {
          vscode.window.showErrorMessage(
            'Invalid format: Expected a JSON file containing an array of snippets or a {"snippets": [...]} object.'
          );
          return;
        }

        const count = store.importSnippets(snippetList);
        refresh();

        if (count === 0) {
          vscode.window.showWarningMessage('No valid snippets found in the selected file.');
        } else {
          vscode.window.showInformationMessage(
            `✅ Successfully imported ${count} snippet${count !== 1 ? 's' : ''}!`
          );
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to import snippets: ${err.message || err}`);
      }
    }
  );

  // ── Command: Export Snippets to JSON ──────────────────────────────────────
  const exportCmd = vscode.commands.registerCommand(
    'snapSnip.exportSnippets',
    async () => {
      const all = store.getAll();
      if (all.length === 0) {
        vscode.window.showInformationMessage('No snippets saved to export yet.');
        return;
      }

      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`snapsnip-export-${new Date().toISOString().slice(0, 10)}.json`),
        filters: {
          'JSON Files': ['json'],
        },
      });

      if (!saveUri) {
        return;
      }

      try {
        const payload = {
          version: '1.0',
          source: 'snapsnip-vscode',
          exportedAt: new Date().toISOString(),
          snippets: all,
        };

        const jsonStr = JSON.stringify(payload, null, 2);
        const encoded = new TextEncoder().encode(jsonStr);
        await vscode.workspace.fs.writeFile(saveUri, encoded);

        vscode.window.showInformationMessage(
          `✅ Successfully exported ${all.length} snippet${all.length !== 1 ? 's' : ''} to ${saveUri.fsPath}!`
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to export snippets: ${err.message || err}`);
      }
    }
  );

  // ── Command: Refresh tree ─────────────────────────────────────────────────
  const refreshCmd = vscode.commands.registerCommand(
    'snapSnip.refresh',
    refresh
  );

  // ── Empty-state message in sidebar ───────────────────────────────────────
  treeView.message =
    store.getAll().length === 0
      ? 'No snippets yet. Select code and press Ctrl+Alt+S to save your first!'
      : undefined;

  // Update sidebar message whenever tree refreshes
  treeProvider.onDidChangeTreeData(() => {
    treeView.message =
      store.getAll().length === 0
        ? 'No snippets yet. Select code and press Ctrl+Alt+S to save your first!'
        : undefined;
  });

  context.subscriptions.push(
    treeView,
    saveCmd,
    insertCmd,
    deleteCmd,
    previewCmd,
    importCmd,
    exportCmd,
    refreshCmd
  );
}

export function deactivate() {}
