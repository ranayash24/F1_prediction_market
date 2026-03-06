package com.redline.market.controller;

import com.redline.market.model.ChatMessage;
import com.redline.market.service.ChatService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/markets/{marketId}/chat")
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    public List<ChatMessageResponse> recentMessages(@PathVariable UUID marketId) {
        return chatService.recentMessages(marketId).stream()
                .map(ChatController::toResponse)
                .collect(Collectors.toList());
    }

    private static ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getMarket().getId(),
                message.getUserName(),
                message.getMessage(),
                message.getCreatedAt()
        );
    }

    public record ChatMessageResponse(UUID id, UUID marketId, String userName, String message, Instant createdAt) {}
}
