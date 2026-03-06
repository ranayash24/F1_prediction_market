package com.redline.market.controller;

import com.redline.market.model.Trade;
import com.redline.market.service.TradeService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/markets/{marketId}/trades")
public class TradeController {
    private final TradeService tradeService;

    public TradeController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    @PostMapping
    public TradeResponse placeTrade(@PathVariable UUID marketId, @RequestBody TradeRequest request) {
        Trade trade = tradeService.placeTrade(
                marketId,
                request.email(),
                request.displayName(),
                request.side(),
                request.shares()
        );
        return toResponse(trade);
    }

    @GetMapping
    public List<TradeResponse> recentTrades(@PathVariable UUID marketId) {
        return tradeService.recentTrades(marketId).stream()
                .map(TradeController::toResponse)
                .collect(Collectors.toList());
    }

    private static TradeResponse toResponse(Trade trade) {
        return new TradeResponse(
                trade.getId(),
                trade.getMarket().getId(),
                trade.getUser().getEmail(),
                trade.getSide(),
                trade.getShares(),
                trade.getPrice(),
                trade.getCreatedAt()
        );
    }

    public record TradeRequest(
            @NotBlank String email,
            @NotBlank String displayName,
            @NotNull Trade.Side side,
            @Min(1) int shares
    ) {}

    public record TradeResponse(
            UUID id,
            UUID marketId,
            String userEmail,
            Trade.Side side,
            int shares,
            int price,
            Instant createdAt
    ) {}
}
