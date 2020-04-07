import { IUser, IKeystrokes } from "../types";
import { Client } from "./client";
import { UserInfo, UserCreate } from "./commands";
import { Keystrokes } from "../keystrokes";
import config from "../config/config";

// API Client
const Cli = new Client(config.server_url);

interface IUserClass {
    readonly token: string;
    readonly info: IUser|null;
}

export class User implements IUserClass {
    token: string;
    info: IUser|null = null;
    storage: Keystrokes = new Keystrokes();

    constructor(token: string) {
        this.token = token || "";
    }

    get keystrokes() {
        return this.storage as Keystrokes;
    }

    get anonymous() {
        return Boolean(!this.token || this.info === null);
    }

    public setToken(token: string) {
        this.token = token;
    }

    public login() {
        if(this.token)
            Cli.execute(new UserInfo(this.token)).then(response => {
                const {status, data} = response;

                if(status === 200) {
                    this.info = data;
                } else {
                    this.info = null;
                    this.setToken("");
                }
            })
    }

    public register(label: string, keystrokes?: IKeystrokes) {
        Cli.execute(new UserCreate(label, keystrokes)).then(response => {
            const {status, data} = response;

            if(status === 200) {
                this.setToken(data.token);
                this.login();
            } else {
                console.error("Sign-up failed!");
            }
        });
    }

    public logout() {
        this.setToken("");
        this.info = null;
    }

    public save() {

    }

    public sync() {
        
    }
}