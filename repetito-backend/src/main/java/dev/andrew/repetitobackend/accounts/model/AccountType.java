package dev.andrew.repetitobackend.accounts.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum AccountType {
    STUDENT,
    TUTOR;

    @JsonCreator
    public static AccountType fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return AccountType.valueOf(value.trim().toUpperCase());
    }

    @JsonValue
    public String toFrontendValue() {
        return name().toLowerCase();
    }
}
