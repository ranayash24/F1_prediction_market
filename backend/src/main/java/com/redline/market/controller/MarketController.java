package com.redline.market.controller;

import com.redline.market.model.Market;
import com.redline.market.service.MarketService;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/markets")
public class MarketController {
    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping
    public List<MarketResponse> listMarkets() {
        return marketService.listMarkets().stream()
                .map(MarketController::toResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/{marketId}")
    public MarketResponse getMarket(@PathVariable UUID marketId) {
        return toResponse(marketService.getMarket(marketId));
    }

    private static MarketResponse toResponse(Market market) {
        return new MarketResponse(
                market.getId(),
                market.getRoundName(),
                market.getName(),
                market.getDescription(),
                market.getCategory(),
                market.getYesShares(),
                market.getNoShares(),
                market.getVolume()
        );
    }

    public record MarketResponse(
            UUID id,
            String round,
            String name,
            String description,
            String category,
            int yesShares,
            int noShares,
            int volume
    ) {}
}
