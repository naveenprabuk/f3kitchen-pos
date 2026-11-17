package com.f3kitchenpos.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import java.math.BigDecimal;

@Embeddable @Data
public class Payment {
    private String method; // CASH, CARD, UPI
    private BigDecimal amount;
}
