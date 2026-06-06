package dev.andrew.repetitobackend.subjects.dto;

import dev.andrew.repetitobackend.subjects.model.SubjectCatalog;

public record SubjectResponse(
        String value,
        String label
) {
    public static SubjectResponse from(SubjectCatalog subject) {
        return new SubjectResponse(subject.getCode(), subject.getTitle());
    }
}
