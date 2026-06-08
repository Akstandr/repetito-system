package dev.andrew.repetitobackend.lessons.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class LessonUpdateRequest {

    @NotNull
    @FutureOrPresent
    private Instant startDateTime;

    @NotNull
    @Positive
    private Integer durationMinutes;

    @NotNull
    @Positive
    private BigDecimal price;

    @Size(max = 512)
    private String videoMeetingUrl;
}
