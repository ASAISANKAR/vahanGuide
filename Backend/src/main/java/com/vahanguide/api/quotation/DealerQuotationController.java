package com.vahanguide.api.quotation;

import com.vahanguide.api.purchase.PurchaseProject;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchases/{purchaseProjectId}/quotations")
public class DealerQuotationController {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final DealerQuotationRepository quotationRepository;
    private final QuotationExtractionService extractionService;
    private final EntityManager entityManager;

    public DealerQuotationController(
            DealerQuotationRepository quotationRepository,
            QuotationExtractionService extractionService,
            EntityManager entityManager
    ) {
        this.quotationRepository = quotationRepository;
        this.extractionService = extractionService;
        this.entityManager = entityManager;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public QuotationResponse upload(
            @PathVariable UUID purchaseProjectId,
            @RequestParam("file") MultipartFile file
    ) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Please select a quotation file."
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Maximum file size is 10 MB."
            );
        }

        String filename = file.getOriginalFilename();

        if (filename == null ||
                !(filename.toLowerCase().endsWith(".pdf")
                        || filename.toLowerCase().endsWith(".xlsx")
                        || filename.toLowerCase().endsWith(".xls"))) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Supported formats: PDF, XLS and XLSX."
            );
        }

        PurchaseProject project =
                entityManager.find(PurchaseProject.class, purchaseProjectId);

        if (project == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Purchase project not found."
            );
        }

        try {
            DealerQuotation quotation = new DealerQuotation();

            quotation.setPurchaseProject(project);
            quotation.setOriginalFilename(filename);
            quotation.setContentType(file.getContentType());
            quotation.setSizeBytes(file.getSize());
            quotation.setFileData(file.getBytes());

            quotation.setExtractedItems(extractionService.extract(file));

            DealerQuotation saved = quotationRepository.save(quotation);

            return QuotationResponse.from(saved);

        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, ex.getMessage()
            );
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unable to read the quotation. Please check the file."
            );
        }
    }

    @GetMapping
    public List<QuotationResponse> getQuotations(
            @PathVariable UUID purchaseProjectId
    ) {

        return quotationRepository
                .findByPurchaseProject_IdOrderByUploadedAtDesc(purchaseProjectId)
                .stream()
                .map(QuotationResponse::from)
                .toList();
    }

    @DeleteMapping("/{quotationId}")
    public void deleteQuotation(
            @PathVariable UUID purchaseProjectId,
            @PathVariable UUID quotationId
    ) {

        DealerQuotation quotation = quotationRepository
                .findByIdAndPurchaseProject_Id(
                        quotationId, purchaseProjectId
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Quotation not found."
                ));

        quotationRepository.delete(quotation);
    }
}