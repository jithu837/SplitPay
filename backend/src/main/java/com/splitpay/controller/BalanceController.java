package com.splitpay.controller;

import com.splitpay.dto.response.BalanceDto;
import com.splitpay.security.CurrentUser;
import com.splitpay.service.BalanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;

    @GetMapping("/api/groups/{groupId}/balances")
    public ResponseEntity<List<BalanceDto>> getBalances(@PathVariable String groupId) {
        return ResponseEntity.ok(balanceService.getGroupBalances(groupId, CurrentUser.id()));
    }
}
