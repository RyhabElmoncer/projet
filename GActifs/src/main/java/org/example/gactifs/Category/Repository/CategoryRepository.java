package org.example.gactifs.Category.Repository;

import org.example.gactifs.Category.models.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByCode(String code);

    @Query("SELECT COUNT(c) FROM Category c WHERE c.actif = true")
    long countActive();

    @Query("SELECT COUNT(c) FROM Category c WHERE c.actif = false")
    long countInactive();
}
