package com.example.aianalytics.data;

import com.example.aianalytics.common.ApiDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StudentSubmissionController {
    private final StudentSubmissionService submissions;
    public StudentSubmissionController(StudentSubmissionService submissions) { this.submissions = submissions; }

    @PostMapping("/assessments/{assessmentId}/submission-link")
    @ResponseStatus(HttpStatus.CREATED)
    SubmissionLinkDto createLink(@PathVariable Long assessmentId, Authentication auth) {
        return submissions.createLink(assessmentId, auth);
    }

    @GetMapping("/assessments/{assessmentId}/submission-status")
    SubmissionStatusDto status(@PathVariable Long assessmentId, Authentication auth) {
        return submissions.status(assessmentId, auth);
    }

    @GetMapping("/public/submissions/{token}")
    PublicSubmissionInfoDto info(@PathVariable String token) { return submissions.publicInfo(token); }

    @PostMapping("/public/submissions/{token}")
    @ResponseStatus(HttpStatus.CREATED)
    SubmissionResultDto submit(@PathVariable String token, @Valid @RequestBody StudentSubmissionRequest request) {
        return submissions.submit(token, request);
    }
}
