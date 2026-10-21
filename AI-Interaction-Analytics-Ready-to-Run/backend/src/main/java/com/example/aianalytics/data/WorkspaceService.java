package com.example.aianalytics.data;

import com.example.aianalytics.common.ApiDtos.*;
import com.example.aianalytics.security.AccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class WorkspaceService {
    private final AccountRepository accounts;
    private final StudentRepository students;
    private final AssessmentRepository assessments;
    private final InteractionRepository interactions;
    private final FinalWorkSectionRepository sections;
    private final ReviewRecordRepository reviews;

    public WorkspaceService(AccountRepository accounts, StudentRepository students, AssessmentRepository assessments,
                            InteractionRepository interactions, FinalWorkSectionRepository sections, ReviewRecordRepository reviews) {
        this.accounts=accounts; this.students=students; this.assessments=assessments; this.interactions=interactions;
        this.sections=sections; this.reviews=reviews;
    }

    public List<StudentDto> students(Authentication auth) {
        Long ownerId=owner(auth).getId();
        return students.findAllByOwnerIdOrderByNameAsc(ownerId).stream()
            .map(s -> new StudentDto(s.getId(), s.getName(), s.getStudentNumber(), s.getCourse(), assessments.findAllByStudentIdAndStudentOwnerIdOrderByTitleAsc(s.getId(), ownerId).size())).toList();
    }
    public StudentDto createStudent(CreateStudentRequest request, Authentication auth) {
        var student=students.save(new Student(owner(auth), request.name(), request.studentNumber(), request.course()));
        return new StudentDto(student.getId(), student.getName(), student.getStudentNumber(), student.getCourse(), 0);
    }
    public List<AssessmentDto> assessments(Long studentId, Authentication auth) {
        owner(auth);
        return assessments.findAllByStudentIdAndStudentOwnerIdOrderByTitleAsc(studentId, accountId(auth)).stream().map(this::assessmentDto).toList();
    }
    public AssessmentDto createAssessment(CreateAssessmentRequest request, Authentication auth) {
        var student=students.findByIdAndOwnerId(request.studentId(), accountId(auth)).orElseThrow(() -> notFound("Student not found."));
        var assessment=assessments.save(new Assessment(student, request.title(), request.courseCode(), request.dueDate(), request.lane()));
        return assessmentDto(assessment);
    }
    public AssessmentDto assessment(Long id, Authentication auth) { return assessmentForOwner(id, auth); }
    public SummaryDto summary(Long assessmentId, Authentication auth) {
        assessmentEntityForOwner(assessmentId, auth);
        var all=interactions.findAllByAssessmentIdOrderByOccurredAtDesc(assessmentId);
        long prompts=count(all, Interaction.Type.PROMPT), outputs=count(all, Interaction.Type.AI_OUTPUT), revisions=count(all, Interaction.Type.REVISION), reflections=count(all, Interaction.Type.REFLECTION);
        return new SummaryDto(all.size(), prompts, outputs, revisions, reflections, all.isEmpty() ? null : all.get(0).getOccurredAt());
    }
    public List<InteractionDto> interactions(Long assessmentId, Authentication auth) {
        assessmentEntityForOwner(assessmentId, auth);
        return interactions.findAllByAssessmentIdOrderByOccurredAtDesc(assessmentId).stream().map(this::interactionDto).toList();
    }
    public InteractionDto addInteraction(Long assessmentId, CreateInteractionRequest request, Authentication auth) {
        var assessment=assessmentEntityForOwner(assessmentId, auth);
        Interaction.Type type;
        try { type=Interaction.Type.valueOf(request.type().trim().toUpperCase(java.util.Locale.ROOT).replace(' ', '_')); }
        catch (IllegalArgumentException e) { throw new IllegalArgumentException("Choose Prompt, AI output, Revision, or Reflection."); }
        FinalWorkSection linkedSection=null;
        if (request.sectionId() != null) {
            if (type != Interaction.Type.AI_OUTPUT) throw new IllegalArgumentException("Only an AI output can be linked to a final-work section.");
            linkedSection=sections.findById(request.sectionId()).filter(section -> section.getAssessment().getId().equals(assessmentId))
                .orElseThrow(() -> notFound("Final-work section not found."));
        }
        var interaction=interactions.save(new Interaction(assessment, type, request.title(), request.content(), request.model(), linkedSection));
        return interactionDto(interaction);
    }
    public List<SectionDto> sections(Long assessmentId, Authentication auth) {
        assessmentEntityForOwner(assessmentId, auth);
        return sections.findAllByAssessmentIdOrderByPositionAscIdAsc(assessmentId).stream().map(this::sectionDto).toList();
    }
    public SectionDto addSection(Long assessmentId, CreateSectionRequest request, Authentication auth) {
        var assessment=assessmentEntityForOwner(assessmentId, auth);
        var section=sections.save(new FinalWorkSection(assessment, request.title(), request.content(), request.position()));
        return sectionDto(section);
    }
    public AssessmentDto assessmentForOwner(Long id, Authentication auth) {
        return assessmentDto(assessments.findByIdAndStudentOwnerId(id, accountId(auth)).orElseThrow(() -> notFound("Assessment not found.")));
    }
    public Assessment assessmentEntityForOwner(Long id, Authentication auth) {
        return assessments.findByIdAndStudentOwnerId(id, accountId(auth)).orElseThrow(() -> notFound("Assessment not found."));
    }
    public ReviewRecord updateReview(Long assessmentId, Long interactionId, Long sectionId, ReviewUpdateRequest request, Authentication auth) {
        var assessment=assessmentEntityForOwner(assessmentId, auth);
        var interaction=interactions.findById(interactionId).filter(i -> i.getAssessment().getId().equals(assessmentId)).orElseThrow(() -> notFound("AI interaction not found."));
        var section=sections.findById(sectionId).filter(s -> s.getAssessment().getId().equals(assessmentId)).orElseThrow(() -> notFound("Final-work section not found."));
        ReviewRecord.Status status;
        try { status=ReviewRecord.Status.valueOf(request.status().trim().toUpperCase(java.util.Locale.ROOT).replace(' ', '_')); }
        catch (IllegalArgumentException e) { throw new IllegalArgumentException("Choose Open, Flagged, or Reviewed."); }
        var record=reviews.findByAssessmentIdAndInteractionIdAndSectionId(assessmentId, interactionId, sectionId)
            .orElseGet(() -> new ReviewRecord(assessment, interaction, section));
        record.update(status, request.note());
        return reviews.save(record);
    }
    public ReviewRecord reviewFor(Long assessmentId, Long interactionId, Long sectionId, Authentication auth) {
        assessmentForOwner(assessmentId, auth);
        return reviews.findByAssessmentIdAndInteractionIdAndSectionId(assessmentId, interactionId, sectionId).orElse(null);
    }
    public List<ReviewRecord> reviewsFor(Long assessmentId, Authentication auth) {
        assessmentForOwner(assessmentId, auth); return reviews.findAllByAssessmentId(assessmentId);
    }
    private Long accountId(Authentication auth) { return owner(auth).getId(); }
    private com.example.aianalytics.security.Account owner(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return accounts.findByEmailIgnoreCase(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private AssessmentDto assessmentDto(Assessment a) {
        var student=a.getStudent();
        var status=reviews.findAllByAssessmentId(a.getId()).stream().anyMatch(r -> r.getStatus()==ReviewRecord.Status.FLAGGED) ? "Requires human review" :
            reviews.findAllByAssessmentId(a.getId()).stream().anyMatch(r -> r.getStatus()==ReviewRecord.Status.REVIEWED) ? "Reviewed" : "Open";
        return new AssessmentDto(a.getId(), student.getId(), a.getTitle(), a.getCourseCode(), a.getDueDate(), a.getLane(), student.getName(), student.getStudentNumber(), status);
    }
    private InteractionDto interactionDto(Interaction i) {
        var words=i.getContent().trim().isEmpty() ? 0 : i.getContent().trim().split("\\s+").length;
        return new InteractionDto(i.getId(), i.getSection()==null ? null : i.getSection().getId(), i.getType().name(), i.getTitle(), i.getContent(), i.getOccurredAt(), i.getModel(), words);
    }
    private SectionDto sectionDto(FinalWorkSection s) {
        var words=s.getContent().trim().isEmpty() ? 0 : s.getContent().trim().split("\\s+").length;
        return new SectionDto(s.getId(), s.getTitle(), s.getContent(), s.getPosition(), words);
    }
    private long count(List<Interaction> all, Interaction.Type type) { return all.stream().filter(i -> i.getType()==type).count(); }
    private ResponseStatusException notFound(String message) { return new ResponseStatusException(HttpStatus.NOT_FOUND, message); }
}
