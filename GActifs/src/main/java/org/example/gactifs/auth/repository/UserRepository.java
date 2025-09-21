package org.example.gactifs.auth.repository;

import org.example.gactifs.auth.Model.User;
import org.example.gactifs.auth.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    List<User> findByRole(Role role); // <-- ajouter cette ligne
    List<User> findByEnabledTrue();

    // Recherche par prénom ou nom (ignore la casse)
    List<User> findByFirstNameIgnoreCaseContainingOrLastNameIgnoreCaseContaining(String firstName, String lastName);

}