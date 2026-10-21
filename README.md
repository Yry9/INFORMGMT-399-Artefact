<<<<<<< HEAD
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
4. 老师可在作业工作区点击 **Student submission link**，生成一次性学生提交链接并发给该学生。学生通过链接声明是否使用 AI，提交提示词、AI 输出、修改说明、反思和最终作业；没有使用 AI 的学生可以选择 **No**，仍然提交最终作业。链接仅可提交一次；需要重交时，老师重新生成链接。
5. 学生也可以将 `.txt` 或 `.md` 文件载入文本框；Word/PDF 请复制文字粘贴。单个文本字段最多 50,000 字符。学生提交后，记录会自动关联到老师创建的学生和 assessment。
6. 老师回到工作区刷新页面，打开 Interaction history 或 AI similarity review，查看学生提交的记录、短语重合、并排原文，并保存审核备注和状态。

数据按登录账户隔离。H2 数据文件默认写入 `backend/data/ai-analytics.mv.db`，正常关闭服务不会清除数据。开发环境 Vite 前端在 5173，API 在 8080；Vite 配置已处理 API 代理和会话 Cookie/CSRF 请求。

## 相似度结果如何理解

目前 similarity review 是本地可运行的文本比较：把 AI 输出和最终作业切成连续五词短语，再计算最终作业短语中有多少出现在 AI 输出里。结果是重合比例和匹配短语，方便人工复核；它不是外部 AI 检测器，也不能单凭这个比例证明学生违规。交互记录来自学生提交或教师录入，尚未连接 ChatGPT 等平台自动采集对话。提交链接是一次性保密链接；本地演示可在同一台电脑打开。若学生用其他设备访问，老师需通过 Vite 显示的局域网地址打开工作区并生成链接（不要发送 `localhost` 链接）；真正远程使用需部署到可访问的服务器。

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
=======
# INFORMGMT-399-Artefact
>>>>>>> 614412db080b48bacb1e9326198ceee33661695f
