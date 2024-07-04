import { command } from "./cli.ts";
import { run } from "cmd-ts";
import { release, type ReleaseParams } from "./release.ts";

export { release, type ReleaseParams };

if (import.meta.main) {
  await run(command, Deno.args);
}
