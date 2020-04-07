import * as request from "request";

export type TResponse = {status: number, message?: string, data: any};

interface IClientClass {
    url: string
}

export class Client implements IClientClass {
    url: string

    constructor(url: string) {
        this.url = url;
    }

    makeArguments(args: {[key: string]: string}) {
        return Object.entries(args).map((e => e.join("="))).join("&");
    }

    execute(command: ICommandClass) {
        return new Promise<{status: number, data: any}>((resolve, reject) => {
            const cmd = command.exec[0];
            const args = this.makeArguments(command.exec[1]);
    
            const reqUrl = `${this.url}${cmd}?${args}`;
    
            request(reqUrl, 
                function (error:Error, response:any, body: any) {
                    if(error) return reject(error);
                    resolve(command.parse(response.statusCode, body));
                });
        })
    }
}

interface ICommandClass {
    exec: [string, {[key: string]: any}];
    status: number;

    parse(status: number, data: any): any
}

export class Command implements ICommandClass {
    exec: [string, {[key: string]: any}];
    status: number;

    constructor(exec: [string, {[key: string]: any}]) {
        this.exec = exec;
        this.status = 0;
    }

    parse(status: number, data: any) {
        return data;
    }
}