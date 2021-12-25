const arg = require("arg");
const { cyanBright, whiteBright, redBright } = require("chalk");
const errorTag = redBright("[ ERROR ]");

const parseArguementsIntoOptions = (rawArgs = []) => {
  try {
    const args = arg(
      {
        "--remove": Boolean,
        "-r": "--remove",
        "--help": Boolean,
        "-h": "--help",
        "--debug": Boolean,
        "-d": "--debug",
        "--email": String,
        "-e": "--email",
        "--pass": String,
        "-p": "--pass",
        "--name": String,
        "-n": "--name",
      },
      { argv: rawArgs.splice(2) }
    );

    return {
      remove: args["--remove"] || false,
      help: args["--help"] || false,
      debug: args["--debug"] || process.env.DEBUG === "true",
      email: args["--email"],
      password: args["--pass"],
      name: args["--name"],
    };
  } catch (error) {
    if (error.code === "ARG_MISSING_REQUIRED_LONGARG") {
      console.log(errorTag, "Arguement missing, please refer the help below.");
    } else if (error.code === "ARG_UNKNOWN_OPTION") {
      console.log(errorTag, "Unknown command, please try one of the following.");
    } else {
      console.log(error);
    }

    return {
      help: true,
    };
  }
};

const printLine = (text = "", char = "-") => {
  if (typeof text === "string" && text.length > 0) {
    const halfLen = process.stdout.columns / 2 - (text.length / 2 + 1);

    console.log(cyanBright(char.repeat(halfLen), text, char.repeat(halfLen)));
  } else {
    console.log(char.repeat(process.stdout.columns));
  }
};

const printHelp = (param = "", alias = "", description = "") => {
  console.group();
  console.log("Parameter:\t\t", "--" + param);
  console.log("Alias:\t\t", "-" + alias);
  console.log("Description:\t", description);
  console.groupEnd();
  console.log();
};

const AUTHOR = "localhoax";
const URL = "https://localhoax.in";

const printHelpGuide = () => {
  console.log(cyanBright("USER GENERATION by"), whiteBright(AUTHOR));
  console.log(cyanBright("AUTHOR:", whiteBright(AUTHOR + " ( " + URL + " )")));

  printLine("HELP");
  console.log();

  console.group();
  printHelp("help", "h", "Prints help information about generation script");
  printHelp("debug", "d", "Enable debug logging");
  printHelp("email", "e", `Use this parameter to provide a researcher email using ${cyanBright('--email "example@email.com"')}`);
  printHelp("name", "n", `Use this parameter with --email to provide a researcher name using ${cyanBright('--name "Example Name"')}`);
  printHelp("password", "p", `Use this parameter with --email to provide a password using ${cyanBright('--password "someSafePassword"')}`);
  printHelp("remove", "r", `Use this parameter with --email to remove the provided email`);
  console.groupEnd();

  printLine("END ");

  process.exit(0);
};

module.exports = {
  printLine,
  printHelpGuide,
  parseArguementsIntoOptions,
};
