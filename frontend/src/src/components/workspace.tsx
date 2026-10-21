import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { AlertTriangle, ArrowRight, BookOpen, Check, ChevronDown, ClipboardCheck, FilePlus2, Fingerprint, History, LayoutDashboard, LogOut, MessageSquarePlus, PanelLeft, Plus, Scale, ShieldCheck, UserRoundPlus, X } from 'lucide-react';
import { api, type Assessment, type Finding, type Interaction, type Section, type Student, type Summary, type User } from '@/lib/api';
import { StatusToast } from '@/components/status-toast';

type ModalKind = 'student' | 'assessment' | 'interaction' | 'section' | null;
const interactionTypes = [
  { value: 'PROMPT', label: 'Prompt' }, { value: 'AI_OUTPUT', label: 'AI output' },
  { value: 'REVISION', label: 'Revision' }, { value: 'REFLECTION', label: 'Reflection' },
];
const kindLabel = (kind: Interaction['type']) => interactionTypes.find(item => item.value === kind)?.label ?? kind;
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'No activity yet';

function AppShell({ children, currentPath, user, assessment, onLogout }: { children: ReactNode; currentPath: string; user: User; assessment: Assessment | null; onLogout: () => void }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand-mark" data-testid="link-brand">A</Link>
      <div className="brand-copy" style={{ marginTop: 12 }}><div className="brand-title">Academic lens</div><div className="brand-subtitle">AI interaction review</div></div>
      <div className="nav-section">Workspace</div>
      <nav aria-label="Primary navigation">
        <Link href="/" className={`nav-link ${currentPath === '/' ? 'active' : ''}`}><LayoutDashboard size={17}/><span>Review desk</span></Link>
        <Link href="/history" className={`nav-link ${currentPath === '/history' ? 'active' : ''}`}><History size={17}/><span>Interaction history</span></Link>
        <Link href="/comparison" className={`nav-link ${currentPath === '/comparison' ? 'active' : ''}`}><PanelLeft size={17}/><span>Side-by-side review</span></Link>
      </nav>
      <div className="sidebar-note"><ShieldCheck size={16}/><p>Similarity highlights text overlap for closer review. A marker makes the assessment decision.</p></div>
    </aside>
    <div className="main-column">
      <header className="topbar">
        <div className="crumb"><BookOpen size={14}/><span>{assessment?.courseCode ?? 'Workspace'}</span><span>/</span><strong>{assessment?.title ?? 'Review desk'}</strong></div>
        <div className="prototype-notice"><span className="prototype-badge">Private workspace</span><span>Account data · persistent backend</span></div>
        <div className="user-chip"><span>{user.displayName}</span><span className="avatar">{user.displayName.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()}</span><button className="icon-button logout-button" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogOut size={16}/></button></div>
      </header>{children}
    </div>
  </div>;
}

function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="entry-modal" role="dialog" aria-modal="true" aria-labelledby="entry-modal-title">
      <div className="modal-head"><div><div className="eyebrow">Workspace records</div><h2 id="entry-modal-title">{title}</h2><p>{description}</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>{children}
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="entry-field"><span className="field-label">{label}</span>{children}</label>; }

export function Workspace({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [location, setLocation] = useLocation();
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState('');
  const [modal, setModal] = useState<ModalKind>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [dataError, setDataError] = useState('');
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const showToast = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800); }, []);
  const selectedStudent = students.find(item => item.id === studentId) ?? null;
  const selectedAssessment = assessments.find(item => item.id === assessmentId) ?? (assessment?.studentId === studentId ? assessment : null);
  const selectedFinding = findings.find(item => item.id === selectedFindingId) ?? findings[0] ?? null;

  const loadStudents = useCallback(async () => {
    const values = await api.students(); setStudents(values);
    if (!values.length) { setStudentId(null); setAssessments([]); setAssessmentId(null); }
    else if (!values.some(item => item.id === studentId)) setStudentId(values[0].id);
  }, [studentId]);

  const loadAssessmentData = useCallback(async (id: number) => {
    try {
      const [assessmentValue, summaryValue, interactionValues, sectionValues, findingValues] = await Promise.all([
        api.assessment(id),
        api.summary(id), api.interactions(id), api.sections(id), api.similarity(id),
      ]);
      setAssessment(assessmentValue as Assessment);
      setSummary(summaryValue); setInteractions(interactionValues); setSections(sectionValues); setFindings(findingValues);
      setDraftNotes(previous => Object.fromEntries(findingValues.map(item => [item.id, previous[item.id] ?? item.note ?? ''])));
      setSelectedFindingId(previous => findingValues.some(item => item.id === previous) ? previous : findingValues[0]?.id ?? '');
      setDataError('');
    } catch (cause) { setDataError(cause instanceof Error ? cause.message : 'Could not load this assessment.'); }
  }, []);

  useEffect(() => { loadStudents().catch(cause => setDataError(cause instanceof Error ? cause.message : 'Could not load workspace.')); }, []);

  useEffect(() => {
    if (!studentId) { setAssessments([]); setAssessmentId(null); return; }
    let current = true;
    api.assessments(studentId).then(values => {
      if (!current) return;
      setAssessments(values);
      setAssessmentId(old => values.some(item => item.id === old) ? old : values[0]?.id ?? null);
    }).catch(cause => { if (current) setDataError(cause instanceof Error ? cause.message : 'Could not load assessments.'); });
    return () => { current = false; };
  }, [studentId]);

  useEffect(() => {
    if (!assessmentId) { setAssessment(null); setSummary(null); setInteractions([]); setSections([]); setFindings([]); return; }
    loadAssessmentData(assessmentId);
  }, [assessmentId, loadAssessmentData]);

  const persistReview = async (finding: Finding, status: string, note: string) => {
    if (!assessmentId) return;
    setBusy(true); setError('');
    try { await api.updateReview(assessmentId, finding.interactionId, finding.sectionId, status, note); await loadAssessmentData(assessmentId); showToast(status === 'FLAGGED' ? 'Saved for further human review.' : status === 'REVIEWED' ? 'Review checkpoint saved.' : 'Review update saved.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the review.'); }
    finally { setBusy(false); }
  };

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? '').trim();
    try {
      if (modal === 'student') {
        const created = await api.createStudent({ name: value('name'), studentNumber: value('studentNumber'), course: value('course') });
        const values = await api.students(); setStudents(values); setStudentId(created.id); setAssessmentId(null); showToast('Student record added.');
      } else if (modal === 'assessment' && studentId) {
        const created = await api.createAssessment({ studentId, title: value('title'), courseCode: value('courseCode'), dueDate: value('dueDate') || null, lane: value('lane') || 'Lane 2' });
        setAssessments(old => [...old, created]); setAssessmentId(created.id); showToast('Assessment added.');
      } else if (modal === 'interaction' && assessmentId) {
        const type=value('type');
        await api.addInteraction(assessmentId, { type, title: value('title'), content: value('content'), model: value('model'), sectionId: type === 'AI_OUTPUT' && value('sectionId') ? Number(value('sectionId')) : null });
        await loadAssessmentData(assessmentId); showToast('Interaction record saved.');
      } else if (modal === 'section' && assessmentId) {
        await api.addSection(assessmentId, { title: value('title'), content: value('content'), position: sections.length });
        await loadAssessmentData(assessmentId); showToast('Final-work section saved.');
      }
      setModal(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this record.'); }
    finally { setBusy(false); }
  }

  const openCompare = (finding?: Finding) => { if (finding) setSelectedFindingId(finding.id); setLocation('/comparison'); };
  const modalDescription = modal === 'student' ? 'Create a student record in your private workspace.' : modal === 'assessment' ? 'Choose a title and course code for this piece of work.' : modal === 'interaction' ? 'Record a prompt, AI output, revision, or student reflection.' : 'Paste the submitted work, or add one section at a time for clearer comparison.';

  return <AppShell currentPath={location} user={user} assessment={selectedAssessment} onLogout={onLogout}>
    <main className="content-wrap">
      <div className="title-row fade-up">
        <div><div className="eyebrow">Marker workspace · {location === '/history' ? '02' : location === '/comparison' ? '03' : '01'}</div>
          <h1 className="page-title">{location === '/history' ? <>The working<br/><em>conversation.</em></> : location === '/comparison' ? <>Look for the<br/><em>through-line.</em></> : <>Review the trail,<br/><em>not a verdict.</em></>}</h1>
          <p className="page-intro">{location === '/history' ? 'Review the recorded prompts, outputs, revisions and reflections attached to this assessment.' : location === '/comparison' ? 'Inspect the saved text behind each similarity signal and record a human review.' : 'Select a student and assessment, then review the saved AI interaction history and text-overlap evidence.'}</p>
        </div>
        <div className="header-actions">
          <button className="button button-secondary" onClick={() => setModal('student')}><UserRoundPlus size={15}/> Add student</button>
          <button className="button button-primary" disabled={!studentId} onClick={() => setModal('assessment')}><Plus size={15}/> New assessment</button>
        </div>
      </div>

      <section className="surface selection-bar selection-bar-wide">
        <div><span className="field-label">Student</span><span className="select-wrap"><select className="select-input" value={studentId ?? ''} onChange={event => setStudentId(event.target.value ? Number(event.target.value) : null)} aria-label="Select student"><option value="">Select a student</option>{students.map(item => <option key={item.id} value={item.id}>{item.name}{item.studentNumber ? ` · ${item.studentNumber}` : ''}</option>)}</select><ChevronDown size={15}/></span></div>
        <div><span className="field-label">Assessment</span><span className="select-wrap"><select className="select-input" value={assessmentId ?? ''} onChange={event => setAssessmentId(event.target.value ? Number(event.target.value) : null)} aria-label="Select assessment" disabled={!assessments.length}><option value="">{assessments.length ? 'Select an assessment' : 'No assessment yet'}</option>{assessments.map(item => <option key={item.id} value={item.id}>{item.title} · {item.courseCode}</option>)}</select><ChevronDown size={15}/></span></div>
        <div className="selection-context">{selectedStudent ? <><span className="student-initial">{selectedStudent.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()}</span><span><strong>{selectedStudent.name}</strong><small>{selectedStudent.course || 'Course not specified'}</small></span></> : <span className="selection-hint">Create a student record to start.</span>}</div>
      </section>

      {dataError && <div className="form-error data-error" role="alert">{dataError} <button className="button button-quiet" onClick={() => assessmentId ? loadAssessmentData(assessmentId) : loadStudents()}>Retry</button></div>}
      {error && <div className="form-error data-error" role="alert">{error}<button className="icon-button" onClick={() => setError('')} aria-label="Dismiss"><X size={14}/></button></div>}

      {!students.length ? <EmptyWorkspace title="Start with a student record" copy="Your workspace is empty. Add a student, create an assessment, then enter the AI interaction records and submitted work you want to review." action={<button className="button button-primary" onClick={() => setModal('student')}><UserRoundPlus size={15}/> Add first student</button>}/> : !selectedStudent ? <EmptyWorkspace title="Choose a student" copy="Select a student above, or add another student record." action={<button className="button button-primary" onClick={() => setModal('student')}><UserRoundPlus size={15}/> Add student</button>}/> : !selectedAssessment ? <EmptyWorkspace title="Add an assessment" copy={`Create an assessment for ${selectedStudent.name}. You can then save AI outputs, interaction history, and final-work sections.`} action={<button className="button button-primary" onClick={() => setModal('assessment')}><Plus size={15}/> Add first assessment</button>}/> : location === '/history' ? <HistoryPage interactions={interactions} onAdd={() => setModal('interaction')} onCompare={openCompare}/> : location === '/comparison' ? <ComparisonPage findings={findings} selected={selectedFinding} onSelect={setSelectedFindingId} onAddSection={() => setModal('section')} onAddInteraction={() => setModal('interaction')} onReview={persistReview} draftNotes={draftNotes} setDraftNotes={setDraftNotes} busy={busy}/> : <ReviewDesk student={selectedStudent} assessment={selectedAssessment} summary={summary} findings={findings} sections={sections} interactions={interactions} onCompare={openCompare} onAddInteraction={() => setModal('interaction')} onAddSection={() => setModal('section')} onReview={persistReview} busy={busy}/>}

      <div className="privacy-strip"><LockKeyholeIcon/><span>Records are stored in this account’s database. Similarity is calculated from saved text and only points to areas for closer review; the marker makes the final assessment decision.</span></div>
    </main>
    {modal && <Modal title={modal === 'student' ? 'Add a student' : modal === 'assessment' ? 'Create an assessment' : modal === 'interaction' ? 'Add an interaction' : 'Add final work'} description={modalDescription} onClose={() => { setModal(null); setError(''); }}>
      <form className="entry-form" onSubmit={submitEntry}>
        {modal === 'student' && <><Field label="Student name"><input className="text-input" name="name" required maxLength={160} placeholder="e.g. Alex Morgan" autoFocus/></Field><Field label="Student ID · optional"><input className="text-input" name="studentNumber" maxLength={80} placeholder="Institutional identifier"/></Field><Field label="Course · optional"><input className="text-input" name="course" maxLength={200} placeholder="e.g. ENV302 · Environmental Policy"/></Field></>}
        {modal === 'assessment' && <><Field label="Assessment title"><input className="text-input" name="title" required maxLength={200} placeholder="e.g. Sustainability Policy Analysis" autoFocus/></Field><Field label="Course code"><input className="text-input" name="courseCode" required maxLength={40} placeholder="e.g. ENV302"/></Field><div className="form-row"><Field label="Due date · optional"><input className="text-input" name="dueDate" type="date"/></Field><Field label="Assessment lane"><input className="text-input" name="lane" defaultValue="Lane 2" maxLength={40}/></Field></div></>}
        {modal === 'interaction' && <><Field label="Record type"><select className="text-input" name="type" defaultValue="AI_OUTPUT">{interactionTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field><Field label="Title"><input className="text-input" name="title" required maxLength={180} placeholder="Short description" autoFocus/></Field><Field label="AI tool · optional"><input className="text-input" name="model" maxLength={120} placeholder="e.g. ChatGPT, Claude, or student-authored"/></Field><Field label="Link to a final-work section · optional"><select className="text-input" name="sectionId" defaultValue=""><option value="">Compare this output with all sections</option>{sections.map(section=><option key={section.id} value={section.id}>{section.title}</option>)}</select></Field><p className="entry-hint">The section link applies when this is an AI output. Without a link, an output is compared with every section in this assessment.</p><Field label="Content"><textarea className="text-input text-area" name="content" required maxLength={50000} placeholder="Paste the prompt or response text…"/></Field></>}
        {modal === 'section' && <><Field label="Section title"><input className="text-input" name="title" required maxLength={180} placeholder="e.g. 3.2 · Policy instruments" autoFocus/></Field><Field label="Submitted final-work text"><textarea className="text-input text-area large" name="content" required maxLength={50000} placeholder="Paste the corresponding final-work section here…"/></Field><p className="entry-hint">Long submissions can be split into sections. The comparison uses unique five-word phrases from this section.</p></>}
        {error && <div className="form-error" role="alert">{error}</div>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModal(null)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save record'} <ArrowRight size={14}/></button></div>
      </form>
    </Modal>}
    {toast && <StatusToast message={toast} />}
  </AppShell>;
}

function ReviewDesk({ student, assessment, summary, findings, sections, interactions, onCompare, onAddInteraction, onAddSection, onReview, busy }: { student: Student; assessment: Assessment; summary: Summary | null; findings: Finding[]; sections: Section[]; interactions: Interaction[]; onCompare: (finding?: Finding) => void; onAddInteraction: () => void; onAddSection: () => void; onReview: (finding: Finding,status: string,note: string)=>void; busy: boolean }) {
  const metricItems = [
    ['Interactions', summary?.interactions ?? 0, 'Saved records'], ['Prompts', summary?.prompts ?? 0, 'Student input'], ['AI outputs', summary?.outputs ?? 0, 'Comparison source'],
    ['Revisions', summary?.revisions ?? 0, 'Student edits'], ['Reflections', summary?.reflections ?? 0, 'Student context'], ['Last activity', summary?.lastActivity ? formatDate(summary.lastActivity) : '—', 'Recorded timestamp'],
  ];
  const contentReady = findings.length > 0;
  return <>
    <section className="metrics-grid">{metricItems.map(([label,value,note]) => <article className="surface metric" key={String(label)}><div className="metric-label">{label}</div><div className={`metric-value ${String(label)==='Last activity'?'metric-date':''}`}>{value}</div><div className="metric-note">{note}</div></article>)}</section>
    <div className="dashboard-grid">
      <section className="surface">
        <div className="card-head"><div><div className="eyebrow">Evidence · {findings.length} comparison{findings.length === 1 ? '' : 's'}</div><h2 className="card-title">AI–Final Work Similarity Check</h2><p className="card-copy">Calculated from the five-word phrases shared by saved AI outputs and final-work sections.</p></div><Scale size={20} color="hsl(172 46% 30%)"/></div>
        {!interactions.some(item => item.type === 'AI_OUTPUT') || !sections.length ? <div className="setup-panel"><div className="empty-state"><Fingerprint size={26}/><h3>Add the text to compare</h3><p>Save at least one AI output and one final-work section. Results are calculated from those records every time this assessment is opened.</p></div><div className="setup-actions"><button className="button button-secondary" onClick={onAddInteraction}><MessageSquarePlus size={15}/> Add AI output or interaction</button><button className="button button-primary" onClick={onAddSection}><FilePlus2 size={15}/> Add final-work section</button></div></div> : !contentReady ? <div className="empty-state"><h3>No comparisons available</h3><p>Add an AI output and a final-work section with enough text to produce a five-word phrase.</p></div> : <div className="finding-list">{findings.map(finding => <article className="finding" key={finding.id}>
          <span className={`finding-dot ${finding.similarityPercent !== null && finding.similarityPercent >= 70 ? 'high' : ''}`}/><div>
            <div className="finding-section">{finding.section}</div><div className="finding-meta">{finding.interactionTitle} · {finding.enoughText ? `${finding.similarityPercent}% phrase overlap` : 'Not enough final-work text'} · {finding.matchingPhrases.length} shared phrases</div>
            {finding.matchingPhrases.length > 0 && <div className="phrase-list">{finding.matchingPhrases.slice(0,3).map(phrase => <span key={phrase}>{phrase}</span>)}{finding.matchingPhrases.length > 3 && <span>+{finding.matchingPhrases.length - 3} more</span>}</div>}
            <div className="finding-excerpt">{finding.finalText.slice(0,180)}{finding.finalText.length > 180 ? '…' : ''}</div>
          </div><div className="finding-actions"><span className={`status-pill ${finding.reviewStatus.toLowerCase()}`}>{finding.reviewStatus === 'FLAGGED' ? 'Requires human review' : finding.reviewStatus === 'REVIEWED' ? 'Reviewed' : 'Open'}</span><button className="button button-quiet" onClick={() => onCompare(finding)}>Inspect evidence <ArrowRight size={13}/></button>{finding.reviewStatus !== 'FLAGGED' && <button className="button button-secondary compact" disabled={busy} onClick={() => onReview(finding,'FLAGGED',finding.note ?? '')}><AlertTriangle size={13}/> Flag for Further Review</button>}</div>
        </article>)}</div>}
      </section>
      <section className="surface">
        <div className="card-head"><div><div className="eyebrow">Review actions</div><h2 className="card-title">Build the evidence trail</h2><p className="card-copy">Add records before interpreting a similarity signal.</p></div><ClipboardCheck size={20} color="hsl(172 46% 30%)"/></div>
        <div className="review-panel"><div className="review-callout"><AlertTriangle size={16}/><span>A text-overlap percentage is not a misconduct finding. Review the prompt, edits, reflections, citations and the student’s account before making an assessment decision.</span></div><div className="record-counts"><span><strong>{interactions.length}</strong> interactions</span><span><strong>{sections.length}</strong> final-work sections</span></div><div className="action-stack"><Link href="/history" className="action-button"><span className="action-label"><History size={16}/> View interaction history</span><ArrowRight size={15}/></Link><Link href="/comparison" className="action-button"><span className="action-label"><Scale size={16}/> Open side-by-side review</span><ArrowRight size={15}/></Link><button className="action-button" onClick={onAddInteraction}><span className="action-label"><MessageSquarePlus size={16}/> Add an interaction record</span><Plus size={15}/></button><button className="action-button" onClick={onAddSection}><span className="action-label"><FilePlus2 size={16}/> Add final-work section</span><Plus size={15}/></button></div><div className="assessment-context"><strong>{assessment.title}</strong><span>{student.name} · {assessment.courseCode} · {assessment.lane}</span></div></div>
      </section>
    </div>
  </>;
}

function HistoryPage({ interactions, onAdd, onCompare }: { interactions: Interaction[]; onAdd: () => void; onCompare: (finding?: Finding) => void }) {
  const [filter,setFilter] = useState<'ALL'|Interaction['type']>('ALL');
  const visible=useMemo(()=>filter==='ALL'?interactions:interactions.filter(item=>item.type===filter),[filter,interactions]);
  return <>
    <div className="page-toolbar"><div><span className="signal-pill"><ShieldCheck size={12}/> Saved to assessment</span><p className="card-copy">Records are shown in reverse chronological order.</p></div><button className="button button-primary" onClick={onAdd}><MessageSquarePlus size={15}/> Add interaction</button></div>
    <div className="history-layout"><aside className="surface filter-card"><h3>Activity trail</h3>{[{value:'ALL',label:'All records'},...interactionTypes].map(option=><button key={option.value} className={`filter-option ${filter===option.value?'active':''}`} onClick={()=>setFilter(option.value as typeof filter)}><span>{option.label}</span><span className="filter-count">{option.value==='ALL'?interactions.length:interactions.filter(item=>item.type===option.value).length}</span></button>)}<div className="review-callout" style={{marginTop:22}}><ShieldCheck size={15}/><span>Use the recorded context alongside the student’s submitted work and explanation.</span></div></aside>
      <section className="surface"><div className="card-head"><div><h2 className="card-title">{visible.length} recorded {visible.length===1?'moment':'moments'}</h2><p className="card-copy">The data below comes from this assessment’s saved interaction records.</p></div><button className="button button-secondary" onClick={onAdd}><Plus size={14}/> Add record</button></div>
        {visible.length ? <div className="timeline">{visible.map(item=><article className="timeline-item" key={item.id}><div className="timeline-top"><span className="timeline-type">{kindLabel(item.type)}</span><span className="timeline-time">{formatDate(item.occurredAt)}</span></div><h3 className="timeline-title">{item.title}</h3><div className="timeline-content preserve-lines">{item.content}</div><div className="timeline-meta"><span>{item.wordCount} words</span>{item.model&&<span>{item.model}</span>}{item.type==='AI_OUTPUT'&&<span className="signal-pill">Available for comparison</span>}</div></article>)}</div> : <EmptyWorkspace title="No interaction records" copy="Add prompts, AI outputs, revisions, and reflections as they become available. An AI output is required before the similarity check can compare text." action={<button className="button button-primary" onClick={onAdd}><MessageSquarePlus size={15}/> Add first interaction</button>}/>}
      </section></div>
  </>;
}

function ComparisonPage({ findings, selected, onSelect, onAddSection, onAddInteraction, onReview, draftNotes, setDraftNotes, busy }: { findings: Finding[]; selected: Finding | null; onSelect: (id: string)=>void; onAddSection: ()=>void; onAddInteraction: ()=>void; onReview: (finding: Finding,status:string,note:string)=>void; draftNotes: Record<string,string>; setDraftNotes: (update: (previous:Record<string,string>)=>Record<string,string>)=>void; busy:boolean }) {
  return <>
    <div className="surface comparison-selector">{findings.length ? <label><span className="field-label">Finding to inspect</span><span className="select-wrap"><select className="select-input" value={selected?.id ?? ''} onChange={event=>onSelect(event.target.value)}>{findings.map(item=><option value={item.id} key={item.id}>{item.section} · {item.similarityPercent === null?'Not enough text':`${item.similarityPercent}% phrase overlap`}</option>)}</select><ChevronDown size={15}/></span></label> : <div className="empty-compare"><div><strong>No comparisons to review yet</strong><p>Save an AI output and a final-work section to calculate a signal.</p></div><div className="setup-actions"><button className="button button-secondary" onClick={onAddInteraction}><MessageSquarePlus size={14}/> Add AI output</button><button className="button button-primary" onClick={onAddSection}><FilePlus2 size={14}/> Add final work</button></div></div>}</div>
    <section className="surface signal-explainer" data-testid="signal-explanation"><div className="signal-explainer-head"><div><div className="eyebrow">Review method</div><h2 className="card-title">How the signal works</h2></div><Scale size={18} color="hsl(172 46% 30%)"/></div><div className="signal-steps"><span>AI output</span><ArrowRight size={14}/><span>Compare with corresponding final-work section</span><ArrowRight size={14}/><span>Similarity signal</span><ArrowRight size={14}/><span>Marker review</span></div><p className="card-copy">The backend compares unique five-word phrases and reports the share of final-work phrases also present in the AI output. This is a text-overlap measure, not a misconduct judgement.</p></section>
    {selected && <>
      <div className="comparison-toolbar"><div><span className="eyebrow">Saved text · {selected.section}</span><div className="comparison-signal-note">{selected.enoughText ? `Similarity signal: ${selected.similarityPercent}% phrase overlap · calculated from saved text` : 'Not enough final-work text to generate five-word phrases'} · {selected.matchingPhrases.length} matching phrases</div></div><span className={`status-pill ${selected.reviewStatus.toLowerCase()}`}>{selected.reviewStatus==='FLAGGED'?'Requires human review':selected.reviewStatus==='REVIEWED'?'Reviewed':'Open'}</span></div>
      <div className="comparison-grid"><section className="surface comparison-pane"><div className="pane-label"><strong>AI output</strong><span>{selected.interactionTitle}</span></div><p className="comparison-text preserve-lines">{selected.aiText}</p><div className="timeline-meta"><span>{wordCount(selected.aiText)} words</span><span>Saved interaction record</span></div></section><section className="surface comparison-pane"><div className="pane-label"><strong>Final work</strong><span>{selected.section}</span></div><p className="comparison-text preserve-lines">{selected.finalText}</p><div className="timeline-meta"><span>{wordCount(selected.finalText)} words</span><span>Saved submission section</span></div></section></div>
      <section className="surface match-evidence"><div className="card-head"><div><div className="eyebrow">Text evidence</div><h2 className="card-title">Shared five-word phrases</h2><p className="card-copy">These phrases contribute to the overlap percentage. Their presence alone does not indicate misconduct.</p></div><Fingerprint size={18} color="hsl(172 46% 30%)"/></div><div className="phrase-list phrase-list-large">{selected.matchingPhrases.length ? selected.matchingPhrases.map(item=><span key={item}>{item}</span>) : <span className="no-matches">No shared five-word phrases in these records.</span>}</div></section>
      <section className="surface notes-card"><div className="card-head"><div><div className="eyebrow">Human review record</div><h2 className="card-title">Marker notes</h2><p className="card-copy">Notes and status are saved to the database for this AI-output and final-work pair.</p></div><ClipboardCheck size={18} color="hsl(172 46% 30%)"/></div><div className="notes-body"><textarea className="text-input text-area note-area" value={draftNotes[selected.id] ?? ''} onChange={event=>setDraftNotes(old=>({...old,[selected.id]:event.target.value}))} maxLength={10000} placeholder="Record context to revisit, questions for the student, or citations to verify…"/><div className="notes-actions"><button className="button button-secondary" disabled={busy} onClick={()=>onReview(selected,selected.reviewStatus,draftNotes[selected.id] ?? '')}>Save note</button>{selected.reviewStatus==='FLAGGED'?<button className="button button-secondary" disabled={busy} onClick={()=>onReview(selected,'OPEN',draftNotes[selected.id] ?? '')}>Clear review flag</button>:<button className="button button-secondary" disabled={busy} onClick={()=>onReview(selected,'FLAGGED',draftNotes[selected.id] ?? '')}><AlertTriangle size={14}/> Flag for Further Review</button>}<button className="button button-primary" disabled={busy} onClick={()=>onReview(selected,'REVIEWED',draftNotes[selected.id] ?? '')}><Check size={14}/> Mark review checkpoint complete</button></div></div></section>
      <div className="review-callout" style={{marginTop:18}}><AlertTriangle size={16}/><span><strong>Interpretation note:</strong> The current percentage is reproducible text overlap for the stored pair. It does not verify authorship or determine academic misconduct. Check interaction history, citations, revisions and the student’s explanation before making an assessment decision.</span></div>
    </>}
  </>;
}

function EmptyWorkspace({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) { return <section className="surface empty-workspace"><div className="empty-orbit"><Fingerprint size={24}/></div><h2>{title}</h2><p>{copy}</p>{action&&<div className="empty-action">{action}</div>}</section>; }
function LockKeyholeIcon() { return <ShieldCheck size={15}/>; }
function wordCount(text: string) { return text.trim() ? text.trim().split(/\s+/).length : 0; }
