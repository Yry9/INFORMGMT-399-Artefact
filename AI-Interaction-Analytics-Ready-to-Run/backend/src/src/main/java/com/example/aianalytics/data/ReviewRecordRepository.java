package com.example.aianalytics.data;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ReviewRecordRepository extends JpaRepository<ReviewRecord,Long> {
    Optional<ReviewRecord> findByAssessmentIdAndInteractionIdAndSectionId(Long assessmentId, Long interactionId, Long sectionId);
    List<ReviewRecord> findAllByAssessmentId(Long assessmentId);
}
