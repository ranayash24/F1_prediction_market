package com.redline.market.service;

import com.redline.market.model.ChatMessage;
import com.redline.market.model.Market;
import com.redline.market.repository.ChatMessageRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final MarketService marketService;

    public ChatService(ChatMessageRepository chatMessageRepository, MarketService marketService) {
        this.chatMessageRepository = chatMessageRepository;
        this.marketService = marketService;
    }

    public ChatMessage saveMessage(UUID marketId, String userName, String message) {
        Market market = marketService.getMarket(marketId);
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setMarket(market);
        chatMessage.setUserName(userName);
        chatMessage.setMessage(message);
        return chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> recentMessages(UUID marketId) {
        return chatMessageRepository.findTop20ByMarketIdOrderByCreatedAtDesc(marketId);
    }
}
