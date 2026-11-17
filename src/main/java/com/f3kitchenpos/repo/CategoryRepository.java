package com.f3kitchenpos.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.f3kitchenpos.model.Category;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByNameIgnoreCase(String name);
}
