package org.example.gactifs.Reclamation.Service;
import lombok.RequiredArgsConstructor;
import org.example.gactifs.Reclamation.model.Reclamation;
import org.example.gactifs.Reclamation.repository.ReclamationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ReclamationService {

    private final ReclamationRepository reclamationRepository;

    public List<Reclamation> getAll() {
        return reclamationRepository.findAll();
    }

    public Reclamation getById(Long id) {
        return reclamationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Réclamation non trouvée"));
    }

    public Reclamation create(Reclamation reclamation) {
        reclamation.setDateCreation(LocalDateTime.now());
        reclamation.setStatut(Reclamation.StatutReclamation.NOUVELLE);
        reclamation.setNumero(generateNumero());
        return reclamationRepository.save(reclamation);
    }

    public Reclamation update(Long id, Reclamation data) {
        Reclamation reclamation = getById(id);
        reclamation.setObjet(data.getObjet());
        reclamation.setDescription(data.getDescription());
        reclamation.setTypeReclamation(data.getTypeReclamation());
        reclamation.setPriorite(data.getPriorite());
        reclamation.setDateEcheance(data.getDateEcheance());
        reclamation.setTechnicienAssigne(data.getTechnicienAssigne());
        reclamation.setResolution(data.getResolution());
        reclamation.setSatisfactionClient(data.getSatisfactionClient());
        reclamation.setCout(data.getCout());
        return reclamationRepository.save(reclamation);
    }

    public void delete(Long id) {
        reclamationRepository.deleteById(id);
    }

    public Reclamation changerStatut(Long id, Reclamation.StatutReclamation statut) {
        Reclamation reclamation = getById(id);
        reclamation.setStatut(statut);
        return reclamationRepository.save(reclamation);
    }

    private String generateNumero() {
        return "REC-" + System.currentTimeMillis();
    }
}
