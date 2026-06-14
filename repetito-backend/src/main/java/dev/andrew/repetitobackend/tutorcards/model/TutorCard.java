package dev.andrew.repetitobackend.tutorcards.model;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.users.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "tutor_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tutor_account_id", nullable = false)
    private Account tutorAccount;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String subject;

    @Column(name = "price_per_lesson", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerLesson;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "tutor_card_supported_grades", joinColumns = @JoinColumn(name = "tutor_card_id"))
    @Column(name = "grade", nullable = false)
    @Builder.Default
    private Set<Integer> supportedGrades = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TutorCardFormat format;

    @Column(nullable = false)
    private boolean isActive;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status", nullable = false)
    private TutorCardModerationStatus moderationStatus;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_admin_id")
    private User reviewedByAdmin;

    private Instant reviewedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (moderationStatus == null) moderationStatus = TutorCardModerationStatus.PENDING_MODERATION;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
