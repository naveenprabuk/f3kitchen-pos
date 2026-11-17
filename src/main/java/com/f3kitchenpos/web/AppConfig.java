package com.f3kitchenpos.web;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.f3kitchenpos.model.Category;
import com.f3kitchenpos.model.MenuItem;
import com.f3kitchenpos.repo.CategoryRepository;
import com.f3kitchenpos.repo.MenuItemRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Configuration
public class AppConfig implements WebMvcConfigurer {
    // The Electron window loads from file:// (origin "null"), so allow any origin on the local API.
    @Override public void addCorsMappings(CorsRegistry r) { r.addMapping("/api/**").allowedOrigins("*").allowedMethods("*"); }

    @Bean CommandLineRunner seed(MenuItemRepository repo, CategoryRepository cats) {
        return args -> {
            // make sure every category already used by a menu item is in the category list (also covers databases created before categories existed)
            repo.findAll().stream().map(MenuItem::getCategory).filter(java.util.Objects::nonNull).distinct().forEach(n -> addCat(cats, n));
            if (repo.count() > 0) return;
            List.of("Appetizer", "Main", "Bread", "Dessert", "Beverage").forEach(n -> addCat(cats, n));
            repo.saveAll(List.of(
                item("Paneer Tikka", "Appetizer", "220"), item("Chicken 65", "Appetizer", "240"),
                item("Butter Chicken", "Main", "320"), item("Veg Biryani", "Main", "260"),
                item("Garlic Naan", "Bread", "60"), item("Masala Chai", "Beverage", "40"),
                item("Fresh Lime Soda", "Beverage", "70"), item("Gulab Jamun", "Dessert", "90")));
        };
    }
    private static void addCat(CategoryRepository cats, String n) {
        if (cats.findByNameIgnoreCase(n).isEmpty()) { Category c = new Category(); c.setName(n); cats.save(c); }
    }
    private static MenuItem item(String name, String cat, String price) {
        MenuItem m = new MenuItem(); m.setName(name); m.setCategory(cat); m.setPrice(new BigDecimal(price)); m.setTaxRate(new BigDecimal("5")); return m;
    }

    @RestControllerAdvice
    public static class Errors {
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, String>> invalid(MethodArgumentNotValidException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getBindingResult().getFieldErrors().get(0).getDefaultMessage()));
        }
    }
}
