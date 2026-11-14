package com.vahanguide.api.quotation;

import com.vahanguide.api.purchase.PurchaseProject;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "dealer_quotations")
public class DealerQuotation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_project_id", nullable = false)
    private PurchaseProject purchaseProject;

    @Column(nullable = false)
    private String originalFilename;

    private String contentType;

    private long sizeBytes;

    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(columnDefinition = "bytea", nullable = false)
    private byte[] fileData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> extractedItems = new ArrayList<>();

    private LocalDateTime uploadedAt = LocalDateTime.now();

    public UUID getId() {
        return id;
    }

    public PurchaseProject getPurchaseProject() {
        return purchaseProject;
    }

    public void setPurchaseProject(PurchaseProject purchaseProject) {
        this.purchaseProject = purchaseProject;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public byte[] getFileData() {
        return fileData;
    }

    public void setFileData(byte[] fileData) {
        this.fileData = fileData;
    }

    public List<Map<String, Object>> getExtractedItems() {
        return extractedItems;
    }

    public void setExtractedItems(List<Map<String, Object>> extractedItems) {
        this.extractedItems = extractedItems;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
}