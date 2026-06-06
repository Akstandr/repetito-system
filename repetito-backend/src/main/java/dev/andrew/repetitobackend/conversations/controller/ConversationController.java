package dev.andrew.repetitobackend.conversations.controller;

import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.conversations.dto.ConversationResponse;
import dev.andrew.repetitobackend.conversations.dto.MessageRequest;
import dev.andrew.repetitobackend.conversations.dto.MessageResponse;
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

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> messages(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(conversationService.getMessages((AuthPrincipal) authentication.getPrincipal(), id));
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
