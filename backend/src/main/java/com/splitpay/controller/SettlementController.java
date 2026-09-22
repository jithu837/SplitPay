package com.splitpay.controller;

import com.splitpay.dto.response.SettlementDto;
import com.splitpay.security.CurrentUser;
import com.splitpay.service.SettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @GetMapping
    public ResponseEntity<List<SettlementDto>> getSettlements(@PathVariable String groupId) {
        return ResponseEntity.ok(settlementService.getSettlementsForGroup(groupId, CurrentUser.id()));
    }

    @PostMapping("/generate")
    public ResponseEntity<List<SettlementDto>> generatePlan(@PathVariable String groupId) {
        return ResponseEntity.ok(settlementService.generateSettlementPlan(groupId, CurrentUser.id()));
    }
}
