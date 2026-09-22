package com.splitpay.service;

import com.splitpay.algorithm.CashFlowTransaction;
import com.splitpay.document.Group;
import com.splitpay.document.Settlement;
import com.splitpay.document.SettlementStatus;
import com.splitpay.dto.response.MinimumCashFlowResponse;
import com.splitpay.dto.response.SettlementDto;
import com.splitpay.exception.ResourceNotFoundException;
import com.splitpay.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final GroupService groupService;
    private final MinimumCashFlowService minimumCashFlowService;
    private final UserService userService;

    public List<SettlementDto> getSettlementsForGroup(String groupId, String requesterId) {
        groupService.findByIdChecked(groupId, requesterId);
        return settlementRepository.findByGroupId(groupId).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Regenerates the PENDING settlement plan for a group from the current
     * minimum-cash-flow calculation. Existing PENDING settlements are replaced;
     * PAID/FAILED history is preserved untouched.
     */
    public List<SettlementDto> generateSettlementPlan(String groupId, String requesterId) {
        Group group = groupService.findByIdChecked(groupId, requesterId);

        List<Settlement> existingPending = settlementRepository.findByGroupIdAndStatus(groupId, SettlementStatus.PENDING);
        settlementRepository.deleteAll(existingPending);

        MinimumCashFlowResponse plan = minimumCashFlowService.computeForGroup(groupId, requesterId);

        List<Settlement> created = plan.getOptimizedSettlements().stream()
                .map(t -> Settlement.builder()
                        .groupId(groupId)
                        .fromUserId(t.getFromUserId())
                        .toUserId(t.getToUserId())
                        .amount(t.getAmount())
                        .status(SettlementStatus.PENDING)
                        .build())
                .toList();

        List<Settlement> saved = settlementRepository.saveAll(created);
        return saved.stream().map(this::toDto).toList();
    }

    public Settlement findById(String settlementId) {
        return settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + settlementId));
    }

    public Settlement save(Settlement settlement) {
        return settlementRepository.save(settlement);
    }

    public SettlementDto toDto(Settlement s) {
        return SettlementDto.builder()
                .id(s.getId())
                .groupId(s.getGroupId())
                .fromUserId(s.getFromUserId())
                .fromUserName(safeName(s.getFromUserId()))
                .toUserId(s.getToUserId())
                .toUserName(safeName(s.getToUserId()))
                .amount(s.getAmount())
                .status(s.getStatus())
                .createdAt(s.getCreatedAt())
                .paidAt(s.getPaidAt())
                .build();
    }

    private String safeName(String userId) {
        try {
            return userService.findById(userId).getName();
        } catch (Exception e) {
            return "Unknown user";
        }
    }
}
