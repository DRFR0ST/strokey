import * as vscode from "vscode";

import { getNiceWord } from "./utils/methods";
import { User as Usr } from './api/user';
import { TTarget, TStrokes } from "./types";
import { Keystrokes as Kstrks } from "./keystrokes";

let User: Usr;
let Keystrokes: Kstrks;

let workspaceToggled = false,
  barItems: { [key: string]: vscode.StatusBarItem } = {};

// Id of the command for displaying count info.
const countCMDId: { [key: string]: string } = {
  global: "strokey.count",
  workspace: "strokey.countWorkspace"
};

export function activate(context: vscode.ExtensionContext) {
  User = new Usr(context, context.globalState.get("token") || "");
  Keystrokes = User.keystrokes;

    workspaceToggled = Boolean(context.globalState.get("workspace-toggled"));

    // Create status bar item and push to subscriptions.
    const createStatusBarItem = (space: TTarget) => {
      const e = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        101
      );

      e.command = countCMDId[space];

      if (
        (space === "workspace" && workspaceToggled) ||
        space !== "workspace"
      ) {
        const prefix = User.info?.label ? `${User.info?.label}, ` : "";
        e.text = `${prefix}$(keyboard) ${Keystrokes.get(space, "daily")} keystrokes`;
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
           vscode.window.showInputBox({placeHolder: "10000", value: User.goal.toString(), prompt: "Set your daily goal."}).then(newGoal => {
            if(!isNaN(Number(newGoal))) {
              User.setGoal(Number(newGoal));
              vscode.window.showInformationMessage(`✔️ Goal has been set to ${User.goal}`);
            } else {
              vscode.window.showInformationMessage(`❌ Goal has to be a number!`);
            }
          });
      })

    let showProgressCommand =
      vscode.commands.registerCommand("strokey.showProgress", () => {
        try {
          if(User.goal !== -1) {
            vscode.window.showInformationMessage(`🔄 Todays progress: ${Keystrokes.global.daily} / ${User.goal}`);
          }
        } catch(err) {
          //console.error(err);
        }
      })

    let signInCommand =
      vscode.commands.registerCommand('strokey.signin', () => {
        vscode.window.showInputBox({value: "", prompt: "Enter your authorization token."}).then(tkn => {
          if(tkn) {
            User.setToken(tkn);
            User.login();
          } else {
            vscode.window.showInformationMessage(`❌ Goal has to be a number!`);
          }
        });
      })
    let signOutCommand =
      vscode.commands.registerCommand('strokey.signout', () => {
        Keystrokes.reset("global");
        Keystrokes.reset("workspace");
        User.setToken("");
       vscode.window.showInformationMessage(`✔️ You are logged out now! Bye!`);
      })
    let signUpCommand =
      vscode.commands.registerCommand('strokey.signup', () => {
        if(!User.anonymous) return vscode.window.showInformationMessage(`❌ You are already logged in!`);
        vscode.window.showInputBox({value: "", prompt: "Enter your personal user token."}).then(label => {
          if(label) {
            User.register(label, {global: Keystrokes.global});
          } else {
            vscode.window.showInformationMessage(`❌ Label cannot be empty!`);
          }
        });
      })
    let showToken =
      vscode.commands.registerCommand('strokey.token', () => {
        if(!User.anonymous)
          vscode.window.showInformationMessage(`🔑 Your personal token: ${User.token}`, "Copy").then(() => {
            vscode.env.clipboard.writeText(User.token);
          });
        else
        vscode.window.showInformationMessage(`🔑 You need to login to get access to your token.`);
      })

    context.subscriptions.push(
      globalCountCommand,
      workspaceCountCommand,
      showProgressCommand,
      !User.anonymous ? signInCommand : signOutCommand,
      signUpCommand,
      showToken,
      setGoalCommand,
      toggleWorkspaceCommand,
      barItems.global,
      vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) =>
        updateKeyStrokes(e, context)
      ),
      vscode.workspace.onWillSaveTextDocument(Keystrokes.save),
      vscode.window.onDidChangeWindowState(Keystrokes.save),
    );

    setInterval(() => {
      User.save();
    }, 1000*60*60) // one minute.. i guess.. 
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
   (["daily", "weekly", "monthly", "all"] as TStrokes[]).forEach((key) => {
        Keystrokes.increment("global", key);

        if(key === "daily" && User.goal === Keystrokes.global.daily) {
          vscode.window.showInformationMessage(`🎉 ${getNiceWord()}! You have reached your daily goal!`);
        }
        
        if (workspaceToggled) {
          Keystrokes.increment("workspace", key);
        }
    });
  }

  if (workspaceToggled) {
    barItems.workspace.text = `$(keyboard) ${Keystrokes.workspace.daily} workspace keystrokes`;
    barItems.workspace.show();
  } else {
    barItems.workspace.hide();
  }

  if (Keystrokes.global.all > -1) {
    const prefix = User.info?.label ? `${User.info?.label}, ` : "";
    barItems.global.text = `${prefix}$(keyboard) ${Keystrokes.global.daily} keystrokes`;
    barItems.global.show();
  } else {
    barItems.global.hide();
  }
};

export function deactivate() {
  User.save();
}