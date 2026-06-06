package dev.andrew.repetitobackend.users.dto;

import dev.andrew.repetitobackend.accounts.dto.AccountResponse;
import dev.andrew.repetitobackend.accounts.dto.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private UserResponse user;
    private List<AccountResponse> accounts;
    private AccountResponse activeAccount;
    private boolean requiresAccountSelection;
}
