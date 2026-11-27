// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Health UI compatibility check against the pinned @junctura/ui release candidate.
//
// Builds the RC from a Junctura Workspace checkout at the supported revision, packs it
// into a tarball (the exact artifact npm would publish), installs that tarball into
// ui-compat/ together with a tarball of the built @junctura/health-ui, then runs the
// typecheck, tests and library build of the ui-compat entry point there. Ordinary
// Health builds never touch the RC: ui-compat/ is installed only by this script.
//
// Usage: node scripts/check-ui-compat.mjs
// Requires a Workspace checkout (JUNCTURA_WORKSPACE_DIR, default .junctura-workspace)
// and the Health UI build (npm run ui:install && npm run ui:build) — the script runs
// either when missing. See pack/README.md for the pinned revision.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WORKSPACE_REVISION = "73171dae8d50031a6d52c8dde7cfcd82bebb68ef";
const RC_VERSION = "0.1.0-rc";
const root = fileURLToPath(new URL("..", import.meta.url));

const run = (command, args, opts = {}) => {
  const name = `${command} ${args.join(" ")}${opts.cwd ? ` (in ${opts.cwd})` : ""}`;
  console.log(`+ ${name}`);
  const result = spawnSync(command, args, { cwd: opts.cwd ?? root, stdio: "inherit", shell: false });
  assert.equal(result.status, 0, `${name} failed`);
};

const readPackageVersion = path => JSON.parse(readFileSync(path, "utf8")).version;

// The Workspace checkout: explicit env first, then the path CI checks out and the
// coordinator prepares. Never modified beyond installing its own dependencies.
const workspace = resolve(process.env.JUNCTURA_WORKSPACE_DIR ?? join(root, ".junctura-workspace"));
const rcDir = join(workspace, "packages", "ui");
assert.ok(existsSync(join(rcDir, "package.json")), `no @junctura/ui in ${workspace}: prepare the checkout at revision ${WORKSPACE_REVISION} (pack/README.md)`);
const git = spawnSync("git", ["-C", workspace, "rev-parse", "HEAD"], { encoding: "utf8" });
if (git.status === 0) {
  const revision = git.stdout.trim();
  assert.equal(revision, WORKSPACE_REVISION, `${workspace} is at ${revision}, expected the supported revision ${WORKSPACE_REVISION}`);
} else {
  console.log(`? ${workspace} is not a git checkout; the revision pin is verified by CI`);
}
assert.equal(readPackageVersion(join(rcDir, "package.json")), RC_VERSION, `@junctura/ui version drift against the supported revision ${WORKSPACE_REVISION}`);
console.log(`Workspace revision ${WORKSPACE_REVISION}, @junctura/ui ${RC_VERSION}`);

// Build the RC when its dist is missing (the source tree is never touched otherwise).
if (!existsSync(join(rcDir, "dist", "index.js"))) {
  if (!existsSync(join(rcDir, "node_modules"))) run("npm", ["ci", "--prefer-offline", "--no-audit", "--no-fund"], { cwd: rcDir });
  run("npm", ["run", "build"], { cwd: rcDir });
}

// The compat wrapper links the built @junctura/health-ui, so its dist must exist too.
const healthUi = join(root, "ui");
assert.ok(existsSync(join(healthUi, "dist", "index.js")), `ui/dist missing: run npm run ui:install && npm run ui:build first`);

// Pack both libraries and install the tarballs into ui-compat/ next to its declared
// dependencies. Tarballs are the exact publish artifacts and keep one React copy:
// the extracted packages resolve react from ui-compat/node_modules.
const tarballDir = mkdtempSync(join(tmpdir(), "junctura-ui-rc-"));
try {
  run("npm", ["pack", rcDir, "--pack-destination", tarballDir]);
  run("npm", ["pack", healthUi, "--pack-destination", tarballDir]);
  const rcTarball = join(tarballDir, `junctura-ui-${RC_VERSION}.tgz`);
  const healthUiVersion = readPackageVersion(join(healthUi, "package.json"));
  const healthUiTarball = join(tarballDir, `junctura-health-ui-${healthUiVersion}.tgz`);
  assert.ok(existsSync(rcTarball), `npm pack produced no ${rcTarball}`);
  assert.ok(existsSync(healthUiTarball), `npm pack produced no ${healthUiTarball}`);
  run("npm", ["install", "--no-save", "--no-package-lock", "--no-audit", "--no-fund", rcTarball, healthUiTarball], { cwd: join(root, "ui-compat") });
  assert.equal(readPackageVersion(join(root, "ui-compat", "node_modules", "@junctura", "ui", "package.json")), RC_VERSION, "the installed RC version");
  assert.equal(readPackageVersion(join(root, "ui-compat", "node_modules", "@junctura", "health-ui", "package.json")), healthUiVersion, "the installed health-ui version");
  run("npm", ["run", "typecheck"], { cwd: join(root, "ui-compat") });
  run("npm", ["test"], { cwd: join(root, "ui-compat") });
  run("npm", ["run", "build"], { cwd: join(root, "ui-compat") });
} finally {
  rmSync(tarballDir, { recursive: true, force: true });
}
console.log(`Health UI compatibility verified against @junctura/ui ${RC_VERSION} (workspace ${WORKSPACE_REVISION})`);
