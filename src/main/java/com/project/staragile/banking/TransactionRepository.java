package com.project.staragile.banking;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT t FROM Transaction t WHERE t.sourceAccountNumber = :acc OR t.targetAccountNumber = :acc ORDER BY t.id DESC")
    List<Transaction> findByAccountNumber(@Param("acc") int accountNumber);

    List<Transaction> findTop50ByOrderByIdDesc();
}
