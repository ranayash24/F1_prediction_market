package com.redline.market.service;

import com.redline.market.model.Market;
import com.redline.market.repository.MarketRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class MarketService {
    private final MarketRepository marketRepository;

    public MarketService(MarketRepository marketRepository) {
        this.marketRepository = marketRepository;
    }

    public List<Market> listMarkets() {
        return marketRepository.findAll();
    }

    public Market getMarket(UUID id) {
        return marketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Market not found"));
    }

    public Market save(Market market) {
        return marketRepository.save(market);
    }
}
