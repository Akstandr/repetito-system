package dev.andrew.repetitobackend.accounts.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PublicProfileSettingsRequest {

    @NotNull
    private Boolean publicProfile;
}
