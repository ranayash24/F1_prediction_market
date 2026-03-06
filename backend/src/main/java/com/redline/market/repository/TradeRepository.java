package com.redline.market.repository;

import com.redline.market.model.Trade;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeRepository extends JpaRepository<Trade, UUID> {
    List<Trade> findTop20ByMarketIdOrderByCreatedAtDesc(UUID marketId);
}
