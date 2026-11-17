package com.f3kitchenpos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity @Data
public class MenuItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotBlank(message = "Name is required") private String name;
    @NotBlank(message = "Category is required") private String category;
    @NotNull(message = "Price is required") @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;
    @NotNull(message = "GST % is required") @DecimalMin(value = "0.0", message = "GST % cannot be negative") @DecimalMax(value = "100.0", message = "GST % cannot be more than 100")
    private BigDecimal taxRate = new BigDecimal("5"); // GST %
    @Column(length = 500) private String description;
    private boolean available = true;
    private boolean active = true; // false = soft-deleted, kept for order history
}
