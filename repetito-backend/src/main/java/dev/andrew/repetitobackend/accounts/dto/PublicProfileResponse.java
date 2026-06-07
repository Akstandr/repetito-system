package dev.andrew.repetitobackend.accounts.dto;

import dev.andrew.repetitobackend.reviews.dto.ReviewResponse;
import dev.andrew.repetitobackend.tutorcards.dto.TutorCardResponse;

import java.util.List;

public record PublicProfileResponse(
        PublicUserResponse user,
        List<PublicAccountResponse> accounts,
        List<TutorCardResponse> tutorCards,
        List<ReviewResponse> reviews
) {
}
