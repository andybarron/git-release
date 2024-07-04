import * as cmd from "cmd-ts";
import { release } from "./release.ts";

export const command = cmd.command({
  name: "deno run -A @andyb/release",
  args: {
    allowDirty: cmd.flag({
      type: cmd.boolean,
      long: "allow-dirty",
      description: "Skip git status check",
    }),
    dryRun: cmd.flag({
      type: cmd.boolean,
      long: "dry-run",
      description: "Skip write operations",
    }),
    gitTagPrefix: cmd.option({
      type: cmd.string,
      long: "tag-prefix",
      defaultValue: () => "release/",
    }),
  },
  handler: async ({ allowDirty, dryRun, gitTagPrefix }) => {
    await release({ allowDirty, dryRun, gitTagPrefix });
  },
});
