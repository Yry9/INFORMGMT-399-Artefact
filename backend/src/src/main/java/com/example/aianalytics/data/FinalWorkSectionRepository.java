package com.example.aianalytics.data;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface FinalWorkSectionRepository extends JpaRepository<FinalWorkSection,Long> {
    List<FinalWorkSection> findAllByAssessmentIdOrderByPositionAscIdAsc(Long assessmentId);
}
