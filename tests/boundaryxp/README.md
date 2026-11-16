# BoundaryXP plugin checks

The November 16 Linux/Glama documentation update does not change this wrapper's
runtime, platform guard, manifest, lockfile or test contract. The separately
published Linux MCP passed its own build/startup/introspection and full-case
acceptance, linked from the plugin READMEs. Those results are not counted as
Linux support or new integration passes for this Windows-only plugin.

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
for this change is local. The optional manual-only `boundaryxp.yml` workflow
defines one master job, runs Node 22.19 and 24.19 sequentially, then audits the
lock and checks unchanged tracked files. It does not run on push/PR and was not
dispatched. It is not used as evidence of hosted qualification or a required gate.

See [the Windows baseline comparison](GRAFANA-WINDOWS-BASELINE.md) for the
unmodified upstream Grafana failures, exact comparison and reproducible commands.

Local acceptance on 2026-11-16 ran the unchanged master sequentially on Windows
x64 with Node 22.19.0 and 24.19.0: **7/7 passed on each, zero skips**. The Node
22.19 distribution was downloaded from nodejs.org and checked against its
published SHA-256 before execution. Both runs performed a fresh locked npm
installation and real native MCP operations. The locked production audit
reported zero vulnerabilities. Full static validation passed; full-marketplace
Windows success and hosted-workflow execution are not claimed.
