import * as vscode from "vscode";

import { getDayOfYear, getWeekNumber } from "./libs/dates";

type TKeystrokes = {
  [key: string]: {
    daily: number;
    weekly: number;
    monthly: number;
    all: number;
  };
};

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

let workspaceToggled = false,
  barItems: { [key: string]: vscode.StatusBarItem } = {};

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

    const normalize = (time: string, input: any) => {
      if (context.globalState.get(`${time}-strokes-reset`) !== input) {
        context.globalState.get(`global-${time}-strokes`, 0);
        // @ts-ignore
        Keystrokes.global[time] = 0;
        context.workspaceState.update(`workspace-${time}-strokes`, 0);

        // @ts-ignore
        Keystrokes.workspace[time] = 0;
        context.globalState.update(`${time}-strokes-reset`, input);
      }
    };

    normalize("weekly", getWeekNumber(new Date())[1]);
    normalize("daily", getDayOfYear());
    normalize("monthly", new Date().getMonth());

    // Id of the command for displaying count info.
    const countCMDId: { [key: string]: string } = {
      global: "extension.count",
      workspace: "extension.countWorkspace"
    };

    context.subscriptions.push(
      vscode.commands.registerCommand(countCMDId.global, () => {
        vscode.window.showInformationMessage(
          `Stroked ${Keystrokes.global.all} keys in overall, ${Keystrokes.global.monthly} in this month, ${Keystrokes.global.weekly} in this week, ${Keystrokes.global.daily} today.`
        );
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(countCMDId.workspace, () => {
        vscode.window.showInformationMessage(
          `Stroked ${Keystrokes.workspace.all} keys overall, ${Keystrokes.workspace.monthly} in this month, ${Keystrokes.workspace.weekly} in this week, ${Keystrokes.workspace.daily} today.`
        );
      })
    );

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
        e.text = `$(keyboard) ${Keystrokes[space].daily} strokes`;
        e.show();
      }

      return e;
    };

    barItems = {
      global: createStatusBarItem("global"),
      workspace: createStatusBarItem("workspace")
    };

    let toggleWorkspace = vscode.commands.registerCommand(
      "extension.toggleWorkspace",
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

    context.subscriptions.push(
      toggleWorkspace,
      barItems.global,
      vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) =>
        updateKeyStrokes(e, context)
      ),
      vscode.workspace.onWillSaveTextDocument(handleSave),
      vscode.window.onDidChangeWindowState(handleSave)
    );
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

        if (workspaceToggled) {
          Keystrokes.workspace[key]++;
        }
      }
    });
  }

  if (workspaceToggled) {
    barItems.workspace.text = `$(keyboard) ${Keystrokes.workspace.daily} strokes in workspace`;
    barItems.workspace.show();
  } else {
    barItems.workspace.hide();
  }

  if (Keystrokes.global.all > -1) {
    barItems.global.text = `$(keyboard) ${Keystrokes.global.daily} strokes`;
    barItems.global.show();
  } else {
    barItems.global.hide();
  }
};

export function deactivate() {
}