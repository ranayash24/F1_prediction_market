package com.redline.market.controller;

import com.redline.market.model.ChatMessage;
import com.redline.market.service.ChatService;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatSocketController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatSocketController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/markets/{marketId}/chat")
    public void handleChat(@DestinationVariable UUID marketId, ChatRequest request) {
        ChatMessage saved = chatService.saveMessage(marketId, request.userName(), request.message());
        ChatMessageResponse response = new ChatMessageResponse(
                saved.getId(),
                saved.getMarket().getId(),
                saved.getUserName(),
                saved.getMessage(),
                saved.getCreatedAt()
        );
        messagingTemplate.convertAndSend("/topic/markets/" + marketId + "/chat", response);
    }

    public record ChatRequest(@NotBlank String userName, @NotBlank String message) {}

    public record ChatMessageResponse(UUID id, UUID marketId, String userName, String message, Instant createdAt) {}
}
