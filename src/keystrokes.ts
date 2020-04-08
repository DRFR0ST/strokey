import * as vscode from "vscode";
import { TStrokes, TTarget, IStrokeCollection } from "./types";
import { getWeekNumber, getDayOfYear } from "./libs/dates";

type TStrokeCollection = { [key in TStrokes]: number };

interface IKeystrokesClass {
    global: TStrokeCollection;
    workspace: TStrokeCollection;

    get(target: TTarget, key?: TStrokes): TStrokeCollection | number;
    set(target: TTarget, key: TStrokes, value: number): void;
    reset(target: TTarget, key?: TStrokes): void;
    increment(target: TTarget, key: TStrokes): void;
    save(): void;
}

const DEFAULT_STROKES = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    all: 0
};

export class Keystrokes implements IKeystrokesClass {
    context: vscode.ExtensionContext;
    global: TStrokeCollection = DEFAULT_STROKES;
    workspace: TStrokeCollection = DEFAULT_STROKES;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.init();
    }

    private init() {
        (["workspace", "global"] as TTarget[]).forEach((space) => {
            Object.keys(this.get(space)).forEach((key: string) => {
                if (
                    key === "daily" ||
                    key === "weekly" ||
                    key === "monthly" ||
                    key === "all"
                ) {
                    // @ts-ignore
                    const state = this.context[`${space}State`];
                    this.set(space, key, Number(state.get(`${space}-${key}-strokes`)) || 0);
                }
            });
        })

        this.normalizeAll();
    }

    get(target: TTarget, key?: TStrokes) {
        if (key) return this[target][key];
        return this[target];
    }

    set(target: TTarget, key: TStrokes, value: number) {
        this[target][key] = value;
    }

    override(target: TTarget, values: IStrokeCollection) {
        this[target] = values;
    }

    reset(target: TTarget, key?: TStrokes) {
        if (key)
            this[target][key] = 0;
        else
            this[target] = DEFAULT_STROKES;
    }

    increment(target: TTarget, key: TStrokes) {
        this[target][key]++;
        this.normalizeAll();
    }

    save() {
        (["daily", "weekly", "monthly", "all"] as TStrokes[]).forEach((key) => {
            this.context.globalState.update(`global-${key}-strokes`, this.get("global", key));
            this.context.workspaceState.update(`workspace-${key}-strokes`, this.get("workspace", key));
        });
    }

    normalizeAll() {
        this.normalize("weekly");
        this.normalize("daily");
        this.normalize("monthly");
    }

    normalize(key: TStrokes, input?: any) {
        if (!input)
            switch (key) {
                case "daily":
                    input = getDayOfYear();
                    break;
                case "weekly":
                    input = getWeekNumber(new Date())[1];
                    break;
                case "monthly":
                    input = new Date().getMonth();
                    break;
            }

        if (this.context.globalState.get(`${key}-strokes-reset`) !== input) {
            //context.globalState.get(`global-${key}-strokes`, 0);

            this.reset("global", key);
            this.reset("workspace", key);

            this.context.globalState.update(`${key}-strokes-reset`, input);
        }
    };
}