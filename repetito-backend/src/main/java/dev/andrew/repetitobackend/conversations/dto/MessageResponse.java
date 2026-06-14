package dev.andrew.repetitobackend.conversations.dto;

import dev.andrew.repetitobackend.conversations.model.Message;
import dev.andrew.repetitobackend.conversations.model.ParticipantType;

import java.time.Instant;

public record MessageResponse(
        Long id,
        Long conversationId,
        Long senderUserId,
        Long senderAccountId,
        String senderFirstName,
        String senderLastName,
        ParticipantType senderType,
        String text,
        Instant readAt,
        Instant createdAt
) {
    public static MessageResponse from(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSenderUser().getId(),
                message.getSenderAccount() == null ? null : message.getSenderAccount().getId(),
                message.getSenderUser().getFirstName(),
                message.getSenderUser().getLastName(),
                message.getSenderType(),
                message.getText(),
                message.getReadAt(),
                message.getCreatedAt()
        );
    }
}
