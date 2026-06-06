package dev.andrew.repetitobackend.tutorcards.dto;

import dev.andrew.repetitobackend.tutorcards.model.TutorCardFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;

@Data
public class TutorCardRequest {

    @NotBlank
    private String title;

    private String description;

    @NotBlank
    private String subject;

    @NotNull
    @Positive
    private BigDecimal pricePerLesson;

    private TutorCardFormat format;

    private Boolean isActive;

    private Set<Integer> supportedGrades;
}
