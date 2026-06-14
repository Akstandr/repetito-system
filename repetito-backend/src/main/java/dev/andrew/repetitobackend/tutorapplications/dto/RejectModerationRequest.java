package dev.andrew.repetitobackend.tutorapplications.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectModerationRequest {
    @NotBlank @Size(max = 2000)
    private String reason;
}
