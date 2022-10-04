"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeScript = void 0;
const executeScript = (name) => {
    // @ts-ignore
    console.log("This will execute script on the network");
    return 42;
};
exports.executeScript = executeScript;
