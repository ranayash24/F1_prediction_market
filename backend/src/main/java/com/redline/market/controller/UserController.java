package com.redline.market.controller;

import com.redline.market.model.UserAccount;
import com.redline.market.service.UserService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{email}")
    public UserResponse getUser(@PathVariable String email) {
        UserAccount user = userService.getOrCreate(email, email.split("@")[0]);
        return toResponse(user);
    }

    @PostMapping("/{email}/topup")
    public UserResponse topUp(@PathVariable String email, @RequestBody TopUpRequest request) {
        UserAccount user = userService.getOrCreate(email, request.displayName());
        user = userService.updateBalance(user, request.amount());
        return toResponse(user);
    }

    private static UserResponse toResponse(UserAccount user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getBalance());
    }

    public record TopUpRequest(@NotBlank String displayName, @Min(1) int amount) {}

    public record UserResponse(UUID id, String email, String displayName, int balance) {}
}
