package dev.andrew.repetitobackend.tutorapplications.repository;

import dev.andrew.repetitobackend.tutorapplications.model.TutorAccountApplication;
import dev.andrew.repetitobackend.tutorapplications.model.TutorAccountApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TutorAccountApplicationRepository extends JpaRepository<TutorAccountApplication, Long> {
    boolean existsByUserIdAndStatus(Long userId, TutorAccountApplicationStatus status);

    @EntityGraph(attributePaths = {"user", "reviewedByAdmin", "subjects"})
    List<TutorAccountApplication> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user", "reviewedByAdmin", "subjects"})
    Page<TutorAccountApplication> findByStatus(TutorAccountApplicationStatus status, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"user", "reviewedByAdmin", "subjects"})
    Page<TutorAccountApplication> findAll(Pageable pageable);
}
