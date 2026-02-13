#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const commands_1 = require("./commands");
const program = new commander_1.Command();
program
    .name('groupme')
    .description('CLI for GroupMe messaging')
    .version('1.0.0');
// Add all commands
program.addCommand((0, commands_1.createConfigCommand)());
program.addCommand((0, commands_1.createMeCommand)());
program.addCommand((0, commands_1.createGroupsCommand)());
program.addCommand((0, commands_1.createChatsCommand)());
program.addCommand((0, commands_1.createReadCommand)());
program.addCommand((0, commands_1.createSendCommand)());
program.addCommand((0, commands_1.createReplyCommand)());
program.addCommand((0, commands_1.createDmReadCommand)());
program.addCommand((0, commands_1.createDmSendCommand)());
program.parse();
//# sourceMappingURL=index.js.map