package com.project.staragile.banking;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FixedDepositRepository extends JpaRepository<FixedDeposit, Long> {
    List<FixedDeposit> findByAccountNumberOrderByIdDesc(int accountNumber);
}
