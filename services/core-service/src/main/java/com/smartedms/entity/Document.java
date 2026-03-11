package com.smartedms.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "documents")
@Data
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String filePath;

    @Column(name = "folder_id")
    private Long folderId;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

}
