package dev.andrew.repetitobackend.conversations.dto;

import dev.andrew.repetitobackend.conversations.model.ParticipantType;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StartConversationRequest {
    private Long targetUserId;
    private Long targetAccountId;
    private ParticipantType targetType;

    @Size(max = 2000)
    private String initialMessage;
}
