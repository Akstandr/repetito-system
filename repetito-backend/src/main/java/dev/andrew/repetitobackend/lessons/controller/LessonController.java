package dev.andrew.repetitobackend.lessons.controller;

import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.lessons.dto.LessonRequest;
import dev.andrew.repetitobackend.lessons.dto.LessonResponse;
import dev.andrew.repetitobackend.lessons.dto.LessonUpdateRequest;
import dev.andrew.repetitobackend.lessons.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessonService;

    @PostMapping
    public ResponseEntity<LessonResponse> create(
            Authentication authentication,
            @Valid @RequestBody LessonRequest request
    ) {
        return ResponseEntity.ok(lessonService.create((AuthPrincipal) authentication.getPrincipal(), request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<LessonResponse>> my(Authentication authentication) {
        return ResponseEntity.ok(lessonService.getMyLessons((AuthPrincipal) authentication.getPrincipal()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<LessonResponse> update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody LessonUpdateRequest request
    ) {
        return ResponseEntity.ok(lessonService.update((AuthPrincipal) authentication.getPrincipal(), id, request));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<LessonResponse> cancel(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(lessonService.cancel((AuthPrincipal) authentication.getPrincipal(), id));
    }
}
