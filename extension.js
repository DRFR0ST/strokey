// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let keyStrokes = 0;
let barItem;
/**
 * @param {vscode.ExtensionContext} context
 */
function activate({ subscriptions, globalState }) {
  const state = globalState.get("key-strokes");
  if (!state) globalState.update("key-strokes", 0);

  keyStrokes = globalState.get("key-strokes");

  const countCMDId = "extension.count";

  subscriptions.push(
    vscode.commands.registerCommand(countCMDId, () => {
      vscode.window.showInformationMessage(
        `Stroke-Log: Stroked ${keyStrokes} keys!`
      );
    })
  );

  barItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  barItem.command = countCMDId;

  subscriptions.push(barItem);

  subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e =>
      updateKeyStrokes(e, globalState)
    )
  );

  console.log("[stroke-log] v1.0.0 activated!");
  updateKeyStrokes();
}

function updateKeyStrokes(e, globalState) {
  if (e && e.contentChanges && e.contentChanges[0].text.length <= 1) {
    globalState.update("key-strokes", keyStrokes);
    keyStrokes = keyStrokes + 1;
  }

  if (keyStrokes > -1) {
    barItem.text = `⌨️  ${keyStrokes} strokes`;
    barItem.show();
  } else {
    barItem.hide();
  }
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate({ globalState }) {
  console.log("[stroke-log] v1.0.0 deactivated!");
}

module.exports = {
  activate,
  deactivate
};
