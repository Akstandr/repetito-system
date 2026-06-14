package dev.andrew.repetitobackend.tutorapplications.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class TutorAccountApplicationRequest {
    @NotBlank @Size(max = 255)
    private String fullName;
    @NotNull @Min(18) @Max(100)
    private Integer age;
    @NotEmpty
    private List<@NotBlank @Size(max = 255) String> subjects;
    @NotNull @DecimalMin(value = "1.00")
    private BigDecimal pricePerLesson;
}
