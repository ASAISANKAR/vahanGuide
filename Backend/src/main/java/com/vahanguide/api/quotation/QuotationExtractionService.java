package com.vahanguide.api.quotation;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuotationExtractionService {

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?:₹|Rs\\.?\\s*)?\\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\\.[0-9]{1,2})?|[0-9]+(?:\\.[0-9]{1,2})?)"
    );

    public List<Map<String, Object>> extract(MultipartFile file) throws Exception {

        String filename = Objects.requireNonNull(file.getOriginalFilename())
                .toLowerCase(Locale.ROOT);

        String extractedText;

        if (filename.endsWith(".pdf")) {
            extractedText = extractPdf(file.getBytes());
        } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            extractedText = extractExcel(file.getBytes());
        } else {
            throw new IllegalArgumentException(
                    "Only PDF, XLS and XLSX files are supported."
            );
        }

        return extractLineItems(extractedText);
    }

    private String extractPdf(byte[] bytes) throws Exception {

        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractExcel(byte[] bytes) throws Exception {

        StringBuilder text = new StringBuilder();

        try (Workbook workbook = WorkbookFactory.create(
                new ByteArrayInputStream(bytes))) {

            DataFormatter formatter = new DataFormatter();
            FormulaEvaluator evaluator =
                    workbook.getCreationHelper().createFormulaEvaluator();

            for (Sheet sheet : workbook) {
                for (Row row : sheet) {

                    List<String> cells = new ArrayList<>();

                    for (Cell cell : row) {
                        String value = formatter.formatCellValue(cell, evaluator);

                        if (value != null && !value.isBlank()) {
                            cells.add(value.trim());
                        }
                    }

                    if (!cells.isEmpty()) {
                        text.append(String.join(" | ", cells)).append("\n");
                    }
                }
            }
        }

        return text.toString();
    }

    private List<Map<String, Object>> extractLineItems(String text) {

        List<Map<String, Object>> items = new ArrayList<>();

        if (text == null || text.isBlank()) {
            return items;
        }

        String[] lines = text.split("\\R");

        for (String originalLine : lines) {

            String line = originalLine.trim();

            if (line.length() < 3) {
                continue;
            }

            Matcher matcher = AMOUNT_PATTERN.matcher(line);

            BigDecimal amount = null;

            while (matcher.find()) {
                try {
                    amount = new BigDecimal(
                            matcher.group(1).replace(",", "")
                    );
                } catch (NumberFormatException ignored) {
                    // Ignore malformed numeric values.
                }
            }

            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            String category = identifyCategory(line);

            Map<String, Object> item = new LinkedHashMap<>();

            item.put("description", line);
            item.put("amount", amount);
            item.put("category", category);
            item.put("confidence",
                    "UNKNOWN".equals(category) ? "LOW" : "MEDIUM");
            item.put("reviewRequired", true);
            item.put("selected", false);

            items.add(item);
        }

        return items;
    }

    private String identifyCategory(String line) {

        String value = line.toLowerCase(Locale.ROOT);

        if (containsAny(value, "ex-showroom", "ex showroom", "exshowroom")) {
            return "EX_SHOWROOM";
        }

        if (containsAny(value, "registration", "rto", "road tax")) {
            return "REGISTRATION";
        }

        if (containsAny(value, "insurance", "premium")) {
            return "INSURANCE";
        }

        if (containsAny(value, "accessor")) {
            return "ACCESSORIES";
        }

        if (containsAny(value, "discount", "exchange bonus", "corporate bonus")) {
            return "DISCOUNT";
        }

        if (containsAny(value, "extended warranty", "ew")) {
            return "EXTENDED_WARRANTY";
        }

        if (containsAny(value, "warranty")) {
            return "WARRANTY";
        }

        if (containsAny(value, "handling", "logistics", "handling charges")) {
            return "HANDLING";
        }

        if (containsAny(value, "fastag", "fast tag")) {
            return "FASTAG";
        }

        return "UNKNOWN";
    }

    private boolean containsAny(String value, String... keywords) {

        for (String keyword : keywords) {
            if (value.contains(keyword)) {
                return true;
            }
        }

        return false;
    }
}