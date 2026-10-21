# AI Interaction Analytics Dashboard

A locally runnable web application with a React frontend and a Spring Boot backend. User accounts, students, assessments, AI interaction records, final work, and review notes are stored in a local H2 database. Register a new account on first use; no demo account is preconfigured.

## Requirements

- Java 21
- Maven 3.9 or later
- Node.js 20.19 or later (npm is included with Node.js)

Check your installed versions in PowerShell:

```powershell
java -version
mvn -version
node -v
npm -v
```

## Run the application

Open two PowerShell windows in the project root. Start the backend in the first window:

```powershell
cd .\backend
mvn spring-boot:run
```

After Spring Boot has started, start the frontend in the second window:

```powershell
cd .\frontend
npm install
npm run dev
```

Open <http://localhost:5173> and register an account. Check backend health at <http://localhost:8080/actuator/health>. Stop each process with `Ctrl+C` in its terminal window.

If port 8080 or 5173 is already in use, stop the process using that port or change the port. To run the backend on port 8081:

```powershell
cd .\backend
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

In the frontend PowerShell window, set the API proxy target before starting Vite:

```powershell
$env:API_PROXY_TARGET='http://localhost:8081'
npm run dev
```

## Main workflow

1. Register or sign in. Spring Security uses server-side sessions, and the frontend sends backend requests through the `/api` proxy.
2. Create a student with a name, student ID, and course.
3. Select the student and create an assessment.
4. In the assessment workspace, select **Student submission link** to generate a one-time link for the student. The student declares whether AI was used and submits prompts, AI output, revision notes, reflection, and final work. A student who did not use AI can select **No** and submit final work. Each link can be used once; generate a new link if a resubmission is needed.
5. Students can load `.txt` or `.md` files into the text fields. For Word or PDF files, copy and paste the text. Each text field accepts up to 50,000 characters. Submitted records are associated with the selected student and assessment.
6. Refresh the teacher workspace and open **Interaction history** or **AI similarity review** to review submitted records, matching phrases, and side-by-side text. The teacher can save review notes and a review status.

Data is isolated by account. The H2 database file is stored at `backend/data/ai-analytics.mv.db` and remains after a normal shutdown. The Vite development server runs on port 5173, and the backend API runs on port 8080. Vite is configured to proxy API requests and handle session cookies and CSRF requests.

## Understanding the similarity result

The similarity review uses a local text comparison. It splits the AI output and final work into consecutive five-word phrases, then calculates the proportion of phrases in the final work that also appear in the AI output. The result includes the overlap percentage and matching phrases to support human review. It is not an external AI detector, does not perform semantic similarity analysis, and cannot by itself establish misconduct.

Interaction records are entered by students or teachers. The application does not automatically collect conversations from ChatGPT or other AI platforms. Submission links are one-time private links. For a local demonstration, a link using `localhost` works only on the same computer. To let a student use another device on the same local network, open the teacher workspace through the LAN address shown by Vite before generating the link; do not send a `localhost` link. Remote access requires deployment to a server that students can reach.

## Troubleshooting

- **`mvn` is not recognized:** Install Apache Maven and reopen PowerShell. Alternatively, open `backend/pom.xml` in IntelliJ IDEA, allow Maven to import the project, and run `AiAnalyticsApplication`.
- **`node` or `npm` is not recognized:** Install a current Node.js LTS release and reopen the terminal.
- **The frontend cannot connect or the login page reports an error:** Confirm that the backend is running and that <http://localhost:8080/actuator/health> returns `{"status":"UP"}`.
- **A port is already in use:** Stop the application using that port or use the alternate backend port instructions above.
- **Clear all local data:** Stop the backend, then delete `backend/data/ai-analytics.mv.db`. This permanently deletes the local database.

## Project structure

```text
AI-Interaction-Analytics-Ready-to-Run/
├── frontend/   React + Vite application
└── backend/    Spring Boot REST API + H2 database
```
