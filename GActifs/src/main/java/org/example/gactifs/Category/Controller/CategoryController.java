package org.example.gactifs.Category.Controller;
import lombok.RequiredArgsConstructor;
import org.example.gactifs.Category.Service.CategoryService;
import org.example.gactifs.Category.models.Category;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/auth/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public List<Category> getAll() {
        return categoryService.getAll();
    }

    @GetMapping("/active")
    public List<Category> getActive() {
        return categoryService.getActive();
    }

    @GetMapping("/{id}")
    public Category getById(@PathVariable Long id) {
        return categoryService.getById(id);
    }

    @PostMapping
    public Category create(@RequestBody Category category) {
        return categoryService.create(category);
    }

    @PutMapping("/{id}")
    public Category update(@PathVariable Long id, @RequestBody Category category) {
        return categoryService.update(id, category);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-status")
    public Category toggleStatus(@PathVariable Long id) {
        return categoryService.toggleStatus(id);
    }

    @GetMapping("/check-code")
    public boolean checkCode(@RequestParam String code,
                             @RequestParam(required = false) Long excludeId) {
        return categoryService.checkCodeExists(code, excludeId);
    }

    @GetMapping("/statistics")
    public Map<String, Long> getStatistics() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", categoryService.countTotal());
        stats.put("active", categoryService.countActive());
        stats.put("inactive", categoryService.countInactive());
        return stats;
    }
}
