#!/usr/bin/env node

import { Command } from 'commander';
import {
  createGroupsCommand,
  createChatsCommand,
  createReadCommand,
  createSendCommand,
  createDmReadCommand,
  createDmSendCommand,
  createConfigCommand,
  createMeCommand,
  createReplyCommand,
} from './commands';

const program = new Command();

program
  .name('groupme')
  .description('CLI for GroupMe messaging')
  .version('1.0.0');

// Add all commands
program.addCommand(createConfigCommand());
program.addCommand(createMeCommand());
program.addCommand(createGroupsCommand());
program.addCommand(createChatsCommand());
program.addCommand(createReadCommand());
program.addCommand(createSendCommand());
program.addCommand(createReplyCommand());
program.addCommand(createDmReadCommand());
program.addCommand(createDmSendCommand());

program.parse();
