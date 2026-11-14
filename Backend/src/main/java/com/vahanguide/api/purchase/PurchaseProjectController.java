package com.vahanguide.api.purchase;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchases")
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
public class PurchaseProjectController {
    private final PurchaseProjectRepository repository;

    public PurchaseProjectController(PurchaseProjectRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<PurchaseProject> list() { return repository.findAll(); }

    @GetMapping("/{id}")
    public PurchaseProject get(@PathVariable UUID id) { return findOr404(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseProject create(@Valid @RequestBody PurchaseProject project) {
        project.setId(null);
        return repository.save(project);
    }

    @PutMapping("/{id}")
    public PurchaseProject update(@PathVariable UUID id, @Valid @RequestBody PurchaseProject input) {
        PurchaseProject current = findOr404(id);
        current.setVehicleType(input.getVehicleType());
        current.setVehicleName(input.getVehicleName());
        current.setVariant(input.getVariant());
        current.setCity(input.getCity());
        current.setStage(input.getStage());
        current.setExShowroom(input.getExShowroom());
        current.setRegistration(input.getRegistration());
        current.setInsurance(input.getInsurance());
        current.setAccessories(input.getAccessories());
        current.setOther(input.getOther());
        current.setChecks(input.getChecks());
        current.setDocuments(input.getDocuments());
        current.setIssueNotes(input.getIssueNotes());
        current.setIssueSeverities(input.getIssueSeverities());
        current.setIssueStatuses(input.getIssueStatuses());
        current.setQuotationItems(input.getQuotationItems());
        return repository.save(current);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { repository.delete(findOr404(id)); }

    private PurchaseProject findOr404(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase project not found"));
    }
}
