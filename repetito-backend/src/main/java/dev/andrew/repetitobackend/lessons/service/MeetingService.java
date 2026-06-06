package dev.andrew.repetitobackend.lessons.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class MeetingService {

    private static final String DEFAULT_API_URL = "https://cloud-api.yandex.net/v1/telemost-api";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${telemost.api-url:" + DEFAULT_API_URL + "}")
    private String apiUrl;

    @Value("${telemost.token:}")
    private String token;

    @Value("${telemost.dev-mode:true}")
    private boolean devMode;

    public String createLessonMeeting(LessonMeetingData lessonData) {
        if (devMode) {
            return null;
        }
        if (token == null || token.isBlank()) {
            throw new IllegalStateException("YANDEX_TELEMOST_TOKEN is required when YANDEX_TELEMOST_DEV_MODE=false");
        }

        try {
            String payload = objectMapper.writeValueAsString(Map.of("waiting_room_level", "PUBLIC"));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalizeApiUrl() + "/conferences"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "OAuth " + token.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() / 100 != 2) {
                throw new IllegalStateException("Failed to create a Telemost meeting: HTTP " + response.statusCode());
            }

            JsonNode responseBody = objectMapper.readTree(response.body());
            String joinUrl = responseBody.path("join_url").asText(null);
            if (joinUrl == null || joinUrl.isBlank()) {
                throw new IllegalStateException("Telemost did not return a join URL");
            }
            return joinUrl;
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to create a video meeting URL", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Failed to create a video meeting URL", exception);
        }
    }

    private String normalizeApiUrl() {
        if (apiUrl == null || apiUrl.isBlank()) {
            return DEFAULT_API_URL;
        }
        return apiUrl.trim().replaceAll("/+$", "");
    }

    public record LessonMeetingData(String subject, Instant startDateTime, Integer durationMinutes) {
    }
}
