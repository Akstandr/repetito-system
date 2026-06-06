package dev.andrew.repetitobackend.accounts.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tutor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorProfile {

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

    @Column(columnDefinition = "text")
    private String experience;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(columnDefinition = "text")
    private String education;

    @Column(columnDefinition = "text")
    private String achievements;
}
