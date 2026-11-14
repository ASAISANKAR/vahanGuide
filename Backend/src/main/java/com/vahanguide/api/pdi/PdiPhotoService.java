package com.vahanguide.api.pdi;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vahanguide.api.purchase.PurchaseProject;
import com.vahanguide.api.purchase.PurchaseProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class PdiPhotoService {

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final Cloudinary cloudinary;
    private final PdiPhotoRepository photoRepository;
    private final PurchaseProjectRepository purchaseRepository;

    public PdiPhotoService(
            Cloudinary cloudinary,
            PdiPhotoRepository photoRepository,
            PurchaseProjectRepository purchaseRepository
    ) {
        this.cloudinary = cloudinary;
        this.photoRepository = photoRepository;
        this.purchaseRepository = purchaseRepository;
    }

    @Transactional
    public PdiPhotoResponse upload(
            UUID purchaseProjectId,
            String checklistItemId,
            String caption,
            MultipartFile file
    ) {
        if (!StringUtils.hasText(checklistItemId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Checklist item ID is required"
            );
        }

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Select a photo to upload"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Photo must be 5 MB or smaller"
            );
        }

        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only JPEG, PNG and WebP images are allowed"
            );
        }

        PurchaseProject project = purchaseRepository.findById(purchaseProjectId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Purchase project not found"
                ));

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() == null
                        ? "photo"
                        : file.getOriginalFilename()
        );

        originalFilename = Paths.get(originalFilename)
                .getFileName()
                .toString();

        Map<?, ?> uploadResult;

        try {
            uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "vahanguide/pdi/" + purchaseProjectId,
                            "resource_type", "image"
                    )
            );
        } catch (IOException | RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Could not upload the photo to Cloudinary"
            );
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Could not upload the photo to Cloudinary"
            );
        }

        PdiPhoto photo = new PdiPhoto();
        photo.setPurchaseProject(project);
        photo.setChecklistItemId(checklistItemId.trim());
        photo.setCaption(
                StringUtils.hasText(caption) ? caption.trim() : null
        );
        photo.setCloudinaryPublicId(
                String.valueOf(uploadResult.get("public_id"))
        );
        photo.setImageUrl(
                String.valueOf(uploadResult.get("secure_url"))
        );
        photo.setOriginalFilename(originalFilename);
        photo.setContentType(contentType);
        photo.setSizeBytes(file.getSize());

        return PdiPhotoResponse.from(photoRepository.save(photo));
    }

    @Transactional(readOnly = true)
    public List<PdiPhotoResponse> list(UUID purchaseProjectId) {
        if (!purchaseRepository.existsById(purchaseProjectId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Purchase project not found"
            );
        }

        return photoRepository
                .findByPurchaseProject_IdOrderByCreatedAtDesc(purchaseProjectId)
                .stream()
                .map(PdiPhotoResponse::from)
                .toList();
    }

    @Transactional
    public void delete(UUID purchaseProjectId, UUID photoId) {
        PdiPhoto photo = photoRepository
                .findByIdAndPurchaseProject_Id(photoId, purchaseProjectId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "PDI photo not found"
                ));

        try {
            Map<?, ?> result = cloudinary.uploader().destroy(
                    photo.getCloudinaryPublicId(),
                    ObjectUtils.emptyMap()
            );

            if (!"ok".equals(String.valueOf(result.get("result")))) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Cloudinary did not confirm photo deletion"
                );
            }
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Could not delete the photo from Cloudinary"
            );
        }

        photoRepository.delete(photo);
    }
}