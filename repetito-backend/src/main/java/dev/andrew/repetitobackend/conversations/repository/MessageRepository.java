package dev.andrew.repetitobackend.conversations.repository;

import dev.andrew.repetitobackend.conversations.model.Message;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @EntityGraph(attributePaths = {
            "conversation",
            "conversation.application",
            "senderAccount",
            "senderAccount.user"
    })
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    List<Message> findByConversation_IdAndSenderAccount_IdNotAndReadAtIsNull(Long conversationId, Long senderAccountId);

    long countByConversation_IdAndSenderAccount_IdNotAndReadAtIsNull(Long conversationId, Long senderAccountId);

    List<Message> findByConversation_IdAndSenderAccount_User_IdNotAndReadAtIsNull(Long conversationId, Long senderUserId);

    long countByConversation_IdAndSenderAccount_User_IdNotAndReadAtIsNull(Long conversationId, Long senderUserId);

    @EntityGraph(attributePaths = {
            "conversation",
            "conversation.application",
            "senderAccount",
            "senderAccount.user"
    })
    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
