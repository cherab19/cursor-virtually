import type { Run } from "@cursor/sdk";

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

export async function streamRun(run: Run, label: string): Promise<void> {
  if (!run.supports("stream")) {
    console.log(dim(`  (${label}: streaming not supported — waiting…)`));
    return;
  }

  for await (const event of run.stream()) {
    if (event.type === "assistant") {
      for (const block of event.message.content) {
        if (block.type === "text") process.stdout.write(block.text);
      }
    } else if (event.type === "tool_call") {
      process.stderr.write(
        `\n${dim("[tool]")} ${cyan(event.name)} ${yellow(String(event.status))}\n`,
      );
    } else if (event.type === "status") {
      process.stderr.write(`\n${dim("[status]")} ${event.status}\n`);
    }
  }
}
