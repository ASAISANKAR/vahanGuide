package com.vahanguide.api.purchase;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "purchase_projects")
public class PurchaseProject {
    @Id
    private UUID id;

    @NotBlank
    @Column(nullable = false)
    private String vehicleType = "Car";

    @NotBlank
    @Column(nullable = false)
    private String vehicleName = "";

    private String variant = "";
    private String city = "";
    private String stage = "Researching";
    private BigDecimal exShowroom = BigDecimal.ZERO;
    private BigDecimal registration = BigDecimal.ZERO;
    private BigDecimal insurance = BigDecimal.ZERO;
    private BigDecimal accessories = BigDecimal.ZERO;
    private BigDecimal other = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> checks = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Boolean> documents = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> issueNotes = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> issueSeverities = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> issueStatuses = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> quotationItems = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = Instant.now();
        updatedAt = createdAt;
        applyDefaults();
    }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); applyDefaults(); }

    private void applyDefaults() {
        if (checks == null) checks = new LinkedHashMap<>();
        if (documents == null) documents = new LinkedHashMap<>();
        if (issueNotes == null) issueNotes = new LinkedHashMap<>();
        if (quotationItems == null) quotationItems = new ArrayList<>();
        if (exShowroom == null) exShowroom = BigDecimal.ZERO;
        if (registration == null) registration = BigDecimal.ZERO;
        if (insurance == null) insurance = BigDecimal.ZERO;
        if (accessories == null) accessories = BigDecimal.ZERO;
        if (other == null) other = BigDecimal.ZERO;
        if (issueSeverities == null) issueSeverities = new LinkedHashMap<>();
        if (issueStatuses == null) issueStatuses = new LinkedHashMap<>();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public String getVehicleName() { return vehicleName; }
    public void setVehicleName(String vehicleName) { this.vehicleName = vehicleName; }
    public String getVariant() { return variant; }
    public void setVariant(String variant) { this.variant = variant; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public BigDecimal getExShowroom() { return exShowroom; }
    public void setExShowroom(BigDecimal exShowroom) { this.exShowroom = exShowroom; }
    public BigDecimal getRegistration() { return registration; }
    public void setRegistration(BigDecimal registration) { this.registration = registration; }
    public BigDecimal getInsurance() { return insurance; }
    public void setInsurance(BigDecimal insurance) { this.insurance = insurance; }
    public BigDecimal getAccessories() { return accessories; }
    public void setAccessories(BigDecimal accessories) { this.accessories = accessories; }
    public BigDecimal getOther() { return other; }
    public void setOther(BigDecimal other) { this.other = other; }
    public Map<String, String> getChecks() { return checks; }
    public void setChecks(Map<String, String> checks) { this.checks = checks; }
    public Map<String, Boolean> getDocuments() { return documents; }
    public void setDocuments(Map<String, Boolean> documents) { this.documents = documents; }
    public Map<String, String> getIssueNotes() { return issueNotes; }
    public void setIssueNotes(Map<String, String> issueNotes) { this.issueNotes = issueNotes; }
    public List<Map<String, Object>> getQuotationItems() { return quotationItems; }
    public void setQuotationItems(List<Map<String, Object>> quotationItems) { this.quotationItems = quotationItems; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Map<String, String> getIssueSeverities() {
        return issueSeverities;
    }

    public void setIssueSeverities(Map<String, String> issueSeverities) {
        this.issueSeverities = issueSeverities;
    }

    public Map<String, String> getIssueStatuses() {
        return issueStatuses;
    }

    public void setIssueStatuses(Map<String, String> issueStatuses) {
        this.issueStatuses = issueStatuses;
    }
}
