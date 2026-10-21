package com.example.aianalytics.data;

import com.example.aianalytics.common.ApiDtos.*;
import com.example.aianalytics.similarity.SimilarityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class WorkspaceController {
    private final WorkspaceService workspace;
    private final SimilarityService similarity;
    public WorkspaceController(WorkspaceService workspace, SimilarityService similarity) { this.workspace=workspace; this.similarity=similarity; }

    @GetMapping("/health") Map<String,String> health() { return Map.of("status", "ok", "service", "ai-interaction-analytics"); }
    @GetMapping("/students") List<StudentDto> students(Authentication auth) { return workspace.students(auth); }
    @PostMapping("/students") @ResponseStatus(HttpStatus.CREATED)
    StudentDto createStudent(@Valid @RequestBody CreateStudentRequest request, Authentication auth) { return workspace.createStudent(request, auth); }
    @GetMapping("/students/{studentId}/assessments")
    List<AssessmentDto> assessments(@PathVariable Long studentId, Authentication auth) { return workspace.assessments(studentId, auth); }
    @PostMapping("/assessments") @ResponseStatus(HttpStatus.CREATED)
    AssessmentDto createAssessment(@Valid @RequestBody CreateAssessmentRequest request, Authentication auth) { return workspace.createAssessment(request, auth); }
    @GetMapping("/assessments/{assessmentId}") AssessmentDto assessment(@PathVariable Long assessmentId, Authentication auth) { return workspace.assessment(assessmentId, auth); }
    @GetMapping("/assessments/{assessmentId}/summary") SummaryDto summary(@PathVariable Long assessmentId, Authentication auth) { return workspace.summary(assessmentId, auth); }
    @GetMapping("/assessments/{assessmentId}/interactions") List<InteractionDto> interactions(@PathVariable Long assessmentId, Authentication auth) { return workspace.interactions(assessmentId, auth); }
    @PostMapping("/assessments/{assessmentId}/interactions") @ResponseStatus(HttpStatus.CREATED)
    InteractionDto addInteraction(@PathVariable Long assessmentId, @Valid @RequestBody CreateInteractionRequest request, Authentication auth) { return workspace.addInteraction(assessmentId, request, auth); }
    @GetMapping("/assessments/{assessmentId}/sections") List<SectionDto> sections(@PathVariable Long assessmentId, Authentication auth) { return workspace.sections(assessmentId, auth); }
    @PostMapping("/assessments/{assessmentId}/sections") @ResponseStatus(HttpStatus.CREATED)
    SectionDto addSection(@PathVariable Long assessmentId, @Valid @RequestBody CreateSectionRequest request, Authentication auth) { return workspace.addSection(assessmentId, request, auth); }
    @GetMapping("/assessments/{assessmentId}/similarity")
    List<FindingDto> similarity(@PathVariable Long assessmentId, Authentication auth) { return similarity.calculate(assessmentId, auth); }
    @PutMapping("/assessments/{assessmentId}/reviews/{interactionId}/{sectionId}")
    FindingDto updateReview(@PathVariable Long assessmentId, @PathVariable Long interactionId, @PathVariable Long sectionId,
                            @Valid @RequestBody ReviewUpdateRequest request, Authentication auth) {
        var record=workspace.updateReview(assessmentId, interactionId, sectionId, request, auth);
        var result=similarity.calculate(assessmentId, auth).stream()
            .filter(f -> f.interactionId().equals(interactionId) && f.sectionId().equals(sectionId)).findFirst().orElseThrow();
        return result;
    }
}
