import * as vscode from "vscode";
import { IUser, IKeystrokes } from "../types";
import { Client } from "./client";
import { UserInfo, UserCreate, ChangeKeystrokes } from "./commands";
import { Keystrokes } from "../keystrokes";
import config from "../config/config";

// API Client
const Cli = new Client(config.server_url);

interface IUserClass {
    readonly token: string;
    readonly info: IUser|null;
}

export class User implements IUserClass {
    context: vscode.ExtensionContext;
    token: string = "";
    info: IUser|null = null;
    storage: Keystrokes;

    constructor(context: vscode.ExtensionContext, token: string) {
        console.log("token", token);
        this.context = context;
        this.storage = new Keystrokes(context);
        this.setToken(token);

        this.login();
    }

    get goal() {
        return this.info?.goal || Number(this.context.globalState.get("global-goal")) || 8000;
    }

    get keystrokes() {
        return this.storage as Keystrokes;
    }

    get anonymous() {
        return Boolean(!this.token || this.info === null);
    }

    public setGoal(goal: number) {
        this.context.globalState.update("global-goal", goal || 8000);
    }

    public setToken(token: string) {
        this.token = token || "";
        this.context.globalState.update("token", this.token);
    }

    public login() {
        if(this.token)
            Cli.execute(new UserInfo(this.token)).then(response => {
                const {status, data} = response;
                if(status === 200) {
                    if(!data.data) {
                        this.setToken("");
                        return;
                    };
                    this.info = data.data;
                    console.log("Logged in as", this.info?.label);
                    vscode.window.showInformationMessage(`👋 Hi, ${this.info?.label}. Have a nice day!`);
                    this.sync();
                } else {
                    this.info = null;
                    this.setToken("");
                    vscode.window.showInformationMessage(`❌ There was a problem while logging in. Please try again later.`);
                }
            })
    }

    public register(label: string, keystrokes?: IKeystrokes) {
        Cli.execute(new UserCreate(label, keystrokes)).then(response => {
            const {status, data} = response;

            if(status === 200) {
                this.setToken(data.data.token);
                this.login();
            } else {
                vscode.window.showInformationMessage(`❌ There was a problem while creating account. Please try again later.`);
            }
        });
    }

    public logout() {
        this.setToken("");
        this.info = null;
    }

    public save() {
        //this.storage.normalizeAll();
        this.storage.save();
        Cli.execute(new ChangeKeystrokes(this.token, {global: this.storage.global}));
    }

    public sync() {
        ["daily", "weekly", "monthly", "all"].forEach((key: string) => {
            if (
              key === "daily" ||
              key === "weekly" ||
              key === "monthly" ||
              key === "all"
            ) {
                const local = this.storage.global[key] || 0;
                const remote = this.info?.keystrokes?.global?.[key] || 0;

                if(local < remote)
                    this.storage.set("global", key, remote);
            }
        });
        this.save();
    }
}