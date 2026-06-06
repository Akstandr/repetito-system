package dev.andrew.repetitobackend.accounts.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TutorProfileRequest {

    @Size(max = 4000)
    private String description;
    private String subjects;
    @Size(max = 100)
    private String experience;
    private BigDecimal price;
    private String education;
    private String achievements;
}
