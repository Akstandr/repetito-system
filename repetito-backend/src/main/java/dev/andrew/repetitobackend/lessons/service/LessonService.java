package dev.andrew.repetitobackend.lessons.service;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.service.AccountService;
import dev.andrew.repetitobackend.applications.model.ApplicationStatus;
import dev.andrew.repetitobackend.applications.model.TutorApplication;
import dev.andrew.repetitobackend.applications.repository.TutorApplicationRepository;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.lessons.dto.LessonRequest;
import dev.andrew.repetitobackend.lessons.dto.LessonResponse;
import dev.andrew.repetitobackend.lessons.dto.LessonUpdateRequest;
import dev.andrew.repetitobackend.lessons.model.Lesson;
import dev.andrew.repetitobackend.lessons.model.LessonStatus;
import dev.andrew.repetitobackend.lessons.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final TutorApplicationRepository tutorApplicationRepository;
    private final AccountService accountService;

    @Transactional
    public LessonResponse create(AuthPrincipal principal, LessonRequest request) {
        Account tutorAccount = accountService.requireActiveAccount(principal, AccountType.TUTOR);
        TutorApplication application = tutorApplicationRepository.findByIdAndTutorAccountId(request.getApplicationId(), tutorAccount.getId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (application.getStatus() != ApplicationStatus.ACCEPTED) {
            throw new IllegalArgumentException("Application is not accepted");
        }
        if (!application.getStudentAccount().getId().equals(request.getStudentAccountId())) {
            throw new IllegalArgumentException("Student account does not match application");
        }
        if (request.getDurationMinutes() <= 0) {
            throw new IllegalArgumentException("Duration must be positive");
        }
        if (request.getPrice().signum() <= 0) {
            throw new IllegalArgumentException("Price must be positive");
        }

        String subject = application.getTutorCard().getSubject();
        String videoMeetingUrl = normalizeMeetingUrl(request.getVideoMeetingUrl());

        Lesson lesson = lessonRepository.save(Lesson.builder()
                .tutorAccount(tutorAccount)
                .studentAccount(application.getStudentAccount())
                .application(application)
                .subject(subject)
                .startDateTime(request.getStartDateTime())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .videoMeetingUrl(videoMeetingUrl)
                .status(LessonStatus.PLANNED)
                .build());

        return LessonResponse.from(lesson);
    }

    @Transactional(readOnly = true)
    public List<LessonResponse> getMyLessons(AuthPrincipal principal) {
        List<Lesson> lessons = lessonRepository.findByParticipantUserIdOrderByStartDateTimeAsc(principal.userId());
        return lessons.stream().map(LessonResponse::from).toList();
    }

    @Transactional
    public LessonResponse update(AuthPrincipal principal, Long lessonId, LessonUpdateRequest request) {
        Lesson lesson = requireTutorLesson(principal, lessonId);
        applyEditableFields(lesson, request.getStartDateTime(), request.getDurationMinutes(), request.getPrice(), request.getVideoMeetingUrl());
        lesson.setStatus(LessonStatus.PLANNED);
        return LessonResponse.from(lessonRepository.save(lesson));
    }

    @Transactional
    public LessonResponse cancel(AuthPrincipal principal, Long lessonId) {
        Lesson lesson = requireTutorLesson(principal, lessonId);
        lesson.setStatus(LessonStatus.CANCELLED);
        return LessonResponse.from(lessonRepository.save(lesson));
    }

    private Lesson requireTutorLesson(AuthPrincipal principal, Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));
        if (!lesson.getTutorAccount().getUser().getId().equals(principal.userId())) {
            throw new IllegalArgumentException("Lesson not found");
        }
        return lesson;
    }

    private void applyEditableFields(
            Lesson lesson,
            java.time.Instant startDateTime,
            Integer durationMinutes,
            java.math.BigDecimal price,
            String videoMeetingUrl
    ) {
        if (durationMinutes <= 0) {
            throw new IllegalArgumentException("Duration must be positive");
        }
        if (price.signum() <= 0) {
            throw new IllegalArgumentException("Price must be positive");
        }

        lesson.setStartDateTime(startDateTime);
        lesson.setDurationMinutes(durationMinutes);
        lesson.setPrice(price);
        lesson.setVideoMeetingUrl(normalizeMeetingUrl(videoMeetingUrl));
    }

    private String normalizeMeetingUrl(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Meeting URL is required");
        }

        String trimmed = value.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            throw new IllegalArgumentException("Meeting URL must start with http:// or https://");
        }
        return trimmed;
    }
}
