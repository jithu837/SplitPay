package com.splitpay.controller;

import com.splitpay.dto.request.ExpenseRequest;
import com.splitpay.dto.response.ExpenseDto;
import com.splitpay.security.CurrentUser;
import com.splitpay.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping("/api/groups/{groupId}/expenses")
    public ResponseEntity<ExpenseDto> addExpense(@PathVariable String groupId,
                                                  @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(expenseService.addExpense(groupId, CurrentUser.id(), request));
    }

    @GetMapping("/api/groups/{groupId}/expenses")
    public ResponseEntity<List<ExpenseDto>> getExpenses(@PathVariable String groupId) {
        return ResponseEntity.ok(expenseService.getExpensesForGroup(groupId, CurrentUser.id()));
    }

    @PutMapping("/api/expenses/{id}")
    public ResponseEntity<ExpenseDto> updateExpense(@PathVariable String id,
                                                     @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.updateExpense(id, CurrentUser.id(), request));
    }

    @DeleteMapping("/api/expenses/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable String id) {
        expenseService.deleteExpense(id, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}
