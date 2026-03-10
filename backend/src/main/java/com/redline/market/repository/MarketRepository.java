package com.redline.market.repository;

import com.redline.market.model.Market;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketRepository extends JpaRepository<Market, UUID> {}
