package dev.andrew.repetitobackend.conversations.dto;

import dev.andrew.repetitobackend.conversations.model.Message;

import java.time.Instant;

public record MessageResponse(
        Long id,
        Long conversationId,
        Long senderAccountId,
        String senderFirstName,
        String senderLastName,
        String senderType,
        String text,
        Instant readAt,
        Instant createdAt
) {
    public static MessageResponse from(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSenderAccount().getId(),
                message.getSenderAccount().getUser().getFirstName(),
                message.getSenderAccount().getUser().getLastName(),
                message.getSenderAccount().getType().toFrontendValue(),
                message.getText(),
                message.getReadAt(),
                message.getCreatedAt()
        );
    }
}
