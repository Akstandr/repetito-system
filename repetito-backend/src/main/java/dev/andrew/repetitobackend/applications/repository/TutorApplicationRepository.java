package dev.andrew.repetitobackend.applications.repository;

import dev.andrew.repetitobackend.applications.model.TutorApplication;
import dev.andrew.repetitobackend.applications.model.ApplicationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    long countByStudentAccountId(Long studentAccountId);

    long countByTutorAccountId(Long tutorAccountId);

    @Query("select count(distinct application.tutorAccount.id) from TutorApplication application where application.studentAccount.id = :accountId and application.status = :status")
    long countDistinctTutors(@Param("accountId") Long accountId, @Param("status") ApplicationStatus status);

    @Query("select count(distinct application.studentAccount.id) from TutorApplication application where application.tutorAccount.id = :accountId and application.status = :status")
    long countDistinctStudents(@Param("accountId") Long accountId, @Param("status") ApplicationStatus status);

    @EntityGraph(attributePaths = {"studentAccount", "studentAccount.user", "tutorCard"})
    List<TutorApplication> findByTutorAccountIdAndStatusOrderByUpdatedAtDesc(Long tutorAccountId, ApplicationStatus status);

    @EntityGraph(attributePaths = {"tutorAccount", "tutorAccount.user", "tutorCard"})
    List<TutorApplication> findByStudentAccountIdAndStatusOrderByUpdatedAtDesc(Long studentAccountId, ApplicationStatus status);
}
