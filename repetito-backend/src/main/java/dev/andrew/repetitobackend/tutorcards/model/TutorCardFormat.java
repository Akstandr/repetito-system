package dev.andrew.repetitobackend.tutorcards.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TutorCardFormat {
    ONLINE,
    OFFLINE,
    MIXED;

    @JsonCreator
    public static TutorCardFormat fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return TutorCardFormat.valueOf(value.trim().toUpperCase());
    }

    @JsonValue
    public String toFrontendValue() {
        return name().toLowerCase();
    }
}
