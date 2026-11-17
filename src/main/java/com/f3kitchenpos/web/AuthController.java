package com.f3kitchenpos.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    @Value("${f3.users.admin}") String admin;
    @Value("${f3.users.cashier}") String cashier;
    @Value("${f3.users.kitchen}") String kitchen;
    record Login(String username, String password) {}

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Login l) {
        Map<String, String> users = Map.of("admin", admin, "cashier", cashier, "kitchen", kitchen);
        if (l.username() == null || l.password() == null || !l.password().equals(users.get(l.username())))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong username or password");
        return Map.of("username", l.username(), "role", l.username().toUpperCase());
    }
}
