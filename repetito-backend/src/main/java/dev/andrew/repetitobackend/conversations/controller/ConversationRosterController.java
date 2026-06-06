package dev.andrew.repetitobackend.conversations.controller;

import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.conversations.dto.StudentTutorResponse;
import dev.andrew.repetitobackend.conversations.dto.TutorStudentResponse;
import dev.andrew.repetitobackend.conversations.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ConversationRosterController {

    private final ConversationService conversationService;

    @GetMapping("/api/tutor/students")
    public ResponseEntity<List<TutorStudentResponse>> tutorStudents(Authentication authentication) {
        return ResponseEntity.ok(conversationService.getTutorStudents((AuthPrincipal) authentication.getPrincipal()));
    }

    @GetMapping("/api/student/tutors")
    public ResponseEntity<List<StudentTutorResponse>> studentTutors(Authentication authentication) {
        return ResponseEntity.ok(conversationService.getStudentTutors((AuthPrincipal) authentication.getPrincipal()));
    }
}
