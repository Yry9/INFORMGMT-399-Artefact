package com.example.aianalytics.data;

import com.example.aianalytics.common.ApiDtos.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class StudentSubmissionService {
    private final WorkspaceService workspace;
    private final SubmissionInviteRepository invites;
    private final InteractionRepository interactions;
    private final FinalWorkSectionRepository sections;
    private final SecureRandom random = new SecureRandom();

    public StudentSubmissionService(WorkspaceService workspace, SubmissionInviteRepository invites,
                                    InteractionRepository interactions, FinalWorkSectionRepository sections) {
        this.workspace = workspace;
        this.invites = invites;
        this.interactions = interactions;
        this.sections = sections;
    }

    @Transactional
    public SubmissionLinkDto createLink(Long assessmentId, Authentication auth) {
        var assessment = workspace.assessmentEntityForOwner(assessmentId, auth);
        invites.findAllByAssessmentIdAndRevokedFalse(assessmentId).forEach(SubmissionInvite::revoke);
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        invites.save(new SubmissionInvite(assessment, hash(token)));
        return new SubmissionLinkDto(token, assessment.getStudent().getName(), assessment.getTitle(), assessment.getCourseCode());
    }

    @Transactional(readOnly = true)
    public SubmissionStatusDto status(Long assessmentId, Authentication auth) {
        workspace.assessmentEntityForOwner(assessmentId, auth);
        var invite = invites.findFirstByAssessmentIdAndRevokedFalseOrderByCreatedAtDesc(assessmentId).orElse(null);
        return new SubmissionStatusDto(invite != null, invite != null && invite.getSubmittedAt() != null,
            invite == null ? null : invite.getSubmittedAt());
    }

    @Transactional(readOnly = true)
    public PublicSubmissionInfoDto publicInfo(String token) {
        var invite = activeInvite(token);
        var assessment = invite.getAssessment();
        return new PublicSubmissionInfoDto(assessment.getStudent().getName(), assessment.getStudent().getStudentNumber(),
            assessment.getTitle(), assessment.getCourseCode(), invite.getSubmittedAt() != null);
    }

    @Transactional
    public SubmissionResultDto submit(String token, StudentSubmissionRequest request) {
        var invite = activeInvite(token);
        if (invite.getSubmittedAt() != null) throw new ResponseStatusException(HttpStatus.CONFLICT, "This submission link has already been used. Ask your teacher for a new link if you need to submit again.");
        boolean usedAi = "USED".equals(request.aiUseDeclaration());
        if (usedAi && (request.aiOutput() == null || request.aiOutput().isBlank())) {
            throw new IllegalArgumentException("Please include at least one AI output, or select that you did not use AI.");
        }
        var assessment = invite.getAssessment();
        String prompt = clean(request.prompt());
        String output = clean(request.aiOutput());
        String revision = clean(request.revision());
        String reflection = clean(request.reflection());
        if (prompt != null) interactions.save(new Interaction(assessment, Interaction.Type.PROMPT, "Student-submitted prompt", prompt, null, null));
        if (usedAi && output != null) interactions.save(new Interaction(assessment, Interaction.Type.AI_OUTPUT, "Student-submitted AI output", output, clean(request.aiTool()), null));
        if (revision != null) interactions.save(new Interaction(assessment, Interaction.Type.REVISION, "Student-submitted revision", revision, null, null));
        String declaration = usedAi ? "Student declared that AI was used for this assessment." : "Student declared that AI was not used for this assessment.";
        String reflectionContent = reflection == null ? declaration : declaration + "\n\nStudent reflection:\n" + reflection;
        interactions.save(new Interaction(assessment, Interaction.Type.REFLECTION, "Student AI-use declaration and reflection", reflectionContent, null, null));
        int position = sections.findAllByAssessmentIdOrderByPositionAscIdAsc(assessment.getId()).size();
        sections.save(new FinalWorkSection(assessment, "Student-submitted final work", request.finalWork(), position));
        invite.markSubmitted();
        return new SubmissionResultDto(assessment.getStudent().getName(), assessment.getTitle(), Instant.now());
    }

    private SubmissionInvite activeInvite(String token) {
        if (token == null || token.isBlank() || token.length() > 100) throw invalidLink();
        return invites.findByTokenHashAndRevokedFalse(hash(token)).orElseThrow(this::invalidLink);
    }

    private String hash(String value) {
        try {
            var digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("Could not create submission link.", exception);
        }
    }

    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private ResponseStatusException invalidLink() { return new ResponseStatusException(HttpStatus.NOT_FOUND, "This submission link is invalid or has been replaced."); }
}
