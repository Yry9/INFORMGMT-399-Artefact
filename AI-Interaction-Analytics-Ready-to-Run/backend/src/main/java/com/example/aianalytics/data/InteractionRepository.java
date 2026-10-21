package com.example.aianalytics.data;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface InteractionRepository extends JpaRepository<Interaction,Long> {
    List<Interaction> findAllByAssessmentIdOrderByOccurredAtDesc(Long assessmentId);
    List<Interaction> findAllByAssessmentIdAndTypeOrderByOccurredAtDesc(Long assessmentId, Interaction.Type type);
}
