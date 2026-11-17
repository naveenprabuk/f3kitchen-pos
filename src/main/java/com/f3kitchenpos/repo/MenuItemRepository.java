package com.f3kitchenpos.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.f3kitchenpos.model.MenuItem;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByActiveTrue();
    List<MenuItem> findByCategory(String category);
    long countByCategoryAndActiveTrue(String category);
}
