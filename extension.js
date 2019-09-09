// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let keystrokes = {
  workspace: {
    daily: 0,
    weekly: 0,
    monthly: 0,
    all: 0
  },
  global: {
    daily: 0,
    weekly: 0,
    monthly: 0,
    all: 0
  }
};
let workspaceToggled = false;

let barItem;
let barItemWorkspace;
/**
 * @param {vscode.ExtensionContext} context
 */
function activate({ subscriptions, globalState, workspaceState }) {
  // Workspace toggle
  workspaceToggled = globalState.get("workspace-toggled");

  // Global state
  keystrokes.global.daily = globalState.get("global-daily-strokes") || globalState.get("daily-strokes") || 0;
  keystrokes.global.weekly = globalState.get("global-weekly-strokes") || globalState.get("weekly-strokes") || 0;
  keystrokes.global.monthly = globalState.get("global-monthly-strokes") || 0;
  keystrokes.global.all = globalState.get("global-all-strokes") || globalState.get("key-strokes") || 0;

  // Workspace state
  keystrokes.workspace.daily =
    workspaceState.get("workspace-daily-strokes") || 0;
  keystrokes.workspace.weekly =
    workspaceState.get("workspace-weekly-strokes") || 0;
  keystrokes.workspace.monthly =
    workspaceState.get("workspace-monthly-strokes") || 0;
  keystrokes.workspace.all = workspaceState.get("workspace-all-strokes") || 0;

  const countCMDId = "extension.count";
  const countCMDIdWorkspace = "extension.countWorkspace";

  subscriptions.push(
    vscode.commands.registerCommand(countCMDId, () => {
      vscode.window.showInformationMessage(
        `Stroked ${keystrokes.global.all} keys in whole, ${keystrokes.global.monthly} in this month, ${keystrokes.global.weekly} in this week, ${keystrokes.global.daily} today.`
      );
    })
  );

  subscriptions.push(
    vscode.commands.registerCommand(countCMDIdWorkspace, () => {
      vscode.window.showInformationMessage(
        `Stroked ${keystrokes.workspace.all} keys in whole, ${keystrokes.workspace.monthly} in this month, ${keystrokes.workspace.weekly} in this week, ${keystrokes.workspace.daily} today.`
      );
    })
  );

  barItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    101
  );
  barItem.command = countCMDId;

  barItemWorkspace = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    101
  );

  barItemWorkspace.command = countCMDIdWorkspace;
  let toggleWorkspace = vscode.commands.registerCommand(
    "extension.toggleWorkspace",
    () => {
      globalState.update(
        "workspace-toggled",
        !globalState.get("workspace-toggled")
      );
      workspaceToggled = globalState.get("workspace-toggled");
    }
  );

  subscriptions.push(toggleWorkspace);
  subscriptions.push(barItem);
  subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e =>
      updateKeyStrokes(e, globalState, workspaceState)
    )
  );

  console.log("[stroke-log] activated!");
  updateKeyStrokes();
}

function updateKeyStrokes(e, globalState, workspaceState) {
  if (e && e.contentChanges && e.contentChanges[0].text.length <= 1) {
    Object.keys(keystrokes.global).forEach(e => {
      globalState.update(`global-${e}-strokes`, keystrokes.global[e]);
      keystrokes.global[e] = keystrokes.global[e] + 1;
    });

    workspaceToggled &&
      Object.keys(keystrokes.workspace).forEach(e => {
        workspaceState.update(
          `workspace-${e}-strokes`,
          keystrokes.workspace[e]
        );
        keystrokes.workspace[e] = keystrokes.workspace[e] + 1;
      });

    if (
      globalState.get("weekly-strokes-reset") !== getWeekNumber(new Date())[1]
    ) {
      globalState.update("global-weekly-strokes", 0);
      keystrokes.global.weekly = 0;
      workspaceState.update("workspace-weekly-strokes", 0);
      keystrokes.workspace.weekly = 0;
      globalState.update("weekly-strokes-reset", getWeekNumber(new Date())[1]);
    }
    if (globalState.get("daily-strokes-reset") !== getDayOfYear()) {
      globalState.update("global-daily-strokes", 0);
      keystrokes.global.daily = 0;
      workspaceState.update("workspace-daily-strokes", 0);
      keystrokes.workspace.daily = 0;
      globalState.update("daily-strokes-reset", getDayOfYear());
    }
    if (globalState.get("monthly-strokes-reset") !== new Date().getMonth()) {
      globalState.update("global-monthly-strokes", 0);
      keystrokes.global.monthly = 0;
      workspaceState.update("workspace-monthly-strokes", 0);
      keystrokes.workspace.monthly = 0;
      globalState.update("monthly-strokes-reset", new Date().getMonth());
    }
  }

  if (workspaceToggled) {
    barItemWorkspace.text = `$(keyboard) ${keystrokes.workspace.daily} strokes in workspace`;
    barItemWorkspace.show();
  } else {
    barItemWorkspace.hide();
  }

  if (keystrokes.global.all > -1) {
    barItem.text = `$(keyboard) ${keystrokes.global.daily} strokes`;
    barItem.show();
  } else {
    barItem.hide();
  }
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate({ globalState }) {
  console.log("[stroke-log] deactivated!");
}

module.exports = {
  activate,
  deactivate
};

/* For a given date, get the ISO week number
 *
 * Based on information at:
 *
 *    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
 *
 * Algorithm is to find nearest thursday, it's year
 * is the year of the week number. Then get weeks
 * between that date and the first day of that year.
 *
 * Note that dates in one year can be weeks of previous
 * or next year, overlap is up to 3 days.
 *
 * e.g. 2014/12/29 is Monday in week  1 of 2015
 *      2012/1/1   is Sunday in week 52 of 2011
 */
function getWeekNumber(d) {
  // Copy date so don't modify original
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  // @ts-ignore
  var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  // Return array of year and week number
  return [d.getUTCFullYear(), weekNo];
}

function getDayOfYear() {
  var now = new Date();
  var start = new Date(now.getFullYear(), 0, 0);
  var diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);

  return day;
}
