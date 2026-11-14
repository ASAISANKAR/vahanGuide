package com.vahanguide.api.pdi;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchases/{purchaseProjectId}/pdi-photos")
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
public class PdiPhotoController {

    private final PdiPhotoService photoService;

    public PdiPhotoController(PdiPhotoService photoService) {
        this.photoService = photoService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PdiPhotoResponse upload(
            @PathVariable UUID purchaseProjectId,
            @RequestParam("checklistItemId") String checklistItemId,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam("file") MultipartFile file
    ) {
        return photoService.upload(
                purchaseProjectId,
                checklistItemId,
                caption,
                file
        );
    }

    @GetMapping
    public List<PdiPhotoResponse> list(
            @PathVariable UUID purchaseProjectId
    ) {
        return photoService.list(purchaseProjectId);
    }

    @DeleteMapping("/{photoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID purchaseProjectId,
            @PathVariable UUID photoId
    ) {
        photoService.delete(purchaseProjectId, photoId);
    }
}