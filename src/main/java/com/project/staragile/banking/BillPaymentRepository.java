package com.project.staragile.banking;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillPaymentRepository extends JpaRepository<BillPayment, Long> {
    List<BillPayment> findByAccountNumberOrderByIdDesc(int accountNumber);
}
