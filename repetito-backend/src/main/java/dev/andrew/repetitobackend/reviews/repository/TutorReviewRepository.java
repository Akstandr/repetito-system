package dev.andrew.repetitobackend.reviews.repository;

import dev.andrew.repetitobackend.reviews.model.TutorReview;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TutorReviewRepository extends JpaRepository<TutorReview, Long> {

    @EntityGraph(attributePaths = {
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user"
    })
    List<TutorReview> findByStudentAccountUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user"
    })
    List<TutorReview> findByTutorAccountUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user"
    })
    List<TutorReview> findByTutorAccountIdOrderByCreatedAtDesc(Long tutorAccountId);

    @EntityGraph(attributePaths = {
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user"
    })
    Optional<TutorReview> findByStudentAccountIdAndTutorAccountId(Long studentAccountId, Long tutorAccountId);
}
