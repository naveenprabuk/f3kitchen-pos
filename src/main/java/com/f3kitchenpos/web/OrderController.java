package com.f3kitchenpos.web;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.f3kitchenpos.model.*;
import com.f3kitchenpos.service.OrderService;

import java.math.BigDecimal;
import java.util.List;

@RestController @RequestMapping("/api/orders") @RequiredArgsConstructor
public class OrderController {
    private final OrderService svc;
    record Billing(BigDecimal discount, BigDecimal serviceChargePct) {}
    record PayReq(List<Payment> payments) {}

    @GetMapping public List<CustomerOrder> active() { return svc.active(); }
    @PostMapping public CustomerOrder create(@RequestBody CustomerOrder o) { return svc.create(o); }
    @PutMapping("/{id}/status") public CustomerOrder status(@PathVariable Long id, @RequestParam String value) { return svc.setStatus(id, value); }
    @DeleteMapping("/{id}/lines/{index}") public CustomerOrder removeLine(@PathVariable Long id, @PathVariable int index) { return svc.removeLine(id, index); }
    @PutMapping("/{id}/billing") public CustomerOrder billing(@PathVariable Long id, @RequestBody Billing b) {
        return svc.billing(id, b.discount() == null ? BigDecimal.ZERO : b.discount(), b.serviceChargePct() == null ? BigDecimal.ZERO : b.serviceChargePct());
    }
    @PostMapping("/{id}/pay") public CustomerOrder pay(@PathVariable Long id, @RequestBody PayReq r) { return svc.pay(id, r.payments()); }
}
