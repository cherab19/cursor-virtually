import { existsSync, renameSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { INFLUENCERHUB_CWD, STATE_FILE } from "./paths.js";

const workspaceRoot = resolve(INFLUENCERHUB_CWD, "..");

export function prepareFreshSdkBuild(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = resolve(workspaceRoot, `influencerhub-backup-${timestamp}`);

  if (existsSync(INFLUENCERHUB_CWD)) {
    const hasContent =
      existsSync(resolve(INFLUENCERHUB_CWD, "package.json")) ||
      existsSync(resolve(INFLUENCERHUB_CWD, "src"));
    if (hasContent) {
      renameSync(INFLUENCERHUB_CWD, backupDir);
      console.log(`Backed up existing app → ${backupDir}`);
    }
  }

  mkdirSync(INFLUENCERHUB_CWD, { recursive: true });
  writeFileSync(
    resolve(INFLUENCERHUB_CWD, "README.md"),
    `# InfluencerHub (SDK build in progress)

This directory is being built autonomously by the **Cursor Agent SDK** orchestrator in \`hackathon-agent/\`.

Do not edit manually during the build. Run:

\`\`\`bash
cd ../hackathon-agent
npm run build:influencerhub -- --resume
\`\`\`
`,
    "utf8",
  );

  if (existsSync(STATE_FILE)) {
    rmSync(STATE_FILE);
    console.log("Reset build state.");
  }

  return backupDir;
}
