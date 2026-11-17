package com.f3kitchenpos.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "category")
@Data
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String slug;

    @Column(name = "sort_order")
    private Integer sortOrder = 0; // <-- Initializing to 0 prevents it from being null!

    @PrePersist
    public void prePersist() {
        if (this.slug == null || this.slug.isEmpty()) {
            if (this.name != null) {
                this.slug = this.name.toLowerCase().replaceAll("[^a-z0-9]", "-");
            }
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
    }
}