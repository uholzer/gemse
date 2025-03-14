import { commands, visualSelectionModeExecutionHandler_movement } from "./visualSelectionMode.js";
import { editModeCommands } from "./editMode_commandTable.js";

export const visualSelectionModeCommandOptions = {
    repeating: true,
}

// We construct the command table for the visual mode using the table
// of the edit mode. Afterwards we add some additional commands.

export const visualSelectionModeCommands = {};

// Get all movement commands from the edit mode but use our own
// execution handler

for (var s in editModeCommands) {
    if (editModeCommands[s].category=="movement") {
        // We must not use the object editModeCommands[s] directly,
        // since we are going to change some values. Here we simply
        // use editModeCommands[s] as prototype. This allows us to
        // change values without changing editModeCommands[s].
        // XXX: This will perhaps yield problem when CommandHandler implements
        // default values through prototypes.
        visualSelectionModeCommands[s] = {};
        visualSelectionModeCommands[s].__proto__ = editModeCommands[s];
        visualSelectionModeCommands[s].executionHandler = visualSelectionModeExecutionHandler_movement;
        // If the command consists of more than one character, we must
        // add disambiguation nodes to the command table.
        for (var i = 1; i < s.uLength; ++i) {
            visualSelectionModeCommands[s.slice(0,i)] = { type: "disamb" }
        }
    }
}

// Additonal commands for the visual mode

visualSelectionModeCommands["o"] = {
    category: "action",
    type: "command",
    repeating: "prevent",
    argument: "none",
    implementation: commands.switchMoving
}
visualSelectionModeCommands[String.fromCharCode(0x1b)] = { // Escape
    category: "action",
    type: "command",
    repeating: "prevent",
    argument: "none",
    implementation: commands.cancel
}

