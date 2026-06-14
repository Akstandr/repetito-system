package dev.andrew.repetitobackend.tutorapplications.controller;

import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.tutorapplications.dto.TutorAccountApplicationRequest;
import dev.andrew.repetitobackend.tutorapplications.dto.TutorAccountApplicationResponse;
import dev.andrew.repetitobackend.tutorapplications.service.TutorAccountApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tutor-account-applications")
@RequiredArgsConstructor
public class TutorAccountApplicationController {
    private final TutorAccountApplicationService service;

    @PostMapping
    public TutorAccountApplicationResponse create(Authentication authentication, @Valid @RequestBody TutorAccountApplicationRequest request) {
        return service.create((AuthPrincipal) authentication.getPrincipal(), request);
    }

    @GetMapping("/my")
    public List<TutorAccountApplicationResponse> my(Authentication authentication) {
        return service.my((AuthPrincipal) authentication.getPrincipal());
    }
}
