const arg = require("arg");
const chalk = require("chalk");
const yup = require("yup");

const { db } = require("../database");
const ResearchUser = require("../database/models/researcher");
const { parseArguementsIntoOptions, printHelpGuide } = require("../utils/generate");

const formatError = chalk.red;
const formatHighlight = chalk.cyanBright;
const formatSuccess = chalk.greenBright;
const tag = chalk.magentaBright("[GENERATE]");
const errorTag = chalk.bgRed("[ERROR]");

const ResearcherValidationSchema = yup.object().shape({
  name: yup.string().required("Please provide a name using `--name name`").min(3, "Please provide a name between 3 to 24 characters").max(24, "Please provide a name between 3 to 24 characters"),
  email: yup
    .string()
    .email("Please provide a valid email using " + formatHighlight(`--email example@email.com`))
    .required("Please provide a email using `--email example@email.com`"),
  password: yup.string().required("Please provide a password using `--pass password`").min(6, "Please provide a password between 6 to 24 characters").max(24, "Please provide a password between 6 to 24 characters"),
});

async function generateResearchUser() {
  try {
    const { help, password, email, name, debug, remove } = parseArguementsIntoOptions(process.argv);

    const debugLog = (e) => {
      if (debug) console.log(e);
    };

    if (help) printHelpGuide();

    try {
      if (remove) {
        if (email) {
          const researcher = await ResearchUser.findOne({ email: email });

          if (researcher) {
            const deletedResearcher = await researcher.delete();

            if (deletedResearcher) {
              console.log(tag, formatHighlight(deletedResearcher.name || deletedResearcher.email), formatSuccess("successfully removed from researchers."));
            }
          } else {
            console.log(tag, errorTag, formatHighlight(email), formatError("does not exist. Hence, no changes were made."));
          }
        } else {
          console.log(tag, errorTag, formatError("Please provide a valid email using"), formatHighlight(`--email example@email.com`));
        }
      } else {
        if (email) {
          const researcherExists = await ResearchUser.findOne({ email: email });

          if (researcherExists) {
            console.log(tag, errorTag, formatHighlight(email), formatError("already exists. Hence, no changes were made."));
          } else {
            try {
              const isValid = await ResearcherValidationSchema.validate({ email, password, name });

              if (isValid) {
                const newResearcher = new ResearchUser({
                  email: email,
                  name: name,
                });

                const hashedPassword = await newResearcher.hashPassword(password);

                newResearcher.password = hashedPassword;
                const saved = await newResearcher.save();

                if (saved) {
                  console.log(tag, formatSuccess("Created researcher account for"), formatHighlight(name || email));
                } else {
                  console.log(tag, formatError("Couldn't create researcher account for"), formatHighlight(name || email));
                }
              }
            } catch ({ errors = [], ...everythingElse }) {
              debugLog(everythingElse);
              if (errors.length > 0) {
                errors.forEach((error) => {
                  console.log(tag, errorTag, formatError(error));
                });
              }
            }
          }
        } else {
          console.log(tag, errorTag, formatError("Please provide a valid email using"), formatHighlight(`--email example@email.com`));
        }
      }
    } catch (error) {
      debugLog(error);
    }
  } catch (e) {
    debugLog(e);
    console.log(tag, errorTag, formatError("Some error occured, Please try again"));
  }
}

(async () => {
  try {
    await db.connect();

    await generateResearchUser();
  } catch (error) {
    console.log(tag, errorTag, error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
