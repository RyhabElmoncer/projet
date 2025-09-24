package org.example.gactifs.Category.Service;
import lombok.RequiredArgsConstructor;
import org.example.gactifs.Category.Repository.CategoryRepository;
import org.example.gactifs.Category.models.Category;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    public List<Category> getActive() {
        return categoryRepository.findAll()
                .stream()
                .filter(Category::isActif)
                .toList();
    }

    public Category getById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Catégorie non trouvée"));
    }

    public Category create(Category category) {
        if (categoryRepository.existsByCode(category.getCode())) {
            throw new IllegalArgumentException("Cette catégorie existe déjà");
        }
        category.setDateCreation(LocalDateTime.now());
        category.setDateModification(LocalDateTime.now());
        category.setNombreActifs(0);
        return categoryRepository.save(category);
    }

    public Category update(Long id, Category categoryData) {
        Category category = getById(id);
        category.setNom(categoryData.getNom());
        category.setDescription(categoryData.getDescription());
        category.setCode(categoryData.getCode());
        category.setCouleur(categoryData.getCouleur());
        category.setIcone(categoryData.getIcone());
        category.setActif(categoryData.isActif());
        category.setDateModification(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }

    public Category toggleStatus(Long id) {
        Category category = getById(id);
        category.setActif(!category.isActif());
        category.setDateModification(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    public boolean checkCodeExists(String code, Long excludeId) {
        return categoryRepository.findAll().stream()
                .anyMatch(c -> c.getCode().equalsIgnoreCase(code)
                        && (excludeId == null || !c.getId().equals(excludeId)));
    }

    public long countTotal() {
        return categoryRepository.count();
    }

    public long countActive() {
        return categoryRepository.countActive();
    }

    public long countInactive() {
        return categoryRepository.countInactive();
    }
}
