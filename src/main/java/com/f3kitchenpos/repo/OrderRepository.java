package com.f3kitchenpos.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.f3kitchenpos.model.CustomerOrder;

import java.time.LocalDateTime;
import java.util.*;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByStatusNotInOrderByCreatedAtAsc(Collection<String> statuses);
    List<CustomerOrder> findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(String status, LocalDateTime from, LocalDateTime to);
}
