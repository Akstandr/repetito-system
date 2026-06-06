package dev.andrew.repetitobackend.accounts.dto;

import dev.andrew.repetitobackend.accounts.model.AccountType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SelectAccountRequest {

    @NotNull
    private AccountType type;
}
