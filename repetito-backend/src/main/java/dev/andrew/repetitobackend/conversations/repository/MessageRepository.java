package dev.andrew.repetitobackend.conversations.repository;

import dev.andrew.repetitobackend.conversations.model.Message;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @EntityGraph(attributePaths = {"conversation", "senderAccount", "senderUser"})
    List<Message> findByConversationIdOrderByIdDesc(Long conversationId, Pageable pageable);

    @EntityGraph(attributePaths = {"conversation", "senderAccount", "senderUser"})
    List<Message> findByConversationIdAndIdLessThanOrderByIdDesc(Long conversationId, Long beforeMessageId, Pageable pageable);

    List<Message> findByConversation_IdAndSenderUser_IdNotAndReadAtIsNull(Long conversationId, Long senderUserId);

    long countByConversation_IdAndSenderUser_IdNotAndReadAtIsNull(Long conversationId, Long senderUserId);

    @EntityGraph(attributePaths = {"conversation", "senderAccount", "senderUser"})
    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
