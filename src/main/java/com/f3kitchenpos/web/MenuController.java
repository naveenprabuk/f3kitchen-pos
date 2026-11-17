package com.f3kitchenpos.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.f3kitchenpos.model.Category;
import com.f3kitchenpos.model.MenuItem;
import com.f3kitchenpos.repo.CategoryRepository;
import com.f3kitchenpos.repo.MenuItemRepository;

import java.util.List;

@RestController @RequestMapping("/api/menu") @RequiredArgsConstructor
public class MenuController {
    private final MenuItemRepository repo;
    private final CategoryRepository categories;

    /** Typing a new category on an item creates it, so the category list never drifts from the menu. */
    private void ensureCategory(MenuItem m) {
        String n = m.getCategory().trim(); m.setCategory(n);
        if (categories.findByNameIgnoreCase(n).isEmpty()) { Category c = new Category(); c.setName(n); categories.save(c); }
    }

    private MenuItem find(Long id) { return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")); }

    @GetMapping public List<MenuItem> all(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return includeInactive ? repo.findAll() : repo.findByActiveTrue();
    }
    @PostMapping public MenuItem add(@Valid @RequestBody MenuItem m) { ensureCategory(m); m.setId(null); m.setActive(true); return repo.save(m); }
    @PutMapping("/{id}") public MenuItem edit(@PathVariable Long id, @Valid @RequestBody MenuItem m) { find(id); ensureCategory(m); m.setId(id); m.setActive(true); return repo.save(m); }
    /** Soft delete: the item disappears from the menu but stays in past orders. */
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { MenuItem m = find(id); m.setActive(false); m.setAvailable(false); repo.save(m); }
}
