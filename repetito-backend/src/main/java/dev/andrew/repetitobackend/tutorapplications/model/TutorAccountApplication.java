package dev.andrew.repetitobackend.tutorapplications.model;

import dev.andrew.repetitobackend.users.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "tutor_account_applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TutorAccountApplication {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private Integer age;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "tutor_account_application_subjects", joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "subject", nullable = false)
    @Builder.Default
    private Set<String> subjects = new LinkedHashSet<>();

    @Column(name = "price_per_lesson", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerLesson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TutorAccountApplicationStatus status;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_admin_id")
    private User reviewedByAdmin;

    private Instant reviewedAt;
    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist void onCreate() {
        Instant now = Instant.now();
        if (status == null) status = TutorAccountApplicationStatus.PENDING;
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
}
