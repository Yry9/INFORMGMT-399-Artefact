# AI Interaction Analytics Dashboard：本地运行版

此项目把 React 前端和 Spring Boot 后端整理成两个独立目录。账户、学生、作业、AI 交互记录、最终作业文本和审核状态保存在本地 H2 数据库；首次使用请自行注册账户，没有预置演示账户。

## 环境要求

- Java 21
- Maven 3.9 或更高版本
- Node.js 20.19 或更高版本（安装 Node.js 时会包含 npm）

在 PowerShell 检查：`java -version`、`mvn -version`、`node -v`、`npm -v`。

## 启动

解压后打开两个 PowerShell 窗口。先启动后端：

```powershell
cd .\backend
mvn spring-boot:run
```

等日志显示 Spring Boot started 后，在第二个窗口启动前端：

```powershell
cd .\frontend
npm install
npm run dev
```

浏览器打开 <http://localhost:5173>，注册账户后进入工作区。后端健康状态可在 <http://localhost:8080/actuator/health> 查看。停止服务时，在对应窗口按 `Ctrl+C`。

如果 8080 或 5173 已被占用，请先关闭占用它的程序。后端改用 8081 时运行 `mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"`；同时在前端 PowerShell 设置 `$env:API_PROXY_TARGET='http://localhost:8081'` 后再执行 `npm run dev`。

## 页面和功能流程

1. 注册或登录。Spring Security 使用服务器端会话，前端通过 `/api` 代理请求后端。
2. 新建学生，填写学生姓名、学号和课程。
3. 选中学生并新建作业/assessment。
4. 在作业工作区记录 AI 提示词、AI 输出、修改和反思；填写最终作业分段。
5. 打开 AI similarity review，查看 AI 输出与最终作业之间的短语重合、逐项标记审核状态并写备注。摘要页汇总 prompt、output、revision、reflection 次数和最近活动。

数据按登录账户隔离。H2 数据文件默认写入 `backend/data/ai-analytics.mv.db`，正常关闭服务不会清除数据。开发环境 Vite 前端在 5173，API 在 8080；Vite 配置已处理 API 代理和会话 Cookie/CSRF 请求。

## 相似度结果如何理解

目前 similarity review 是本地可运行的文本比较：把 AI 输出和最终作业切成连续五词短语，再计算最终作业短语中有多少出现在 AI 输出里。结果是重合比例和匹配短语，方便人工复核；它不是外部 AI 检测器，也不能单凭这个比例证明学生违规。频率/深度指标来自教师录入的交互记录，尚未连接 ChatGPT 等平台自动采集对话。

## 常见问题

- `mvn` 无法识别：安装 Apache Maven，并重新打开 PowerShell；也可以在 IntelliJ IDEA 中打开 `backend/pom.xml`，等待 Maven 导入后运行 `AiAnalyticsApplication`。
- `npm` 或 `node` 无法识别：安装 Node.js LTS 并重新打开终端。
- 前端显示无法连接或登录页报错：确认后端仍在运行，再检查 `http://localhost:8080/actuator/health` 返回 `{"status":"UP"}`。
- 端口冲突：关闭占用端口的应用，或按上面的方式调整后端端口和 `API_PROXY_TARGET`。
- 想清空全部数据：先停止后端，再删除 `backend/data/ai-analytics.mv.db`。此操作不可恢复。

## 项目结构

```text
AI-Interaction-Analytics-Ready-to-Run/
├── frontend/   React + Vite 页面
└── backend/    Spring Boot REST API + H2 数据库
```
