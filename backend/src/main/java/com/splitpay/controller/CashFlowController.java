package com.splitpay.controller;

import com.splitpay.dto.response.MinimumCashFlowResponse;
import com.splitpay.security.CurrentUser;
import com.splitpay.service.MinimumCashFlowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CashFlowController {

    private final MinimumCashFlowService minimumCashFlowService;

    @GetMapping("/api/groups/{groupId}/minimum-cash-flow")
    public ResponseEntity<MinimumCashFlowResponse> getMinimumCashFlow(@PathVariable String groupId) {
        return ResponseEntity.ok(minimumCashFlowService.computeForGroup(groupId, CurrentUser.id()));
    }
}
