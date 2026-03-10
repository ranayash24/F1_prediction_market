package com.redline.market.service;

import com.redline.market.model.Market;
import com.redline.market.repository.MarketRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class MarketSeeder implements CommandLineRunner {
    private final MarketRepository marketRepository;

    public MarketSeeder(MarketRepository marketRepository) {
        this.marketRepository = marketRepository;
    }

    @Override
    public void run(String... args) {
        if (marketRepository.count() > 0) {
            return;
        }

        List<Market> seeds = List.of(
                build("Round 1", "Bahrain GP", "Will Max Verstappen win the Bahrain GP?", "Race Winner"),
                build("Round 1", "Bahrain Quali", "Will Charles Leclerc take pole position?", "Qualifying"),
                build("Round 2", "Saudi GP", "Will there be a safety car in Jeddah?", "Safety Car")
        );

        marketRepository.saveAll(seeds);
    }

    private Market build(String round, String name, String description, String category) {
        Market market = new Market();
        market.setRoundName(round);
        market.setName(name);
        market.setDescription(description);
        market.setCategory(category);
        market.setYesShares(0);
        market.setNoShares(0);
        market.setVolume(0);
        return market;
    }
}
