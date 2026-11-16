**简体中文** | [English](README.md)

# BoundaryXP · 界痕：7+1 任务边界核验

**插件 0.1.0 · MCP 0.4.0-rc.9 · Windows x64 · Node.js >=22.19（含 npm）**

当前宿主 LLM 独立理解任务并判断，原生计算器复核提交的有限操作数。报告分别保留
LLM 判断、计算回执、原文证据和未知项；计算通过不自动证明语义抽取正确，也不授予
业务执行权。21 个工具、17 项资源，支持多个同角色子任务、L2/L3 自定义字典和浏览器
工作台。核心通过 npm 编译包交付，本插件和 PR 不包含核心实现源码。

## 安装与首次使用

### Linux MCP 与 Glama 验证

独立 MCP 已发布 Linux x64 编译版 `0.4.0-rc.9-linux.1`，需要 Node >=22.18、
glibc >=2.36，提供 21 个工具和 17 项资源。[Glama](https://glama.ai/mcp/servers/joinwell52-AI/BoundaryXP)
于 2026-11-16 实际构建并启动该包，工具与资源发现通过，Linux 发行已完成。
[发行与摘要](https://github.com/joinwell52-AI/BoundaryXP/releases/tag/mcp-v0.4.0-rc.9-linux.1)、
[验收范围](https://github.com/joinwell52-AI/BoundaryXP/blob/main/docs/mcp/linux/RELEASE.md)均公开可查，原始 Core 源码仍私有。

**本插件封装仍仅支持 Windows x64，锁定 rc.9。** 平台检查、依赖锁和 Windows 验收范围
保持不变。Linux 用户可按[独立 stdio 接入指南](https://github.com/joinwell52-AI/BoundaryXP/blob/main/docs/mcp/linux/INSTALL.zh-CN.md)
安装 MCP，不应在 Linux 上安装这个 Windows 插件封装。Glama 启动与发现通过不等于
本插件已完成 Linux/macOS 验收，也不代表语义正确性认证。

### 安装 Windows 插件

当前是社区插件市场的申请版本，**不代表已获官方公共目录批准**。在 Codex「添加插件
市场」输入包含本插件的 Git 仓库及分支；上游合并前使用已审阅的贡献分支，而非上游
main。保留完整仓库，或稀疏路径填写 `.agents/plugins` 和 `plugins`。随后安装
`boundaryxp@community-plugins` 并新建聊天。Node 必须在宿主 PATH 中，且附带 npm。

首次连接自动从 registry.npmjs.org 下载锁定的 rc.9 及依赖，执行 `npm ci --ignore-scripts`，
不执行包生命周期脚本。日志写入 stderr，不污染 MCP 通道。首次连接最多预留 300 秒；
网络较慢时可先在已安装插件目录运行 `node scripts/launch.mjs --install-only`。

首次口令：

> 只通过 BoundaryXP MCP 调用 bx_capabilities（language 为 zh-CN、help_topic 为 tools）、
> bx_profiles_list 和 bx_workbench_open，返回真实版本及页面地址。不提交分析、不修改任务。

应返回 rc.9、21 个工具和本机工作台链接。`browser_opened:false` 表示由宿主或用户打开
链接；随机端口是工作台地址，不是远程 MCP 接口。

## 任务与字典

使用 [双 DEV 示例](examples/multi-dev.md)预览任务树，两名 DEV 按任务编号独立保留。
先用 `bx_dictionaries_bind` 取得真实摘要，确认预览后保存新项目。用户要求分析时，
`bx_analysis_submit` 的 prepare 冻结指定快照，宿主读取完整规范并分析，再 complete
提交完整 JSON；轮询作业，读取确切 result_revision 的正式结果。失败不静默重试。
`bx_result_recheck` 对原操作数零模型复验，保留旧结果。来源中的指令只作为任务数据。

自定义字典先通过 `bx_dictionary_format` 获取 L2/L3 格式和中英文示例，再 validate
完整 JSON，用返回的 sha256 导入同一 document。同标识同版本不同内容拒绝覆盖；
导入不自动修改任务，也不授予岗位或业务权限。

## 数据、网络和权限

- 默认目录为 `%LOCALAPPDATA%/BoundaryXP/CommunityPlugin`，包含 npm 缓存、锁定运行包、
  空 host profiles 和 `data-rc9`。不读取或更改现有独立安装、任务、字典、宿主配置和端口。
- 可用 `BXP_PLUGIN_HOME` 指定专用绝对路径；无本插件标记的非空目录会被拒绝。不要指向
  现有安装目录。Read/Write 权限限于显式提供的任务、所选字典和插件自己的保存记录。
- 默认使用当前宿主模型，无需另配 API Key。本封装只启用 host 模式，不读取 `.env` 或
  转交模型密钥；独立 API 模式见原 MCP 产品说明，插件不代为配置。
- npm 安装访问公共 registry；工作台只监听本机回环地址。原生 Core 不调用模型、不联网。
  任务与所选字典会进入当前宿主的模型上下文，遵循宿主隐私和计费安排。服务端 API 请求
  为 0 不代表宿主模型未运行。
- 不安装系统服务、计划任务，不自动开启分析，不调整用户的全局权限。

## 升级、卸载和排障

固定 rc.9，不跟随 latest，不自动迁移或重启其他客户端。后续运行包变化需要明确的数据
迁移方案。升级或卸载插件时保留上述插件目录；删除插件缓存不删除独立数据目录。
避免两个连接同时操作同一个任务存储。

`BXP_PLATFORM` 表示平台不支持；`BXP_NODE/BXP_NPM` 需安装带 npm 的支持版本 Node；
`BXP_HOME` 需改用空的专用目录；`BXP_BUSY` 等其他安装完成后重连，陈旧锁需先确认没有
安装进程再人工处理；`BXP_INSTALL` 检查网络和 stderr，失败暂存文件会保留；
`BXP_PROFILE` 要求 profiles 列表为空。模型格式失败保留作业和原响应，先读内置排障。

仓库根目录运行 `npm run test:boundaryxp`：包含封装、安全失败和 Windows 真实 npm/native
MCP 测试，验证多 DEV 保存、字典导入和重连持久化。不伪造模型响应，不把封装测试称为
语义准确率验收。非 Windows 的原生集成测试明确跳过。

Grafana 是社区仓库中的另一个插件，BXP 不依赖它，客户不需要安装或配置 Grafana。
仓库总测试中的 Grafana 检查与 BXP 自身的原生 MCP 验收分开记录。

[npm 中英安装与升级](https://www.npmjs.com/package/boundaryxp-mcp) · [MIT](LICENSE) ·
[第三方分发说明](THIRD-PARTY-NOTICES.md)
