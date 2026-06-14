package dev.andrew.repetitobackend.conversations.repository;

import dev.andrew.repetitobackend.conversations.model.Conversation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @EntityGraph(attributePaths = {"application", "application.tutorCard", "participantAUser", "participantAAccount", "participantBUser", "participantBAccount", "studentAccount", "tutorAccount"})
    Optional<Conversation> findByApplicationId(Long applicationId);

    @EntityGraph(attributePaths = {"application", "application.tutorCard", "participantAUser", "participantAAccount", "participantBUser", "participantBAccount", "studentAccount", "tutorAccount"})
    @Query("""
            select conversation from Conversation conversation
            where conversation.participantAUser.id = :userId
               or conversation.participantBUser.id = :userId
            order by conversation.updatedAt desc
            """)
    List<Conversation> findByParticipantUserIdOrderByUpdatedAtDesc(@Param("userId") Long userId);
}
