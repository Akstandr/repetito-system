package dev.andrew.repetitobackend.accounts.dto;

import dev.andrew.repetitobackend.accounts.model.TutorProfile;

import java.math.BigDecimal;

public record TutorProfileResponse(
        String description,
        String subjects,
        String experience,
        BigDecimal price,
        String education,
        String achievements
) {
    public static TutorProfileResponse from(TutorProfile profile) {
        if (profile == null) {
            return null;
        }
        return new TutorProfileResponse(
                profile.getDescription(),
                profile.getSubjects(),
                profile.getExperience(),
                profile.getPrice(),
                profile.getEducation(),
                profile.getAchievements()
        );
    }
}
