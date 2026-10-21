package com.example.aianalytics.data;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface StudentRepository extends JpaRepository<Student,Long> {
    List<Student> findAllByOwnerIdOrderByNameAsc(Long ownerId);
    Optional<Student> findByIdAndOwnerId(Long id, Long ownerId);
}
