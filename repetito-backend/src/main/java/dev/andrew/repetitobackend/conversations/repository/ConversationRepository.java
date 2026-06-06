package dev.andrew.repetitobackend.conversations.repository;

import dev.andrew.repetitobackend.conversations.model.Conversation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @EntityGraph(attributePaths = {
            "application",
            "application.tutorCard",
            "application.tutorCard.tutorAccount",
            "application.tutorCard.tutorAccount.user",
            "application.studentAccount",
            "application.studentAccount.user",
            "application.tutorAccount",
            "application.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user"
    })
    Optional<Conversation> findByApplicationId(Long applicationId);

    @EntityGraph(attributePaths = {
            "application",
            "application.tutorCard",
            "application.tutorCard.tutorAccount",
            "application.tutorCard.tutorAccount.user",
            "application.studentAccount",
            "application.studentAccount.user",
            "application.tutorAccount",
            "application.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user"
    })
    List<Conversation> findByStudentAccountIdOrderByCreatedAtDesc(Long studentAccountId);

    @EntityGraph(attributePaths = {
            "application",
            "application.tutorCard",
            "application.tutorCard.tutorAccount",
            "application.tutorCard.tutorAccount.user",
            "application.studentAccount",
            "application.studentAccount.user",
            "application.tutorAccount",
            "application.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user"
    })
    List<Conversation> findByTutorAccountIdOrderByCreatedAtDesc(Long tutorAccountId);

    @EntityGraph(attributePaths = {
            "application",
            "application.tutorCard",
            "application.tutorCard.tutorAccount",
            "application.tutorCard.tutorAccount.user",
            "application.studentAccount",
            "application.studentAccount.user",
            "application.tutorAccount",
            "application.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user"
    })
    @Query("""
            select distinct conversation from Conversation conversation
            where conversation.studentAccount.user.id = :userId
               or conversation.tutorAccount.user.id = :userId
            order by conversation.createdAt desc
            """)
    List<Conversation> findByParticipantUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {
            "application",
            "application.tutorCard",
            "application.tutorCard.tutorAccount",
            "application.tutorCard.tutorAccount.user",
            "application.studentAccount",
            "application.studentAccount.user",
            "application.tutorAccount",
            "application.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user"
    })
    List<Conversation> findByTutorAccount_User_IdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {
            "application",
            "application.tutorCard",
            "application.tutorCard.tutorAccount",
            "application.tutorCard.tutorAccount.user",
            "application.studentAccount",
            "application.studentAccount.user",
            "application.tutorAccount",
            "application.tutorAccount.user",
            "studentAccount",
            "studentAccount.user",
            "tutorAccount",
            "tutorAccount.user"
    })
    List<Conversation> findByStudentAccount_User_IdOrderByCreatedAtDesc(Long userId);
}
