package dev.andrew.repetitobackend.accounts.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    private Long accountId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(columnDefinition = "text")
    private String description;

    @Column(columnDefinition = "text")
    private String subjects;

    @Column(name = "grade_level")
    private String gradeLevel;

    @Column(columnDefinition = "text")
    private String format;
}
