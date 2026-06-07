package dev.andrew.repetitobackend.conversations.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContactTutorRequest {

    @NotNull
    private Long tutorAccountId;
}
