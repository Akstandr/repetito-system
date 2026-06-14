package dev.andrew.repetitobackend.common.security;

import dev.andrew.repetitobackend.accounts.model.AccountType;

public record AuthPrincipal(
        Long userId,
        Long activeAccountId,
        AccountType accountType,
        String email,
        String firstName,
        String lastName,
        boolean admin
) {
    public boolean hasActiveAccount() {
        return activeAccountId != null && accountType != null;
    }
}
