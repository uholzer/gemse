
trivialInsertModeCommands = {
    "i": {
        execute: trivialInsertModeCommand_miSingle
    },
    "I": {
        execute: trivialInsertModeCommand_miLong
    },
    "n": {
        execute: trivialInsertModeCommand_mnNormal
    },
    "N": {
        execute: trivialInsertModeCommand_mnLong
    },
    "o": {
        execute: trivialInsertModeCommand_moNormal
    },
    "O": {
        execute: trivialInsertModeCommand_moLong
    },
    "t": {
        execute: trivialInsertModeCommand_mtext
    },
    " ": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mrow") }
    },
    "/": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mfrac") }
    },
    "e": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"menclose") }
    },
    "r": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msqrt") }
    },
    "R": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mroot") }
    },
    "f": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mfenced") }
    },
    "^": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msup") }
    },
    "_": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msub") }
    },
    "=": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msubsup") }
    },
    "u": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"munder") }
    },
    "v": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mover") }
    },
    "U": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"munderover") }
    },
    "m": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mmultiscripts") }
    },
    ".": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"none") }
    },
    "p": {
        execute: function (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mprescripts") }
    },
    "t": {
        execute: trivialInsertModeCommand_table // For inserting table, tr or td elements
    },
    "\n": {
        execute: trivialInsertModeCommand_cursorJump
    },
}
trivialInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: trivialInsertModeCommand_exit
}

