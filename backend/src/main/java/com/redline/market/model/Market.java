package com.redline.market.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "markets")
public class Market {
    @Id
    private UUID id;

    @Column(nullable = false)
    private String roundName;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 1024)
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private int yesShares;

    @Column(nullable = false)
    private int noShares;

    @Column(nullable = false)
    private int volume;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public String getRoundName() {
        return roundName;
    }

    public void setRoundName(String roundName) {
        this.roundName = roundName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getYesShares() {
        return yesShares;
    }

    public void setYesShares(int yesShares) {
        this.yesShares = yesShares;
    }

    public int getNoShares() {
        return noShares;
    }

    public void setNoShares(int noShares) {
        this.noShares = noShares;
    }

    public int getVolume() {
        return volume;
    }

    public void setVolume(int volume) {
        this.volume = volume;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
