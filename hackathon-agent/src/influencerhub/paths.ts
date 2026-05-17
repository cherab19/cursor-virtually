import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const hackathonRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const workspaceRoot = resolve(hackathonRoot, "..");

/** Where the Vite app is scaffolded and built (sibling of hackathon-agent). */
export const INFLUENCERHUB_CWD = resolve(
  process.env.INFLUENCERHUB_CWD?.trim() || resolve(workspaceRoot, "influencerhub"),
);

export const STATE_FILE = resolve(
  hackathonRoot,
  ".influencerhub-build-state.json",
);

export const MASTER_PROMPT_PATH = resolve(
  hackathonRoot,
  "prompts/influencerhub-master.md",
);
