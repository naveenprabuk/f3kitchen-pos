package com.f3kitchenpos.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.f3kitchenpos.model.*;
import com.f3kitchenpos.repo.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class OrderService {
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final Set<String> FLOW = Set.of("PENDING", "IN_PREPARATION", "READY", "SERVED", "CANCELLED");
    private final OrderRepository orders;
    private final MenuItemRepository menu;

    private ResponseStatusException bad(String m) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, m); }

    private CustomerOrder open(Long id) {
        CustomerOrder o = orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (o.getStatus().equals("PAID") || o.getStatus().equals("CANCELLED")) throw bad("Order #" + id + " is already closed");
        return o;
    }

    @Transactional
    public List<CustomerOrder> active() {
        List<CustomerOrder> list = orders.findByStatusNotInOrderByCreatedAtAsc(List.of("PAID", "CANCELLED"));
        list.forEach(this::recalc); // fixes totals saved by an older version of the calculation
        return list;
    }

    @Transactional
    public CustomerOrder create(CustomerOrder in) {
        if (in.getLines() == null || in.getLines().isEmpty()) throw bad("Add at least one item");
        if (!List.of("DINE_IN", "TAKEOUT", "DELIVERY").contains(in.getType())) throw bad("Choose an order type");
        List<OrderLine> lines = new ArrayList<>();
        for (OrderLine l : in.getLines()) {
            if (l.getQty() < 1) throw bad("Quantity must be at least 1");
            MenuItem m = menu.findById(l.getMenuItemId()).filter(x -> x.isActive() && x.isAvailable())
                    .orElseThrow(() -> bad("An item is no longer available"));
            l.setName(m.getName()); l.setCategory(m.getCategory()); l.setUnitPrice(m.getPrice()); l.setTaxRate(m.getTaxRate());
            lines.add(l);
        }
        CustomerOrder o = new CustomerOrder();
        o.setType(in.getType()); o.setTableNo(in.getTableNo()); o.setLines(lines);
        recalc(o);
        return orders.save(o);
    }

    @Transactional
    public CustomerOrder setStatus(Long id, String value) {
        if (!FLOW.contains(value)) throw bad("Unknown status " + value);
        CustomerOrder o = open(id);
        o.setStatus(value);
        return o;
    }

    /** Cancel a single line; only allowed before the kitchen starts. */
    @Transactional
    public CustomerOrder removeLine(Long id, int index) {
        CustomerOrder o = open(id);
        if (!o.getStatus().equals("PENDING")) throw bad("The kitchen has already started this order");
        if (index < 0 || index >= o.getLines().size()) throw bad("Item not found");
        o.getLines().remove(index);
        if (o.getLines().isEmpty()) o.setStatus("CANCELLED");
        recalc(o);
        return o;
    }

    @Transactional
    public CustomerOrder billing(Long id, BigDecimal discount, BigDecimal svcPct) {
        if (discount.signum() < 0 || svcPct.signum() < 0) throw bad("Discount and service charge cannot be negative");
        CustomerOrder o = open(id);
        o.setDiscount(discount); o.setServiceChargePct(svcPct);
        recalc(o);
        return o;
    }

    @Transactional
    public CustomerOrder pay(Long id, List<Payment> payments) {
        CustomerOrder o = open(id);
        recalc(o);
        if (payments == null || payments.isEmpty()) throw bad("Add a payment");
        BigDecimal sum = payments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (sum.subtract(o.getTotal()).abs().compareTo(new BigDecimal("0.01")) > 0)
            throw bad("Payment failed: payments total " + sum + " but the bill is " + o.getTotal() + ". Order stays open.");
        o.setPayments(new ArrayList<>(payments));
        o.setStatus("PAID");
        o.setPaidAt(LocalDateTime.now());
        return o;
    }

    /**
     * Menu prices already include GST: GST = price * rate / (100 + rate).
     * Without a discount each unit price is split and rounded like the Menu page, then multiplied by quantity.
     * With a discount it is shared across items first and GST is taken from what is left, per rate.
     */
    private void recalc(CustomerOrder o) {
        BigDecimal sub = BigDecimal.ZERO;
        for (OrderLine l : o.getLines()) sub = sub.add(l.getUnitPrice().multiply(BigDecimal.valueOf(l.getQty())));
        if (o.getDiscount() == null) o.setDiscount(BigDecimal.ZERO);
        if (o.getServiceChargePct() == null) o.setServiceChargePct(BigDecimal.ZERO);
        BigDecimal disc = o.getDiscount().min(sub);
        BigDecimal net = sub.subtract(disc);
        BigDecimal gst = BigDecimal.ZERO;
        if (disc.signum() == 0) {
            for (OrderLine l : o.getLines())
                gst = gst.add(gstOf(l.getUnitPrice(), l.getTaxRate()).multiply(BigDecimal.valueOf(l.getQty())));
        } else {
            BigDecimal factor = net.divide(sub, 8, RoundingMode.HALF_UP);
            Map<BigDecimal, BigDecimal> grossByRate = new TreeMap<>();
            for (OrderLine l : o.getLines())
                grossByRate.merge(l.getTaxRate().stripTrailingZeros(), l.getUnitPrice().multiply(BigDecimal.valueOf(l.getQty())), BigDecimal::add);
            for (Map.Entry<BigDecimal, BigDecimal> e : grossByRate.entrySet())
                gst = gst.add(gstOf(e.getValue().multiply(factor), e.getKey()));
        }
        BigDecimal svc = net.multiply(o.getServiceChargePct()).divide(HUNDRED).setScale(2, RoundingMode.HALF_UP);
        o.setDiscount(disc); o.setSubtotal(sub.setScale(2, RoundingMode.HALF_UP)); o.setTax(gst); o.setServiceCharge(svc);
        o.setTotal(net.add(svc).setScale(2, RoundingMode.HALF_UP)); // GST is already inside the prices
    }

    private BigDecimal gstOf(BigDecimal grossPrice, BigDecimal rate) {
        return grossPrice.multiply(rate).divide(HUNDRED.add(rate), 2, RoundingMode.HALF_UP);
    }
}
