package dev.andrew.repetitobackend.lessons.repository;

import dev.andrew.repetitobackend.lessons.model.Lesson;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    @EntityGraph(attributePaths = {
            "tutorAccount",
            "tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "application",
            "application.tutorCard",
            "application.tutorCard.tutorAccount",
            "application.tutorCard.tutorAccount.user"
    })
    List<Lesson> findByStudentAccountIdOrderByStartDateTimeDesc(Long studentAccountId);

    @EntityGraph(attributePaths = {
            "tutorAccount",
            "tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "application",
            "application.tutorCard",
            "application.tutorCard.tutorAccount",
            "application.tutorCard.tutorAccount.user"
    })
    List<Lesson> findByTutorAccountIdOrderByStartDateTimeDesc(Long tutorAccountId);

    @EntityGraph(attributePaths = {
            "tutorAccount",
            "tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "application",
            "application.tutorCard",
            "application.tutorCard.tutorAccount",
            "application.tutorCard.tutorAccount.user"
    })
    @Query("""
            select distinct lesson from Lesson lesson
            where lesson.studentAccount.user.id = :userId
               or lesson.tutorAccount.user.id = :userId
            order by lesson.startDateTime asc
            """)
    List<Lesson> findByParticipantUserIdOrderByStartDateTimeAsc(@Param("userId") Long userId);

    boolean existsByApplicationId(Long applicationId);

    boolean existsByApplication_TutorCard_Id(Long tutorCardId);

    long countByStudentAccountId(Long studentAccountId);

    long countByTutorAccountId(Long tutorAccountId);
}
