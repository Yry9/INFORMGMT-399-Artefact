package com.example.aianalytics.data;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface AssessmentRepository extends JpaRepository<Assessment,Long> {
    List<Assessment> findAllByStudentIdAndStudentOwnerIdOrderByTitleAsc(Long studentId, Long ownerId);
    List<Assessment> findAllByStudentOwnerIdOrderByCreatedAtDesc(Long ownerId);
    Optional<Assessment> findByIdAndStudentOwnerId(Long id, Long ownerId);
}
