import { TStrokes, TTarget } from "./types";

type TStrokeCollection  = { [key in TStrokes]: number };

interface IKeystrokesClass {
    global: TStrokeCollection;
    workspace: TStrokeCollection;

    get(target: TTarget, key?: TStrokes): TStrokeCollection | number;
    set(target: TTarget, key: TStrokes, value: number): void;
    reset(target: TTarget, key?: TStrokes): void;
    increment(target: TTarget, key: TStrokes): void;
}

const DEFAULT_STROKES = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
    all: 0
};

export class Keystrokes implements IKeystrokesClass {
    global: TStrokeCollection = DEFAULT_STROKES;
    workspace: TStrokeCollection = DEFAULT_STROKES;

    get(target: TTarget, key?: TStrokes) {
        if(key) return this[target][key];
        return this[target];
    }

    set(target: TTarget, key: TStrokes, value: number) {
        this[target][key] = value;
    }

    reset(target: TTarget, key?: TStrokes) {
        if(key)
            this[target][key] = 0;
        else
            this[target] = DEFAULT_STROKES;
    }

    increment(target: TTarget, key: TStrokes) {
        this[target][key]++;
    }
}