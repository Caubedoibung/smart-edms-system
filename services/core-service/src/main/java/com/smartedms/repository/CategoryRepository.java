package com.smartedms.repository;

import com.smartedms.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByParentIdAndIsDeletedFalse(Long parentId);

    List<Category> findByParentId(Long parentId);

}
