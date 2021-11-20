import { commands } from "./attributeMode.js";

export const attributeModeCommandOptions = {
    repeating: true,
}
export const attributeModeCommands = {
    "j": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.down
    },
    "k": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.up
    },
    "x": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.kill
    },
    "c": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.changeValue
    },
    "C": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.changeName
    },
    "n": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.changeNS
    },
    "i": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        argumentLineCount: 2,
        implementation: commands.insertDefault
    },
    "I": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        argumentLineCount: 3,
        implementation: commands.insertForeign
    },
    "!": {
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.setDefaultForMissing
    },
    "-": {
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.clearAll
    },
    "=": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.setFromDictionary
    },
    [String.fromCharCode(0x1b)]: { // Escape
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.exit
    },
}
