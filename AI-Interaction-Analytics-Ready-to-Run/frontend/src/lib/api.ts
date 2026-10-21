export type User = { id: number; displayName: string; email: string };
export type Student = { id: number; name: string; studentNumber: string | null; course: string | null; assessmentCount: number };
export type Assessment = { id: number; studentId: number; title: string; courseCode: string; dueDate: string | null; lane: string; studentName: string; studentNumber: string | null; reviewStatus: string };
export type Summary = { interactions: number; prompts: number; outputs: number; revisions: number; reflections: number; lastActivity: string | null };
export type Interaction = { id: number; sectionId: number | null; type: 'PROMPT' | 'AI_OUTPUT' | 'REVISION' | 'REFLECTION'; title: string; content: string; occurredAt: string; model: string | null; wordCount: number };
export type Section = { id: number; title: string; content: string; position: number; wordCount: number };
export type Finding = { id: string; interactionId: number; sectionId: number; section: string; interactionTitle: string; similarityPercent: number | null; matchingPhrases: string[]; aiText: string; finalText: string; reviewStatus: 'OPEN' | 'FLAGGED' | 'REVIEWED'; note: string | null; enoughText: boolean };

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message ?? body.detail ?? message;
    } catch { /* keep the status fallback */ }
    if (response.status === 401) message = 'Please sign in to continue.';
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function csrfToken() {
  const response = await fetch('/api/auth/csrf', { credentials: 'include' });
  const body = await readResponse<{ token: string }>(response);
  return body.token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-XSRF-TOKEN', await csrfToken());
  return readResponse<T>(await fetch(`/api${path}`, { ...init, headers, credentials: 'include' }));
}

export const api = {
  me: () => request<User>('/auth/me'),
  login: (email: string, password: string) => request<User>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (displayName: string, email: string, password: string) => request<User>('/auth/register', { method: 'POST', body: JSON.stringify({ displayName, email, password }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  students: () => request<Student[]>('/students'),
  createStudent: (body: { name: string; studentNumber: string; course: string }) => request<Student>('/students', { method: 'POST', body: JSON.stringify(body) }),
  assessments: (studentId: number) => request<Assessment[]>(`/students/${studentId}/assessments`),
  createAssessment: (body: { studentId: number; title: string; courseCode: string; dueDate: string | null; lane: string }) => request<Assessment>('/assessments', { method: 'POST', body: JSON.stringify(body) }),
  assessment: (assessmentId: number) => request<Assessment>(`/assessments/${assessmentId}`),
  summary: (assessmentId: number) => request<Summary>(`/assessments/${assessmentId}/summary`),
  interactions: (assessmentId: number) => request<Interaction[]>(`/assessments/${assessmentId}/interactions`),
  addInteraction: (assessmentId: number, body: { type: string; title: string; content: string; model: string; sectionId: number | null }) => request<Interaction>(`/assessments/${assessmentId}/interactions`, { method: 'POST', body: JSON.stringify(body) }),
  sections: (assessmentId: number) => request<Section[]>(`/assessments/${assessmentId}/sections`),
  addSection: (assessmentId: number, body: { title: string; content: string; position: number }) => request<Section>(`/assessments/${assessmentId}/sections`, { method: 'POST', body: JSON.stringify(body) }),
  similarity: (assessmentId: number) => request<Finding[]>(`/assessments/${assessmentId}/similarity`),
  updateReview: (assessmentId: number, interactionId: number, sectionId: number, status: string, note: string) => request<Finding>(`/assessments/${assessmentId}/reviews/${interactionId}/${sectionId}`, { method: 'PUT', body: JSON.stringify({ status, note }) }),
};
