package dev.andrew.repetitobackend.applications.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApplicationRequest {

    @NotNull
    private Long tutorCardId;

    @Size(max = 1500)
    private String message;
}
