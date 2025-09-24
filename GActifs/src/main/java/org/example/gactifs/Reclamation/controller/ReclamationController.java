package org.example.gactifs.Reclamation.controller;
import lombok.RequiredArgsConstructor;
import org.example.gactifs.Reclamation.Service.ReclamationService;
import org.example.gactifs.Reclamation.model.Reclamation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reclamations")
@RequiredArgsConstructor
public class ReclamationController {

    private final ReclamationService reclamationService;

    @GetMapping
    public List<Reclamation> getAll() {
        return reclamationService.getAll();
    }

    @GetMapping("/{id}")
    public Reclamation getById(@PathVariable Long id) {
        return reclamationService.getById(id);
    }

    @PostMapping
    public Reclamation create(@RequestBody Reclamation reclamation) {
        return reclamationService.create(reclamation);
    }

    @PutMapping("/{id}")
    public Reclamation update(@PathVariable Long id, @RequestBody Reclamation data) {
        return reclamationService.update(id, data);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reclamationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/statut")
    public Reclamation changerStatut(@PathVariable Long id, @RequestParam Reclamation.StatutReclamation statut) {
        return reclamationService.changerStatut(id, statut);
    }
}
