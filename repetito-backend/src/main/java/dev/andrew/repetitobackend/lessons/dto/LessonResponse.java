package dev.andrew.repetitobackend.lessons.dto;

import dev.andrew.repetitobackend.lessons.model.Lesson;
import dev.andrew.repetitobackend.lessons.model.LessonStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record LessonResponse(
        Long id,
        Long tutorAccountId,
        Long studentAccountId,
        Long applicationId,
        String tutorCardTitle,
        String studentFirstName,
        String studentLastName,
        String tutorFirstName,
        String tutorLastName,
        String subject,
        Instant startDateTime,
        Integer durationMinutes,
        BigDecimal price,
        String videoMeetingUrl,
        LessonStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static LessonResponse from(Lesson lesson) {
        return new LessonResponse(
                lesson.getId(),
                lesson.getTutorAccount().getId(),
                lesson.getStudentAccount().getId(),
                lesson.getApplication().getId(),
                lesson.getApplication().getTutorCard().getTitle(),
                lesson.getStudentAccount().getUser().getFirstName(),
                lesson.getStudentAccount().getUser().getLastName(),
                lesson.getTutorAccount().getUser().getFirstName(),
                lesson.getTutorAccount().getUser().getLastName(),
                lesson.getSubject(),
                lesson.getStartDateTime(),
                lesson.getDurationMinutes(),
                lesson.getPrice(),
                lesson.getVideoMeetingUrl(),
                lesson.getStatus(),
                lesson.getCreatedAt(),
                lesson.getUpdatedAt()
        );
    }
}
