import chalk from "chalk";

export const logInfo = (...args) => console.log(chalk.blueBright(args[0] ?? ""), ...args.slice(1));
export const logError = (...args) => console.error(chalk.redBright(args[0] ?? ""), ...args.slice(1));
