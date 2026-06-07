package dev.andrew.repetitobackend.applications.repository;

import dev.andrew.repetitobackend.applications.model.TutorApplication;
import dev.andrew.repetitobackend.applications.model.ApplicationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TutorApplicationRepository extends JpaRepository<TutorApplication, Long> {

    @EntityGraph(attributePaths = {
            "tutorCard",
            "tutorCard.tutorAccount",
            "tutorCard.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user",
            "conversation"
    })
    List<TutorApplication> findByStudentAccountIdOrderByCreatedAtDesc(Long studentAccountId);

    @EntityGraph(attributePaths = {
            "tutorCard",
            "tutorCard.tutorAccount",
            "tutorCard.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user",
            "conversation"
    })
    List<TutorApplication> findByTutorAccountIdOrderByCreatedAtDesc(Long tutorAccountId);

    @EntityGraph(attributePaths = {
            "tutorCard",
            "tutorCard.tutorAccount",
            "tutorCard.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user",
            "conversation"
    })
    Optional<TutorApplication> findByIdAndStudentAccountId(Long id, Long studentAccountId);

    @EntityGraph(attributePaths = {
            "tutorCard",
            "tutorCard.tutorAccount",
            "tutorCard.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user",
            "conversation"
    })
    Optional<TutorApplication> findByIdAndTutorAccountId(Long id, Long tutorAccountId);

    @EntityGraph(attributePaths = {
            "tutorCard",
            "tutorCard.tutorAccount",
            "tutorCard.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user",
            "conversation"
    })
    Optional<TutorApplication> findByStudentAccountIdAndTutorAccountIdAndStatus(Long studentAccountId, Long tutorAccountId, ApplicationStatus status);

    boolean existsByTutorCardId(Long tutorCardId);

    boolean existsByStudentAccountIdAndTutorAccountIdAndStatus(Long studentAccountId, Long tutorAccountId, ApplicationStatus status);
}
