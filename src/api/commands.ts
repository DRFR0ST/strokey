import { Command } from "./client";
import { IUser, IKeystrokes } from "../types";

export class UserInfo extends Command {
    constructor(token: string) {
        super(["userInfo", {token}]);
    }

    parse(status: number, data: IUser) {
        if(status !== 200) return data;

        // TODO: Ensure types.
        
        return data;
    }
}

export class UserCreate extends Command {
    constructor(label: string, keystrokes?: IKeystrokes) {
        super(["userCreate", {label, keystrokes: JSON.stringify(keystrokes)}])
    }

    parse(status: number, data: {token: string}) {
        if(status !== 200) return data;

        // TODO: Ensure types.

        return data;
    }
}

export class ChangeKeystrokes extends Command {
    constructor(token: string, value: number|IKeystrokes, key?: string) {
        super(["changeKeystrokes", {token, key, value}]);
    }

    parse(status: number, data: any) {
        if(status !== 204) return data;

        return data;
    }
}