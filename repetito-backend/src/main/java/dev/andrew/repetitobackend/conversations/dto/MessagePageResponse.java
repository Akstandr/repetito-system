package dev.andrew.repetitobackend.conversations.dto;

import java.util.List;

public record MessagePageResponse(
        List<MessageResponse> items,
        boolean hasMore,
        Long nextCursor
) {
}
