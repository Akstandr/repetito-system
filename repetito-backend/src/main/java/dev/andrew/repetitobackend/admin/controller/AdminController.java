package dev.andrew.repetitobackend.admin.controller;

import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.admin.dto.AdminDtos;
import dev.andrew.repetitobackend.admin.service.AdminService;
import lombok.RequiredArgsConstructor;
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
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return adminService.getTutorCards(query, subject, active, page, limit);
    }

    @GetMapping("/tutor-cards/{id}")
    public AdminDtos.TutorCardItem tutorCard(@PathVariable Long id) {
        return adminService.getTutorCard(id);
    }

    @DeleteMapping("/tutor-cards/{id}")
    public AdminDtos.TutorCardItem deactivateTutorCard(@PathVariable Long id) {
        return adminService.deactivateTutorCard(id);
    }
}
