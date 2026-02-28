import fs from "fs";
import path from "path";
import readline from "readline";
import os from "os";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const CONFIG_FILE = "codecenter.config.json";
const ENV_FILE = ".env.local";

function getShellRcFile() {
  const shell = process.env.SHELL || "";
  if (shell.includes("zsh")) return path.join(os.homedir(), ".zshrc");
  return path.join(os.homedir(), ".bashrc");
}

async function main() {
  console.log("\n  CodeCenter Setup\n");

  const projectDir = process.cwd();
  const defaultDir = path.join("~", "Code");
  const codeDir = (await ask(`  Code directory [${defaultDir}]: `)).trim() || defaultDir;

  const port = (await ask("  Port [3030]: ")).trim() || "3030";

  const config = {
    codeDirectories: [codeDir],
    projectAliases: {},
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n");
  console.log(`  Created ${CONFIG_FILE}`);

  fs.writeFileSync(ENV_FILE, `PORT=${port}\n`);
  console.log(`  Created ${ENV_FILE}`);

  // Shell aliases
  const addAliases = (await ask("\n  Add shell aliases for quick access? (y/n) [y]: ")).trim().toLowerCase();

  if (addAliases !== "n") {
    const openAlias = (await ask("  Alias to cd + launch Claude Code [cc]: ")).trim() || "cc";
    const browserAlias = (await ask(`  Alias to open dashboard in browser [${openAlias}-open]: `)).trim() || `${openAlias}-open`;

    const rcFile = getShellRcFile();
    const aliasBlock = [
      "",
      "# CodeCenter",
      `alias ${openAlias}="cd ${projectDir} && claude"`,
      `alias ${browserAlias}="open http://localhost:${port}"`,
      "",
    ].join("\n");

    const existing = fs.existsSync(rcFile) ? fs.readFileSync(rcFile, "utf-8") : "";
    if (existing.includes("# CodeCenter")) {
      console.log(`\n  Aliases already exist in ${rcFile} — skipping.`);
      console.log(`  Edit manually if you want to change them.`);
    } else {
      fs.appendFileSync(rcFile, aliasBlock);
      console.log(`  Added aliases to ${rcFile}`);
      console.log(`    ${openAlias}       cd + launch Claude Code`);
      console.log(`    ${browserAlias}  open dashboard in browser`);
    }
  }

  rl.close();

  console.log(`\n  Next steps:`);
  console.log(`    npm run dev          Start the dashboard on port ${port}`);
  if (addAliases !== "n") {
    console.log(`    source ${getShellRcFile().replace(os.homedir(), "~")}  Reload shell to use aliases`);
  }
  console.log(`    Edit ${CONFIG_FILE}  Add projectAliases if needed\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
