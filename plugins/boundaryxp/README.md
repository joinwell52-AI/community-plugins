[简体中文](README.zh-CN.md) | **English**

# BoundaryXP · 7+1 task boundary verification

**Plugin 0.1.0 · MCP 0.4.0-rc.9 · Windows x64 · Node.js >=22.19 with bundled npm**

This plugin connects the existing compiled BoundaryXP MCP to Codex. The current
host LLM interprets the task; the native Core independently verifies submitted
finite operands. Reports distinguish LLM judgments, calculation receipts,
source evidence and unknowns. Computation does not prove semantic extraction
correct or authorize execution of the task.

There are 21 tools, 17 resources, custom L2/L3 dictionary import and a loopback
browser workbench. Multiple DEV children remain distinct through explicit IDs.
No model API key, executable installer or separately installed BoundaryXP
application is required for this host-mode plugin. Core implementation source
is private and is not included in this PR/plugin.

Grafana is a separate plugin in this community repository. BoundaryXP does not
depend on it, and users do not need to install or configure Grafana. Repository-wide
Grafana test results are separate from this plugin's native MCP acceptance.

## Installation and first safe prompt

This is a **community-marketplace submission**, not an approved public-directory
listing. Add the Git repository/ref containing this plugin with Codex's **Add
plugin marketplace**. Use the complete repository, or sparse paths
`.agents/plugins` and `plugins`. Then install `boundaryxp@community-plugins`.
Before upstream merge, use the contributor PR branch, not upstream main.

CLI equivalents (replace the source/ref with the branch you reviewed):

```text
codex plugin marketplace add <reviewed-owner/repository> --ref <reviewed-ref>
codex plugin add boundaryxp@community-plugins
```

Start a new chat. Node must be on the host's PATH and include its bundled npm.
On first tool connection, the launcher installs the exact lockfile using `npm ci
--ignore-scripts` from registry.npmjs.org. This requires network access; subsequent
connections reuse the local installation. Installation logs go only to stderr.
Allow up to 300 seconds for the first connection. On slow networks, run
`node scripts/launch.mjs --install-only` in the installed plugin folder first.

Ask:

> Only through BoundaryXP MCP, call bx_capabilities with language en and help_topic tools,
> bx_profiles_list and bx_workbench_open. Return the actual version and URL.
> Do not submit analysis or change projects.

Expect MCP rc.9, 21 tools and a localhost workbench URL. Open the returned URL;
`browser_opened:false` means opening the browser is a host/user action.
The URL's random port is a workbench, not a remote MCP endpoint.

## Analyze a task

Use [examples/multi-dev.md](examples/multi-dev.md) as task data, not business
execution instructions. Ask to preview it with `bx_task_import`, retain both DEV
nodes and confirm the tree before saving a new project. Use the actual digest
from `bx_dictionaries_bind({"selection":{}})`; never invent one.

When analysis is requested, the host uses `bx_analysis_submit(action:"prepare")`
for the exact project/revision, reads every instruction artifact page, generates
the complete analysis JSON, and calls `action:"complete"` with the preparation
digest and job ID. Poll `bx_job_get` and read the returned `result_revision` with
`bx_result_get`; a submission is not completion. Read full report artifacts.
`bx_result_recheck` checks saved operands without a new model request and retains
the old result. Do not silently retry failed analyses.

For custom dictionaries, call `bx_dictionary_format` for L2 or L3 in `en` or
`zh-CN`, validate the whole JSON using `bx_dictionary_validate`, then import the
same document with its returned sha256 using `bx_dictionary_import`. Versions
cannot be silently overwritten. Binding a dictionary grants no authority.

## Files, permissions, network and authentication

- Default home: `%LOCALAPPDATA%/BoundaryXP/CommunityPlugin`. It contains the npm
  cache, pinned runtime, empty host profiles and `data-rc9` task/dictionary store.
  This is separate from existing standalone installations. No existing tasks,
  dictionary directories, host settings or ports are discovered or changed.
- `BXP_PLUGIN_HOME` may specify a dedicated absolute directory. An unrelated
  nonempty directory is refused. Do not point it at an existing installation.
- **Read**: explicit task text, selected dictionaries and saved project records.
  **Write**: plugin-owned installation, task revisions, dictionaries and reports.
  The launcher does not edit Codex settings or install a service/scheduled task.
- npm downloads public packages from registry.npmjs.org. Package lifecycle
  scripts are disabled and lockfile integrity is checked by npm. The native
  binary is already included in the published package; no Core source build runs.
- The local workbench binds loopback. Core does not call a model or access the
  network. This wrapper exposes host mode only and does not read `.env` or API
  credentials; provider keys are not forwarded to its child processes.
- Task content and selected dictionary context are visible to the current host
  LLM under that host's privacy/billing arrangements. Zero server API requests
  does not mean zero host LLM activity. No model-brand claim is inferred by MCP.
- Optional independent provider API mode is documented for the standalone MCP;
  it is deliberately not configured by this plugin.

## Updates, removal and safe failures

This plugin pins rc.9, not `latest`. It does not automatically upgrade the Core,
migrate existing data or restart other clients. Future runtime changes need an
explicit migration plan preserving original records. Keep the plugin home when
updating/removing the plugin; plugin cache deletion does not delete this home.
Do not run duplicate connections against one task store.

| Failure | Action |
|---|---|
| BXP_PLATFORM | Use Windows x64; macOS/Linux are not qualified for this native package. |
| BXP_NODE / BXP_NPM | Install supported Node with bundled npm and restart the host. |
| BXP_HOME | Choose an empty dedicated directory; existing contents were preserved. |
| BXP_BUSY | Wait for the other install and reconnect; inspect a stale install.lock only after confirming no installation is running. |
| BXP_INSTALL / incomplete runtime | Check stderr/network. Failed staging files are retained for inspection; no silent reinstall or analysis retry. |
| BXP_PROFILE | Keep the plugin's profiles list empty; standalone API setup is separate. |
| Model output rejected | Preserve failed job/raw response; inspect built-in troubleshooting before an explicitly requested new analysis. |

## Verification and distribution

From the repository root run `npm run test:boundaryxp`. Portable tests cover
package structure, version pinning, isolation and failure behavior. Windows
integration tests copy the plugin into a new directory, perform a real npm
installation, exercise the native MCP tools, save a multi-DEV project, validate
and import dictionaries, reconnect and verify persistence. They do not submit a
fabricated model response or claim model semantic accuracy. Unsupported-host
integration is reported as skipped. See [test guide](../../tests/boundaryxp/README.md).

[Product and bilingual install/upgrade guide](https://www.npmjs.com/package/boundaryxp-mcp)
· [MIT license](LICENSE) · [Third-party notices](THIRD-PARTY-NOTICES.md).
