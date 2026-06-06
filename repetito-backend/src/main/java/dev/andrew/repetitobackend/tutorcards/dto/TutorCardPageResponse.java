package dev.andrew.repetitobackend.tutorcards.dto;

import java.util.List;

public record TutorCardPageResponse(
        List<TutorCardResponse> items,
        int page,
        int limit,
        long total,
        int totalPages
) {
}
