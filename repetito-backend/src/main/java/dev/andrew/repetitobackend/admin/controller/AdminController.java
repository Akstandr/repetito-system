package dev.andrew.repetitobackend.admin.controller;

import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.admin.dto.AdminDtos;
import dev.andrew.repetitobackend.admin.service.AdminService;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.tutorapplications.dto.RejectModerationRequest;
import dev.andrew.repetitobackend.tutorapplications.dto.TutorAccountApplicationResponse;
import dev.andrew.repetitobackend.tutorapplications.model.TutorAccountApplicationStatus;
import dev.andrew.repetitobackend.tutorapplications.service.TutorAccountApplicationService;
import dev.andrew.repetitobackend.tutorcards.model.TutorCardModerationStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final TutorAccountApplicationService tutorAccountApplicationService;

    @GetMapping("/tutor-account-applications")
    public AdminDtos.PageResponse<TutorAccountApplicationResponse> tutorAccountApplications(
            @RequestParam(required = false) TutorAccountApplicationStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return tutorAccountApplicationService.adminList(status, page, limit);
    }

    @PatchMapping("/tutor-account-applications/{id}/approve")
    public TutorAccountApplicationResponse approveTutorAccountApplication(Authentication authentication, @PathVariable Long id) {
        return tutorAccountApplicationService.approve((AuthPrincipal) authentication.getPrincipal(), id);
    }

    @PatchMapping("/tutor-account-applications/{id}/reject")
    public TutorAccountApplicationResponse rejectTutorAccountApplication(
            Authentication authentication, @PathVariable Long id, @Valid @RequestBody RejectModerationRequest request
    ) {
        return tutorAccountApplicationService.reject((AuthPrincipal) authentication.getPrincipal(), id, request.getReason());
    }

    @GetMapping("/users")
    public AdminDtos.PageResponse<AdminDtos.UserItem> users(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return adminService.getUsers(query, page, limit);
    }

    @GetMapping("/accounts")
    public AdminDtos.PageResponse<AdminDtos.AccountItem> accounts(
            @RequestParam(required = false) AccountType type,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return adminService.getAccounts(type, page, limit);
    }

    @GetMapping("/tutors/{tutorAccountId}/students")
    public List<AdminDtos.RelationItem> tutorStudents(@PathVariable Long tutorAccountId) {
        return adminService.getTutorStudents(tutorAccountId);
    }

    @GetMapping("/students/{studentAccountId}/tutors")
    public List<AdminDtos.RelationItem> studentTutors(@PathVariable Long studentAccountId) {
        return adminService.getStudentTutors(studentAccountId);
    }

    @GetMapping("/tutor-cards")
    public AdminDtos.PageResponse<AdminDtos.TutorCardItem> tutorCards(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) TutorCardModerationStatus moderationStatus,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return adminService.getTutorCards(query, subject, active, moderationStatus, page, limit);
    }

    @GetMapping("/tutor-cards/{id}")
    public AdminDtos.TutorCardItem tutorCard(@PathVariable Long id) {
        return adminService.getTutorCard(id);
    }

    @DeleteMapping("/tutor-cards/{id}")
    public AdminDtos.TutorCardItem deactivateTutorCard(@PathVariable Long id) {
        return adminService.deactivateTutorCard(id);
    }

    @PatchMapping("/tutor-cards/{id}/approve")
    public AdminDtos.TutorCardItem approveTutorCard(Authentication authentication, @PathVariable Long id) {
        return adminService.approveTutorCard((AuthPrincipal) authentication.getPrincipal(), id);
    }

    @PatchMapping("/tutor-cards/{id}/reject")
    public AdminDtos.TutorCardItem rejectTutorCard(
            Authentication authentication, @PathVariable Long id, @Valid @RequestBody RejectModerationRequest request
    ) {
        return adminService.rejectTutorCard((AuthPrincipal) authentication.getPrincipal(), id, request.getReason());
    }
}
