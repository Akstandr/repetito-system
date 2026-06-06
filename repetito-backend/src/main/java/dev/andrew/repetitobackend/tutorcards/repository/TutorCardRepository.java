package dev.andrew.repetitobackend.tutorcards.repository;

import dev.andrew.repetitobackend.tutorcards.model.TutorCard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TutorCardRepository extends JpaRepository<TutorCard, Long> {

    @EntityGraph(attributePaths = {"tutorAccount", "tutorAccount.user", "supportedGrades"})
    @Query(
            value = """
                    select distinct card from TutorCard card
                    left join card.supportedGrades grade
                    where card.isActive = true
                      and (:subject is null or lower(card.subject) = :subject)
                      and (:grade is null or grade = :grade)
                    """,
            countQuery = """
                    select count(distinct card) from TutorCard card
                    left join card.supportedGrades grade
                    where card.isActive = true
                      and (:subject is null or lower(card.subject) = :subject)
                      and (:grade is null or grade = :grade)
                    """
    )
    Page<TutorCard> searchActiveCards(@Param("subject") String subject, @Param("grade") Integer grade, Pageable pageable);

    @EntityGraph(attributePaths = {"tutorAccount", "tutorAccount.user"})
    List<TutorCard> findByTutorAccountIdOrderByCreatedAtDesc(Long tutorAccountId);

    @EntityGraph(attributePaths = {"tutorAccount", "tutorAccount.user", "supportedGrades"})
    Optional<TutorCard> findByIdAndTutorAccountId(Long id, Long tutorAccountId);

    boolean existsByIdAndTutorAccountId(Long id, Long tutorAccountId);

    boolean existsByTutorAccountIdAndTitle(Long tutorAccountId, String title);

    @EntityGraph(attributePaths = {"tutorAccount", "tutorAccount.user", "supportedGrades"})
    Optional<TutorCard> findById(Long id);
}
