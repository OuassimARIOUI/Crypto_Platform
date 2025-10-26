import chalk from "chalk";

export const logInfo = (msg) => console.log(chalk.blueBright(msg));
export const logError = (msg) => console.log(chalk.redBright(msg));
