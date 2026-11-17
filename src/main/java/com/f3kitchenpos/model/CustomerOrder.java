package com.f3kitchenpos.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Entity @Table(name = "orders") @Data
public class CustomerOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String type;          // DINE_IN, TAKEOUT, DELIVERY
    private String tableNo;
    private String status = "PENDING"; // PENDING, IN_PREPARATION, READY, SERVED, PAID, CANCELLED
    @ElementCollection(fetch = FetchType.EAGER) @OrderColumn private List<OrderLine> lines = new ArrayList<>();
    @ElementCollection(fetch = FetchType.EAGER) private List<Payment> payments = new ArrayList<>();
    private BigDecimal discount = BigDecimal.ZERO;
    private BigDecimal serviceChargePct = BigDecimal.ZERO;
    private BigDecimal serviceCharge = BigDecimal.ZERO;
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal tax = BigDecimal.ZERO;
    private BigDecimal total = BigDecimal.ZERO;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime paidAt;
}
