package com.redline.market.service;

import com.redline.market.model.Market;
import com.redline.market.model.Trade;
import com.redline.market.model.UserAccount;
import com.redline.market.repository.TradeRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class TradeService {
    private final TradeRepository tradeRepository;
    private final MarketService marketService;
    private final UserService userService;

    public TradeService(TradeRepository tradeRepository, MarketService marketService, UserService userService) {
        this.tradeRepository = tradeRepository;
        this.marketService = marketService;
        this.userService = userService;
    }

    @Transactional
    public Trade placeTrade(UUID marketId, String email, String displayName, Trade.Side side, int shares) {
        if (shares <= 0) {
            throw new IllegalArgumentException("Shares must be positive");
        }

        Market market = marketService.getMarket(marketId);
        double yesPrice = calculateYesPrice(market);
        int price = (int) Math.round((side == Trade.Side.YES ? yesPrice : (1 - yesPrice)) * 100);
        int cost = price * shares;

        UserAccount user = userService.getOrCreate(email, displayName);
        if (user.getBalance() < cost) {
            throw new IllegalArgumentException("Insufficient balance");
        }

        if (side == Trade.Side.YES) {
            market.setYesShares(market.getYesShares() + shares);
        } else {
            market.setNoShares(market.getNoShares() + shares);
        }
        market.setVolume(market.getVolume() + cost);
        marketService.save(market);

        userService.updateBalance(user, -cost);

        Trade trade = new Trade();
        trade.setMarket(market);
        trade.setUser(user);
        trade.setSide(side);
        trade.setShares(shares);
        trade.setPrice(price);
        return tradeRepository.save(trade);
    }

    public List<Trade> recentTrades(UUID marketId) {
        return tradeRepository.findTop20ByMarketIdOrderByCreatedAtDesc(marketId);
    }

    private double calculateYesPrice(Market market) {
        int total = market.getYesShares() + market.getNoShares();
        if (total == 0) {
            return 0.5;
        }
        return (double) market.getYesShares() / total;
    }
}
