package com.splitpay.controller;

import com.splitpay.dto.request.AddMemberRequest;
import com.splitpay.dto.request.GroupRequest;
import com.splitpay.dto.response.GroupDto;
import com.splitpay.security.CurrentUser;
import com.splitpay.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupDto> create(@Valid @RequestBody GroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(CurrentUser.id(), request));
    }

    @GetMapping
    public ResponseEntity<List<GroupDto>> myGroups() {
        return ResponseEntity.ok(groupService.getGroupsForUser(CurrentUser.id()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupDto> getById(@PathVariable String id) {
        return ResponseEntity.ok(groupService.getGroupById(id, CurrentUser.id()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupDto> update(@PathVariable String id, @Valid @RequestBody GroupRequest request) {
        return ResponseEntity.ok(groupService.updateGroup(id, CurrentUser.id(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        groupService.deleteGroup(id, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<GroupDto> addMember(@PathVariable String id, @Valid @RequestBody AddMemberRequest request) {
        return ResponseEntity.ok(groupService.addMember(id, CurrentUser.id(), request));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<GroupDto> removeMember(@PathVariable String id, @PathVariable String userId) {
        return ResponseEntity.ok(groupService.removeMember(id, CurrentUser.id(), userId));
    }
}
