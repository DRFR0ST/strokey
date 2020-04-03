import * as vscode from "vscode";

import { getDayOfYear, getWeekNumber } from "./libs/dates";
import { normalize, getNiceWord } from "./utils/methods";
import { TKeystrokes } from "./types";

let Keystrokes: TKeystrokes = {
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

let personalGoal = -1;

let workspaceToggled = false,
  barItems: { [key: string]: vscode.StatusBarItem } = {};

// Id of the command for displaying count info.
const countCMDId: { [key: string]: string } = {
  global: "strokey.count",
  workspace: "strokey.countWorkspace"
};

export function activate(context: vscode.ExtensionContext) {
  const handleSave = () => {
    ["daily", "weekly", "monthly", "all"].forEach((key: string) => {
      if (
        key === "daily" ||
        key === "weekly" ||
        key === "monthly" ||
        key === "all"
      ) {
        context.globalState.update(
          `global-${key}-strokes`,
          Keystrokes.global[key]
        );

        context.workspaceState.update(
          `workspace-${key}-strokes`,
          Keystrokes.workspace[key]
        );
      }
    });
  };

  (function() {
    workspaceToggled = Boolean(context.globalState.get("workspace-toggled"));
    personalGoal = Number(context.globalState.get("global-goal")) || 8000;

    // Load data from global and workspace states.
    ["workspace", "global"].forEach(space => {
      Object.keys(Keystrokes[space]).forEach((key: string) => {
        if (
          key === "daily" ||
          key === "weekly" ||
          key === "monthly" ||
          key === "all"
        ) {
          // @ts-ignore
          const state = context[`${space}State`];
          Keystrokes[space][key] =
            Number(state.get(`${space}-${key}-strokes`)) || 0;
        }
      });
    });

    // Create status bar item and push to subscriptions.
    const createStatusBarItem = (space: string) => {
      const e = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        101
      );

      e.command = countCMDId[space];

      if (
        (space === "workspace" && workspaceToggled) ||
        space !== "workspace"
      ) {
        e.text = `$(keyboard) ${Keystrokes[space].daily} keystrokes`;
        e.show();
      }

      return e;
    };

    barItems = {
      global: createStatusBarItem("global"),
      workspace: createStatusBarItem("workspace")
    };

    // Commands =>

    const globalCountCommand =
      vscode.commands.registerCommand(countCMDId.global, () => {
        vscode.window.showInformationMessage(
          `📈 Stroked ${Keystrokes.global.all} keys overall, ${Keystrokes.global.monthly} this month, ${Keystrokes.global.weekly} this week, ${Keystrokes.global.daily} today.`
        );
      }) 

    const workspaceCountCommand = 
      vscode.commands.registerCommand(countCMDId.workspace, () => {
        vscode.window.showInformationMessage(
          `📈 Stroked ${Keystrokes.workspace.all} keys overall, ${Keystrokes.workspace.monthly} this month, ${Keystrokes.workspace.weekly} this week, ${Keystrokes.workspace.daily} today.`
        );
      })
    

    let toggleWorkspaceCommand = 
      vscode.commands.registerCommand(
        "strokey.toggleWorkspace",
        () => {
          context.globalState.update(
            "workspace-toggled",
            !context.globalState.get("workspace-toggled")
          );
          workspaceToggled = Boolean(
            context.globalState.get("workspace-toggled")
          );
        }
      );

    let setGoalCommand =
      vscode.commands.registerCommand("strokey.setGoal", () => {
           vscode.window.showInputBox({placeHolder: "10000", value: personalGoal.toString(), prompt: "Set your daily goal."}).then(newGoal => {
            if(!isNaN(Number(newGoal))) {
              context.globalState.update("global-goal", newGoal);
              personalGoal = Number(newGoal);
              vscode.window.showInformationMessage(`✔️ Goal has been set to ${personalGoal}`);
            } else {
              vscode.window.showInformationMessage(`❌ Goal has to be a number!`);
            }
          });
      })

    let showProgressCommand =
      vscode.commands.registerCommand("strokey.showProgress", () => {
        try {
          if(personalGoal !== -1) {
            vscode.window.showInformationMessage(`🔄 Todays progress: ${Keystrokes.global.daily} / ${personalGoal}`);
          }
        } catch(err) {
          console.error(err);
        }
      })

    context.subscriptions.push(
      globalCountCommand,
      workspaceCountCommand,
      showProgressCommand,
      setGoalCommand,
      toggleWorkspaceCommand,
      barItems.global,
      vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) =>
        updateKeyStrokes(e, context)
      ),
      vscode.workspace.onWillSaveTextDocument(handleSave),
      vscode.window.onDidChangeWindowState(handleSave),
    );
    normalize(context, Keystrokes, "weekly", getWeekNumber(new Date())[1]);
    normalize(context, Keystrokes, "daily", getDayOfYear());
    normalize(context, Keystrokes, "monthly", new Date().getMonth());
  })();
}

const updateKeyStrokes = (
  event: vscode.TextDocumentChangeEvent,
  context: vscode.ExtensionContext
) => {
  if (
    event &&
    event.contentChanges &&
    event.contentChanges[0].text.length <= 1
  ) {
    ["daily", "weekly", "monthly", "all"].forEach((key: string) => {
      if (
        key === "daily" ||
        key === "weekly" ||
        key === "monthly" ||
        key === "all"
      ) {
        Keystrokes.global[key]++;

        if(key === "daily" && personalGoal === Keystrokes.global.daily) {
          vscode.window.showInformationMessage(`🎉 ${getNiceWord()}! You have reached your daily goal!`);
        }

        if (workspaceToggled) {
          Keystrokes.workspace[key]++;
        }
      }
    });
  }

  normalize(context, Keystrokes, "weekly", getWeekNumber(new Date())[1]);
  normalize(context, Keystrokes, "daily", getDayOfYear());
  normalize(context, Keystrokes, "monthly", new Date().getMonth());

  if (workspaceToggled) {
    barItems.workspace.text = `$(keyboard) ${Keystrokes.workspace.daily} workspace keystrokes`;
    barItems.workspace.show();
  } else {
    barItems.workspace.hide();
  }

  if (Keystrokes.global.all > -1) {
    barItems.global.text = `$(keyboard) ${Keystrokes.global.daily} keystrokes`;
    barItems.global.show();
  } else {
    barItems.global.hide();
  }
};

export function deactivate() {
}