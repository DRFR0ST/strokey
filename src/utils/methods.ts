import * as vscode from "vscode";
import { TKeystrokes } from "../types";

export const normalize = (context: vscode.ExtensionContext, Keystrokes: TKeystrokes, time: string, input: any) => {
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

export const getNiceWord = () => {
    const NICE_WORDS = ["Awesome", "Cool", "Amazing", "Nice", "Great", "Wonderful", "Incredible", "Astonishing", "Marvellous", "Phenomenal", "Exciting"];

    return NICE_WORDS[Math.floor(Math.random() * NICE_WORDS.length)];
}