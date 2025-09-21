package org.example.gactifs.auth.Model;


import lombok.*;
import org.example.gactifs.auth.enums.Role;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {

    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
    private LocalDate registrationDate;


}

