package com.splitpay.service;

import com.splitpay.document.Group;
import com.splitpay.document.User;
import com.splitpay.dto.request.AddMemberRequest;
import com.splitpay.dto.request.GroupRequest;
import com.splitpay.dto.response.GroupDto;
import com.splitpay.exception.BadRequestException;
import com.splitpay.exception.ForbiddenException;
import com.splitpay.exception.ResourceNotFoundException;
import com.splitpay.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserService userService;

    public GroupDto createGroup(String creatorId, GroupRequest request) {
        Set<String> memberIds = new LinkedHashSet<>();
        memberIds.add(creatorId);
        if (request.getMemberIds() != null) {
            memberIds.addAll(request.getMemberIds());
        }

        Group group = Group.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .createdBy(creatorId)
                .memberIds(new ArrayList<>(memberIds))
                .build();

        return toDto(groupRepository.save(group));
    }

    public List<GroupDto> getGroupsForUser(String userId) {
        return groupRepository.findByMemberIdsContaining(userId).stream()
                .map(this::toDto)
                .toList();
    }

    public GroupDto getGroupById(String groupId, String requesterId) {
        Group group = findByIdChecked(groupId, requesterId);
        return toDto(group);
    }

    public GroupDto updateGroup(String groupId, String requesterId, GroupRequest request) {
        Group group = findByIdChecked(groupId, requesterId);

        if (!group.getCreatedBy().equals(requesterId)) {
            throw new ForbiddenException("Only the group creator can edit this group");
        }

        group.setName(request.getName().trim());
        group.setDescription(request.getDescription());
        return toDto(groupRepository.save(group));
    }

    public void deleteGroup(String groupId, String requesterId) {
        Group group = findByIdChecked(groupId, requesterId);

        if (!group.getCreatedBy().equals(requesterId)) {
            throw new ForbiddenException("Only the group creator can delete this group");
        }

        groupRepository.delete(group);
    }

    public GroupDto addMember(String groupId, String requesterId, AddMemberRequest request) {
        Group group = findByIdChecked(groupId, requesterId);
        User newMember = userService.findByEmail(request.getEmail());

        if (group.getMemberIds().contains(newMember.getId())) {
            throw new BadRequestException("User is already a member of this group");
        }

        group.getMemberIds().add(newMember.getId());
        return toDto(groupRepository.save(group));
    }

    public GroupDto removeMember(String groupId, String requesterId, String memberIdToRemove) {
        Group group = findByIdChecked(groupId, requesterId);

        boolean isCreator = group.getCreatedBy().equals(requesterId);
        boolean isSelfLeaving = requesterId.equals(memberIdToRemove);

        if (!isCreator && !isSelfLeaving) {
            throw new ForbiddenException("Only the group creator can remove other members");
        }
        if (memberIdToRemove.equals(group.getCreatedBy())) {
            throw new BadRequestException("The group creator cannot be removed. Delete the group instead.");
        }

        group.getMemberIds().remove(memberIdToRemove);
        return toDto(groupRepository.save(group));
    }

    /** Fetches the group and throws if the requester isn't a member — group finances are private to members. */
    public Group findByIdChecked(String groupId, String requesterId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));

        if (!group.getMemberIds().contains(requesterId)) {
            throw new ForbiddenException("You are not a member of this group");
        }
        return group;
    }

    public GroupDto toDto(Group group) {
        List<com.splitpay.dto.response.UserDto> members = group.getMemberIds().stream()
                .map(id -> {
                    try {
                        return userService.toDto(userService.findById(id));
                    } catch (ResourceNotFoundException e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .toList();

        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .createdBy(group.getCreatedBy())
                .members(members)
                .createdAt(group.getCreatedAt())
                .build();
    }
}
