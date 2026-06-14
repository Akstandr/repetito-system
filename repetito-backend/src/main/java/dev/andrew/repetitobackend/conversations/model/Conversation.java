package dev.andrew.repetitobackend.conversations.model;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.applications.model.TutorApplication;
import dev.andrew.repetitobackend.users.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", unique = true)
    private TutorApplication application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_account_id")
    private Account studentAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_account_id")
    private Account tutorAccount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_a_user_id", nullable = false)
    private User participantAUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_a_account_id")
    private Account participantAAccount;

    @Enumerated(EnumType.STRING)
    @Column(name = "participant_a_type", nullable = false)
    private ParticipantType participantAType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_b_user_id", nullable = false)
    private User participantBUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_b_account_id")
    private Account participantBAccount;

    @Enumerated(EnumType.STRING)
    @Column(name = "participant_b_type", nullable = false)
    private ParticipantType participantBType;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
