package dev.andrew.repetitobackend.accounts.dto;

import dev.andrew.repetitobackend.accounts.model.StudentProfile;

public record StudentProfileResponse(
        String description,
        String subjects,
        String gradeLevel,
        String format
) {
    public static StudentProfileResponse from(StudentProfile profile) {
        if (profile == null) {
            return null;
        }
        return new StudentProfileResponse(
                profile.getDescription(),
                profile.getSubjects(),
                profile.getGradeLevel(),
                profile.getFormat()
        );
    }
}
