// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let globalKeyStrokes = 0;
let weeklyKeyStrokes = 0;
let dailyKeyStrokes = 0;
let workspaceKeyStrokes = 0;
let dailyWorkspaceKeyStrokes = 0;
let workspaceToggled = false;
let barItem;
let barItemWorkspace;
/**
 * @param {vscode.ExtensionContext} context
 */
function activate({ subscriptions, globalState, workspaceState }) {
  const state = globalState.get("key-strokes");
  workspaceToggled = globalState.get("workspace-toggled");
  if (!workspaceToggled && workspaceToggled !== false)
    globalState.update("workspace-toggled", true);
  if (!state) globalState.update("key-strokes", 0);
  if (!globalState.get("weekly-strokes"))
    globalState.update("weekly-strokes", 0);
  if (!globalState.get("weekly-strokes-week"))
    globalState.update("weekly-strokes-week", getDayOfYear());
  if (!globalState.get("daily-strokes")) globalState.update("daily-strokes", 0);
  if (!globalState.get("daily-strokes-day"))
    globalState.update("daily-strokes-day", getDayOfYear());

  globalKeyStrokes = globalState.get("key-strokes");
  weeklyKeyStrokes = globalState.get("weekly-strokes");
  dailyKeyStrokes = globalState.get("daily-strokes");
  if (globalState.get("weekly-strokes-week") !== getWeekNumber(new Date())) {
    globalState.update("weekly-strokes", 0);
    globalState.update("weekly-strokes-week", getWeekNumber(new Date()));
  }

  if (globalState.get("daily-strokes-day") !== getDayOfYear()) {
    globalState.update("daily-strokes", 0);
    globalState.update("daily-strokes-day", getDayOfYear());
  }

  if (workspaceState.get("daily-strokes-day") !== getDayOfYear()) {
    workspaceState.update("daily-strokes", 0);
    workspaceState.update("daily-strokes-day", getDayOfYear());
  }

  if (workspaceToggled) workspaceKeyStrokes = workspaceState.get("key-strokes");
  if (workspaceToggled)
    dailyWorkspaceKeyStrokes = workspaceState.get("daily-strokes");

  const countCMDId = "extension.count";
  const countCMDIdWorkspace = "extension.countWorkspace";

  subscriptions.push(
    vscode.commands.registerCommand(countCMDId, () => {
      vscode.window.showInformationMessage(
        `Stroked ${globalKeyStrokes} keys in whole, ${weeklyKeyStrokes} in this week, ${dailyKeyStrokes} today.`
      );
    })
  );

  subscriptions.push(
    vscode.commands.registerCommand(countCMDIdWorkspace, () => {
      vscode.window.showInformationMessage(
        `Stroked ${workspaceKeyStrokes} keys in whole and ${dailyWorkspaceKeyStrokes} today.`
      );
    })
  );

  barItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
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
      workspaceKeyStrokes = workspaceState.get("key-strokes");
      dailyWorkspaceKeyStrokes = workspaceState.get("daily-strokes");
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

  console.log("[stroke-log] v1.0.0 activated!");
  updateKeyStrokes();
}

function updateKeyStrokes(e, globalState, workspaceState) {
  if (e && e.contentChanges && e.contentChanges[0].text.length <= 1) {
    globalState.update("key-strokes", globalKeyStrokes);
    globalState.update("weekly-strokes", weeklyKeyStrokes);
    globalState.update("daily-strokes", dailyKeyStrokes);
    workspaceState.update("key-strokes", workspaceKeyStrokes);
    globalKeyStrokes = globalKeyStrokes + 1;
    weeklyKeyStrokes = weeklyKeyStrokes + 1;
    dailyKeyStrokes = dailyKeyStrokes + 1;
    workspaceKeyStrokes = workspaceKeyStrokes + 1;
    dailyWorkspaceKeyStrokes = dailyWorkspaceKeyStrokes + 1;

    if (globalState.get("weekly-strokes-week") !== getWeekNumber(new Date())) {
      globalState.update("weekly-strokes", 0);
      globalState.update("weekly-strokes-week", getWeekNumber(new Date()));
    }
    if (globalState.get("daily-strokes-day") !== getDayOfYear()) {
      globalState.update("daily-strokes", 0);
      globalState.update("daily-strokes-day", getDayOfYear());
    }
    if (workspaceState.get("daily-strokes-day") !== getDayOfYear()) {
      workspaceState.update("daily-strokes", 0);
      workspaceState.update("daily-strokes-day", getDayOfYear());
    }
  }

  if (workspaceToggled) {
    barItemWorkspace.text = `⌨️  ${dailyWorkspaceKeyStrokes} strokes in workspace today`;
    barItemWorkspace.show();
  } else {
    barItemWorkspace.hide();
  }

  if (globalKeyStrokes > -1) {
    barItem.text = `⌨️  ${dailyKeyStrokes} strokes today`;
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
