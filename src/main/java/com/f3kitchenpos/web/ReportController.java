package com.f3kitchenpos.web;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import com.f3kitchenpos.service.ReportService;

import java.time.LocalDate;
import java.util.Map;

@RestController @RequestMapping("/api/reports") @RequiredArgsConstructor
public class ReportController {
    private final ReportService svc;

    /** period = daily | monthly | yearly; date = any day inside the period (yyyy-MM-dd). */
    @GetMapping("/{period}")
    public Map<String, Object> report(@PathVariable String period, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return svc.report(period, date);
    }
}
