import { type JsonValue, parse as parseJsonc } from "@std/jsonc";
import { parse as parseSemVer, type SemVer } from "@std/semver";
import { assert } from "./util.ts";

const POSSIBLE_CONFIG_FILES = ["jsr.json", "deno.json", "deno.jsonc"];

export async function readConfigFile(): Promise<
  { filename: string; contents: string }
> {
  for (const filename of POSSIBLE_CONFIG_FILES) {
    try {
      const contents = await Deno.readTextFile(filename);
      return { filename, contents };
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        continue;
      }
      throw err;
    }
  }
  const files = POSSIBLE_CONFIG_FILES.join(", ");
  throw new Error(`No config file found: ${files}`);
}

export async function getVersionFromConfig(): Promise<
  {
    version: SemVer | undefined;
    filename: string;
  }
> {
  const { filename, contents } = await readConfigFile();
  let data: JsonValue;
  try {
    data = parseJsonc(contents);
  } catch (error) {
    throw new Error(
      `Could not parse ${filename}`,
      { cause: error },
    );
  }

  assert(
    data && typeof data === "object" && !Array.isArray(data),
    `Invalid config file ${filename}`,
  );

  if (!("version" in data)) {
    return { filename, version: undefined };
  }

  const { version } = data;

  assert(typeof version === "string", `Invalid "version" field in ${filename}`);

  try {
    return { filename, version: parseSemVer(version) };
  } catch (error) {
    throw new Error(
      `Invalid version ${JSON.stringify(data.version)} in ${filename}`,
      { cause: error },
    );
  }
}

export async function setConfigVersion(
  currentVersion: string,
  newVersion: string,
) {
  const { filename, contents } = await readConfigFile();
  // replace version via text in contents to preserve JSON formatting, comments, etc.
  const newContents = contents.replace(
    new RegExp(`"version":\\s*"${currentVersion}"`),
    `"version": "${newVersion}"`,
  );
  assert(
    newContents !== contents,
    `Version ${currentVersion} not found in ${filename}`,
  );
  await Deno.writeTextFile(filename, newContents);
  // read back the file to ensure it was written correctly
  const { contents: updatedContents } = await readConfigFile();
  assert(
    updatedContents === newContents,
    `Failed to update version in ${filename}`,
  );
}
