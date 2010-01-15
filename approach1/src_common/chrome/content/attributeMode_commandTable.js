/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

attributeModeCommandOptions = {
    repeating: true,
}
attributeModeCommands = {
    "j": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: attributeModeCommand_down
    },
    "k": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: attributeModeCommand_up
    },
    "x": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: attributeModeCommand_kill
    },
    "c": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: attributeModeCommand_changeValue
    },
    "C": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: attributeModeCommand_changeName
    },
    "n": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: attributeModeCommand_changeNS
    },
    "i": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        argumentLineCount: 2,
        implementation: attributeModeCommand_insertDefault
    },
    "I": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        argumentLineCount: 3,
        implementation: attributeModeCommand_insertForeign
    },
    "!": {
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: attributeModeCommand_setDefaultForMissing
    },
    "-": {
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: attributeModeCommand_clearAll
    },
    "=": {
        type: "command",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: attributeModeCommand_setFromDictionary
    },
}
attributeModeCommands[String.fromCharCode(0x1b)] = { // Escape
    type: "command",
    repeating: "prevent",
    argument: "none",
    implementation: attributeModeCommand_exit
}

