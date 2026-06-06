package dev.andrew.repetitobackend.applications.controller;

import dev.andrew.repetitobackend.applications.dto.ApplicationRequest;
import dev.andrew.repetitobackend.applications.dto.ApplicationResponse;
import dev.andrew.repetitobackend.applications.service.ApplicationService;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<ApplicationResponse> create(
            Authentication authentication,
            @Valid @RequestBody ApplicationRequest request
    ) {
        return ResponseEntity.ok(applicationService.create((AuthPrincipal) authentication.getPrincipal(), request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ApplicationResponse>> my(Authentication authentication) {
        return ResponseEntity.ok(applicationService.getMy((AuthPrincipal) authentication.getPrincipal()));
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<ApplicationResponse>> incoming(Authentication authentication) {
        return ResponseEntity.ok(applicationService.getIncoming((AuthPrincipal) authentication.getPrincipal()));
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<ApplicationResponse> accept(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(applicationService.accept((AuthPrincipal) authentication.getPrincipal(), id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApplicationResponse> reject(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(applicationService.reject((AuthPrincipal) authentication.getPrincipal(), id));
    }
}
