package dev.andrew.repetitobackend.conversations.controller;

import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.conversations.dto.ConversationResponse;
import dev.andrew.repetitobackend.conversations.dto.MessageRequest;
import dev.andrew.repetitobackend.conversations.dto.MessageResponse;
import dev.andrew.repetitobackend.conversations.dto.MessagePageResponse;
import dev.andrew.repetitobackend.conversations.dto.StartConversationRequest;
import dev.andrew.repetitobackend.conversations.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping("/my")
    public ResponseEntity<List<ConversationResponse>> my(Authentication authentication) {
        return ResponseEntity.ok(conversationService.getMyConversations((AuthPrincipal) authentication.getPrincipal()));
    }

    @PostMapping("/start")
    public ResponseEntity<ConversationResponse> start(
            Authentication authentication,
            @Valid @RequestBody StartConversationRequest request
    ) {
        return ResponseEntity.ok(conversationService.startConversation((AuthPrincipal) authentication.getPrincipal(), request));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<MessagePageResponse> messages(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam(required = false) Long beforeMessageId,
            @RequestParam(defaultValue = "30") int limit
    ) {
        return ResponseEntity.ok(conversationService.getMessages(
                (AuthPrincipal) authentication.getPrincipal(), id, beforeMessageId, limit
        ));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageResponse> send(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody MessageRequest request
    ) {
        return ResponseEntity.ok(conversationService.sendMessage((AuthPrincipal) authentication.getPrincipal(), id, request));
    }
}
