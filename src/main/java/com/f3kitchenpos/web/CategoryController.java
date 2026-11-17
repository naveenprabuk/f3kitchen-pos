package com.f3kitchenpos.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.f3kitchenpos.model.Category;
import com.f3kitchenpos.model.MenuItem;
import com.f3kitchenpos.repo.CategoryRepository;
import com.f3kitchenpos.repo.MenuItemRepository;

import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/categories") @RequiredArgsConstructor
public class CategoryController {
    private final CategoryRepository repo;
    private final MenuItemRepository items;

    private ResponseStatusException bad(String m) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, m); }
    private String clean(Map<String, String> body) {
        String n = body.get("name") == null ? "" : body.get("name").trim();
        if (n.isEmpty()) throw bad("Category name is required");
        return n;
    }

    @GetMapping public List<Category> all() { return repo.findAll().stream().sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName())).toList(); }

    @PostMapping public Category add(@RequestBody Map<String, String> body) {
        String n = clean(body);
        if (repo.findByNameIgnoreCase(n).isPresent()) throw bad("Category \"" + n + "\" already exists");
        Category c = new Category(); c.setName(n); return repo.save(c);
    }

    /** Rename: every menu item in the category moves to the new name. Past orders keep the name they were sold under. */
    @PutMapping("/{id}") @Transactional
    public Category rename(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Category c = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        String n = clean(body);
        repo.findByNameIgnoreCase(n).filter(x -> !x.getId().equals(id)).ifPresent(x -> { throw bad("Category \"" + n + "\" already exists"); });
        String old = c.getName();
        for (MenuItem m : items.findByCategory(old)) { m.setCategory(n); items.save(m); }
        c.setName(n);
        return repo.save(c);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        Category c = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        long used = items.countByCategoryAndActiveTrue(c.getName());
        if (used > 0) throw bad("\"" + c.getName() + "\" still has " + used + " menu item(s). Move or delete them first.");
        repo.delete(c);
    }
}
