# BoundaryXP plugin checks

Run `npm run test:boundaryxp` from the repository root. The single master command
covers unit/package checks, safe failures/isolation and the Windows native
integration. It needs Node >=22.19; the native integration also requires Windows
x64, bundled npm and outbound registry.npmjs.org access.

The native suite copies the installable plugin into a fresh OS temporary folder,
uses a dedicated BXP_PLUGIN_HOME, installs the locked published npm binary, and
exercises real stdio MCP discovery, bilingual help, four L2/L3 format examples,
validation/import/idempotence, multi-DEV import/validation/project persistence,
source artifact digest and local workbench HTTP. Reconnection must preserve the
new test project and dictionaries. Test evidence remains in that temporary folder.

Portable checks cover manifest/catalog/lock agreement, absence of original Core
files and credentials, unsupported platforms, nonempty data directories and
filtered child-process environment. They never access existing user task stores,
provider credentials, installed MCP configurations or a pre-existing workbench.

This is a plugin packaging/native-tools test, not an LLM semantic accuracy test.
No fabricated LLM response is submitted and no paid provider is invoked.
macOS/Linux report the native integration as skipped, not passed. Native Core
source/rebuild reproducibility is outside this compiled-dependency submission.

Repository-wide `npm run validate:marketplace`, `npm run test:marketplace` and
`npm run validate` remain separate checks. Any unrelated dependency/platform
failures must be reported rather than counted as a plugin pass. All acceptance
for this change is local; no new hosted CI workflow is included.
