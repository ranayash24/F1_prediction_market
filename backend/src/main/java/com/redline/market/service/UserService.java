package com.redline.market.service;

import com.redline.market.model.UserAccount;
import com.redline.market.repository.UserAccountRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserAccountRepository userAccountRepository;

    public UserService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    public UserAccount getOrCreate(String email, String displayName) {
        Optional<UserAccount> existing = userAccountRepository.findByEmail(email);
        if (existing.isPresent()) {
            UserAccount user = existing.get();
            if (!user.getDisplayName().equals(displayName)) {
                user.setDisplayName(displayName);
                return userAccountRepository.save(user);
            }
            return user;
        }

        UserAccount user = new UserAccount();
        user.setEmail(email);
        user.setDisplayName(displayName);
        user.setBalance(1000);
        return userAccountRepository.save(user);
    }

    public UserAccount updateBalance(UserAccount user, int delta) {
        user.setBalance(user.getBalance() + delta);
        return userAccountRepository.save(user);
    }
}
