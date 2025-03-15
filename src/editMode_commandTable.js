import { KeyMod } from "./key.js";
import { commands, editModeExecutionHandler_movement } from "./editMode.js";

export const editModeCommandOptions = {
    repeating: true,
}
export const editModeCommands = {
    "\n": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.doNothing,
    },
    '"': {
        type: "singleCharacterPreArgumentPrefix",
    },
    "g": {
        type: "disamb",
    },
    "j": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.moveDown,
    },
    "J": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.moveDownLast
    },
    "k": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.moveUp
    },
    "h": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.moveLeft
    },
    "l": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.moveRight
    },
    "0": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.moveToFirstSibling
    },
    "$": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.moveToLastSibling
    },
    "gg": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.moveToRoot
    },
    "L": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.moveToNextLeaf
    },
    "H": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.moveToPreviousLeaf
    },
    "f": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: commands.followRef
    },
    "ga": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.contentInfo
    },
    "x": {
        category: "action",
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.kill,
    },
    "d": {
        category: "operator",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.delete
    },
    "c": {
        category: "operator",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.change
    },
    "u": {
        category: "action",
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.undo
    },
    "@": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.attributeMode
    },
    "i": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.insertBefore
    },
    "a": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.insertAfter
    },
    "I": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.insertAtBeginning
    },
    "A": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.insertAtEnd
    },
    "v": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.visualMode
    },
    "y": {
        category: "operator",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.copyToRegister
    },
    "p": {
        category: "action",
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.putAfter
    },
    "P": {
        category: "action",
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.putBefore
    },
    /*"q": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.startstopUserRecording
    },*/
    "w": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.unwrap
    },
    " ": {
        category: "operator",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.mrowEnvelop
    },
    "\t": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.cycleInsertMode
    },
    "Z": {
        type: "disamb",
    },
    "ZZ": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.saveclose
    },
    "ZA": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.savecloseAll
    },
    ":": {
        type: "longPrefix",
    },
    ":set": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.set
    },
    ":pwd": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "none",
        implementation: commands.printWorkingDirectory
    },
    ":cwd": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.changeWorkingDirectory
    },
    ":cd": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.changeWorkingDirectory
    },
    ":hideview": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.hideView
    },
    ":showview": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.showView
    },
    ":viewset": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.chooseViewset
    },
    ":viewsetconf": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.viewsetconfWindow
    },

    ":serialize": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.serialize
    },
    ":export": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.export
    },
    ":new": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.newEquation
    },
    ":next": {
        category: "action",
        type: "long",
        argument: "none",
        repeating: "external",
        implementation: commands.nextEquation
    },
    ":previous": {
        category: "action",
        type: "long",
        argument: "none",
        repeating: "external",
        implementation: commands.previousEquation
    },
    ":goto": {
        category: "action",
        type: "long",
        argument: "newlineTerminated",
        repeating: "prevent",
        implementation: commands.gotoEquation
    },
    ":load": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.load
    },
    ":loadid": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.loadById
    },
    ":loadxpath": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.loadByXPath
    },
    ":save": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.save
    },
    ":write": { // synonym for :save
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.save
    },
    ":saveall": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "none",
        implementation: commands.saveAll
    },
    ":writeall": { // synonym for :saveall
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "none",
        implementation: commands.saveAll
    },
    ":close": {
        category: "action",
        type: "long",
        repeating: "external",
        argument: "none",
        implementation: commands.close
    },
    ":closeall": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "none",
        implementation: commands.closeAll
    },
    ":quit": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "none",
        implementation: commands.closeAll
    },
    ":q": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "none",
        implementation: commands.closeAll
    },
    ":document": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.printDocumentInformation
    },
    ":documents": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.printAllDocumentInformation
    },
    ":help": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.help
    },
    ":example": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: commands.example
    },
    [KeyMod.control]: {
            type: "disamb",
    },
    [KeyMod.control + "i"]: {
            category: "action",
            type: "command",
            repeating: "prevent",
            argument: "none",
            implementation: commands.insertIn
    },
    [KeyMod.control + "r"]: {
            category: "action",
            type: "command",
            repeating: "external",
            argument: "none",
            implementation: commands.redo
    },
    [KeyMod.control + "l"]: {
            category: "action",
            type: "command",
            repeating: "prevent",
            argument: "none",
            implementation: commands.redisplay
    },
    [KeyMod.control + "p"]: {
            category: "action",
            type: "command",
            repeating: "prevent",
            argument: "none",
            implementation: commands.putIn
    },
}

