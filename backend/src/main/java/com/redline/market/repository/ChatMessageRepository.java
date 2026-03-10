package com.redline.market.repository;

import com.redline.market.model.ChatMessage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findTop20ByMarketIdOrderByCreatedAtDesc(UUID marketId);
}
