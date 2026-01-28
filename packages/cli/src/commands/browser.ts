import { Command } from 'commander'
import chalk from 'chalk'
import { spawnAgentBrowser, installAgentBrowser } from '../utils/process.js'

export const browserCommand = new Command('browser')
  .description('Execute actionbook browser commands (browser automation)')
  .allowUnknownOption(true) // Critical: allow any args through
  .allowExcessArguments(true)
  .helpOption(false) // Disable built-in help, forward to agent-browser instead
  .action(async (_options, command) => {
    // Get all arguments passed after 'browser'
    const args = command.args

    // If no args, show agent-browser help
    if (args.length === 0) {
      const exitCode = await spawnAgentBrowser(['--help'])
      process.exit(exitCode)
      return
    }

    // Special handling for 'install' command
    if (args[0] === 'install') {
      const exitCode = await installAgentBrowser(args.slice(1))
      process.exit(exitCode)
      return
    }

    // Forward all args to agent-browser (including -h, --help)
    const exitCode = await spawnAgentBrowser(args)
    process.exit(exitCode)
  })
