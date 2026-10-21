package com.example.aianalytics.data;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubmissionInviteRepository extends JpaRepository<SubmissionInvite, Long> {
    Optional<SubmissionInvite> findByTokenHashAndRevokedFalse(String tokenHash);
    List<SubmissionInvite> findAllByAssessmentIdAndRevokedFalse(Long assessmentId);
    Optional<SubmissionInvite> findFirstByAssessmentIdAndRevokedFalseOrderByCreatedAtDesc(Long assessmentId);
}
