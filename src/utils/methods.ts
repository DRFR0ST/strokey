import * as vscode from "vscode";
import { IKeystrokes } from "../types";

export const getNiceWord = () => {
    const NICE_WORDS = ["Awesome", "Cool", "Amazing", "Nice", "Great", "Wonderful", "Incredible", "Astonishing", "Marvellous", "Phenomenal", "Exciting"];

    return NICE_WORDS[Math.floor(Math.random() * NICE_WORDS.length)];
}