import { getVersionFromConfig, setConfigVersion } from "./config.ts";
import { format, increment, parse } from "@std/semver";
import { simpleGit } from "simple-git";
import * as log from "./log.ts";
import { assert, prompt } from "./util.ts";

export type ReleaseParams = {
  dryRun?: boolean;
  releaseVersion?: string;
  postReleaseVersion?: string;
  enableConfirm?: boolean;
  allowDirty?: boolean;
  gitTagPrefix: string;
};

/**
 * Run Git release flow programmatically
 */
export async function release(
  {
    dryRun = false,
    releaseVersion: releaseVersionString,
    postReleaseVersion: postReleaseVersionString,
    enableConfirm = true,
    allowDirty = false,
    gitTagPrefix,
  }: ReleaseParams,
): Promise<void> {
  const git = simpleGit();

  // git dirty check
  if (!allowDirty) {
    const status = await git.status();
    assert(
      status.isClean(),
      "Aborting due to uncommitted changes",
    );
    assert(
      status.current === "main",
      "Aborting due to non-main branch",
    );
  }

  // get version information
  const { filename: configFile, version: currentVersion } =
    await getVersionFromConfig();
  const currentVersionString = currentVersion
    ? format(currentVersion)
    : "(unknown)";
  log.info(
    `Current version: %c${currentVersionString}`,
    "font-weight: bold",
  );
  releaseVersionString = releaseVersionString ?? prompt("Release version:");
  const releaseVersion = parse(releaseVersionString);
  const defaultPostReleaseVersion = increment(
    releaseVersion,
    "prerelease",
    releaseVersion.prerelease?.[0]?.toString() ?? "dev",
  );
  const defaultPostReleaseVersionString = format(defaultPostReleaseVersion);
  postReleaseVersionString = postReleaseVersionString ??
    prompt("Post-release version:", defaultPostReleaseVersionString);
  parse(postReleaseVersionString); // validate
  log.info(
    `Releasing version: %c${releaseVersionString}`,
    "font-weight: bold",
  );
  log.info(
    `Bumping after release: %c${postReleaseVersionString}`,
    "font-weight: bold",
  );

  // confirm
  if (enableConfirm) {
    const confirmed = confirm("Continue?");
    assert(confirmed, "Release cancelled");
  }

  // write release version to config file
  if (dryRun) {
    log.warn("Skipping config file update (dry-run)");
  } else {
    log.info(`Updating config file version to ${releaseVersionString}`);
    await setConfigVersion(currentVersionString, releaseVersionString);
  }

  // commit and push release version + tag
  const releaseTag = `${gitTagPrefix}${releaseVersionString}`;
  if (dryRun) {
    log.warn(
      `Skipping Git operations for version ${releaseVersionString} (dry-run)`,
    );
  } else {
    log.info(`Committing version bump ${releaseVersionString}`);
    await git.add(configFile);
    await git.commit(`chore: release version ${releaseVersionString}`);
    await git.tag([releaseTag]);
    log.info("Pushing changes and tag");
    await git.push();
    await git.push(["origin", releaseTag]);
  }

  // write post-release version to config file
  if (dryRun) {
    log.warn(
      `Skipping config file update (dry-run)`,
    );
  } else {
    log.info(`Updating config file version to ${postReleaseVersionString}`);
    await setConfigVersion(releaseVersionString, postReleaseVersionString);
  }

  // commit and push post-release version
  if (dryRun) {
    log.warn(
      `Skipping Git operations for post-release version ${postReleaseVersionString} (dry-run)`,
    );
  } else {
    log.info(`Committing version bump ${postReleaseVersionString}`);
    await git.add(configFile);
    await git.commit(`chore: bump version to ${postReleaseVersionString}`);
    log.info("Pushing changes");
    await git.push();
  }
}
