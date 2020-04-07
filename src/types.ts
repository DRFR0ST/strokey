export interface IUser {
  label: string;
  keystrokes: IKeystrokes
}

export type IStrokeCollection = {[key in TStrokes]: number};

export interface IKeystrokes {
    global: IStrokeCollection;
    workspace?: IStrokeCollection;
}

export type TStrokes = "all" | "daily" | "weekly" | "monthly"; 
export type TTarget = "global" | "workspace";