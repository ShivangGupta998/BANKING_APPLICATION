package com.project.staragile.banking;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByAccountNumberOrderByIdDesc(int accountNumber);
}
