package dev.andrew.repetitobackend.conversations.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MessageRequest {

    @NotBlank
    @Size(max = 2000)
    private String text;
}
