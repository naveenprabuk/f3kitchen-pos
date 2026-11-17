package com.f3kitchenpos.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.f3kitchenpos.model.CustomerOrder;
import com.f3kitchenpos.repo.OrderRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class ReportService {
    private final OrderRepository orders;

    @Transactional(readOnly = true)
    public Map<String, Object> report(String period, LocalDate date) {
        LocalDate from, to;
        switch (period) {
            case "daily" -> { from = date; to = date.plusDays(1); }
            case "monthly" -> { from = date.withDayOfMonth(1); to = from.plusMonths(1); }
            case "yearly" -> { from = date.withDayOfYear(1); to = from.plusYears(1); }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Period must be daily, monthly or yearly");
        }
        List<CustomerOrder> list = orders.findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan("PAID", from.atStartOfDay(), to.atStartOfDay());

        BigDecimal total = BigDecimal.ZERO, tax = BigDecimal.ZERO;
        Map<String, BigDecimal> pay = new TreeMap<>(), cat = new TreeMap<>(), series = new TreeMap<>();
        Map<String, Integer> qty = new HashMap<>();
        for (CustomerOrder o : list) {
            total = total.add(o.getTotal()); tax = tax.add(o.getTax());
            o.getPayments().forEach(p -> pay.merge(p.getMethod(), p.getAmount(), BigDecimal::add));
            o.getLines().forEach(l -> {
                qty.merge(l.getName(), l.getQty(), Integer::sum);
                cat.merge(l.getCategory(), l.getUnitPrice().multiply(BigDecimal.valueOf(l.getQty())), BigDecimal::add);
            });
            series.merge(key(period, o.getPaidAt()), o.getTotal(), BigDecimal::add);
        }
        List<Map<String, Object>> top = qty.entrySet().stream()
                .sorted((a, b) -> b.getValue() - a.getValue()).limit(5)
                .map(e -> Map.<String, Object>of("name", e.getKey(), "qty", e.getValue())).toList();
        List<Map<String, Object>> chart = series.entrySet().stream()
                .map(e -> Map.<String, Object>of("label", e.getKey(), "total", e.getValue())).toList();

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("from", from); r.put("to", to.minusDays(1));
        r.put("orderCount", list.size());
        r.put("totalSales", total);
        r.put("avgTicket", list.isEmpty() ? BigDecimal.ZERO : total.divide(BigDecimal.valueOf(list.size()), 2, RoundingMode.HALF_UP));
        r.put("taxTotal", tax);
        r.put("payments", pay); r.put("categories", cat); r.put("topItems", top); r.put("series", chart);
        return r;
    }

    // daily -> hour, monthly -> day of month, yearly -> month number (zero-padded so keys sort correctly)
    private String key(String p, LocalDateTime t) {
        return switch (p) {
            case "daily" -> String.format("%02d:00", t.getHour());
            case "monthly" -> String.format("%02d", t.getDayOfMonth());
            default -> String.format("%02d", t.getMonthValue());
        };
    }
}
