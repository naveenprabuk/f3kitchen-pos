package com.f3kitchenpos.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import java.math.BigDecimal;

@Embeddable @Data
public class OrderLine {
    private Long menuItemId;
    private String name, category, note;
    private int qty;
    private BigDecimal unitPrice, taxRate; // snapshot at order time
}
