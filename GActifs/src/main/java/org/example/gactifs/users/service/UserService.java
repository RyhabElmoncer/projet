package org.example.gactifs.users.service;

import lombok.RequiredArgsConstructor;
import org.example.gactifs.auth.Model.User;
import org.example.gactifs.auth.Model.UserDTO;
import org.example.gactifs.auth.enums.Role;
import org.example.gactifs.auth.repository.UserRepository;
import org.example.gactifs.users.Mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    // CRUD
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(userMapper::toDTO).collect(Collectors.toList());
    }

    public UserDTO getUserById(UUID id) {
        return userRepository.findById(id).map(userMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserDTO createUser(UserDTO dto, String rawPassword) {
        User user = userMapper.toEntity(dto);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRegistrationDate(LocalDate.now());
        return userMapper.toDTO(userRepository.save(user));
    }

    public UserDTO updateUser(UUID id, UserDTO dto) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setRole(dto.getRole());
        return userMapper.toDTO(userRepository.save(user));
    }

    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }

    // Activation / Désactivation
    public UserDTO activateUser(UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(true);
        return userMapper.toDTO(userRepository.save(user));
    }

    public UserDTO deactivateUser(UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(false);
        return userMapper.toDTO(userRepository.save(user));
    }

    // Changement de mot de passe
    public void changePassword(UUID id, String newPassword) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // Réinitialisation (admin)
    public String resetPassword(UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);
        return tempPassword;
    }

    // Recherche
    public List<UserDTO> searchUsers(String term) {
        return userRepository.findByFirstNameIgnoreCaseContainingOrLastNameIgnoreCaseContaining(term, term)
                .stream().map(userMapper::toDTO).collect(Collectors.toList());
    }

    public List<UserDTO> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream().map(userMapper::toDTO).collect(Collectors.toList());
    }

    public List<UserDTO> getActiveUsers() {
        return userRepository.findByEnabledTrue().stream().map(userMapper::toDTO).collect(Collectors.toList());
    }

    public Map<String, Object> getUserStats() {
        List<User> users = userRepository.findAll();
        Map<Role, Long> byRole = Arrays.stream(Role.values())
                .collect(Collectors.toMap(r -> r, r -> users.stream().filter(u -> u.getRole() == r).count()));
        long active = users.stream().filter(User::isEnabled).count();
        long inactive = users.size() - active;
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", users.size());
        stats.put("active", active);
        stats.put("inactive", inactive);
        stats.put("byRole", byRole);
        return stats;
    }
}
