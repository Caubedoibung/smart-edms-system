package com.smartedms.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureInterface;
import org.bouncycastle.cert.jcajce.JcaCertStore;
import org.bouncycastle.cms.CMSProcessableByteArray;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.CMSSignedDataGenerator;
import org.bouncycastle.cms.jcajce.JcaSignerInfoGeneratorBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import org.bouncycastle.util.Store;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.PrivateKey;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.Arrays;
import java.util.Calendar;

@Service
public class PdfSignatureService {

    public byte[] signPdf(InputStream pdfStream, PrivateKey privateKey, Certificate[] certChain, String reason, String location) throws Exception {
        try (PDDocument document = PDDocument.load(pdfStream)) {
            PDSignature signature = new PDSignature();
            signature.setFilter(PDSignature.FILTER_ADOBE_PPKLITE);
            signature.setSubFilter(PDSignature.SUBFILTER_ADBE_PKCS7_DETACHED);
            signature.setName("Smart EDMS Signer");
            signature.setLocation(location != null && !location.isEmpty() ? location : "Hệ thống Smart EDMS");
            signature.setReason(reason != null && !reason.isEmpty() ? reason : "Phê duyệt tài liệu");
            signature.setSignDate(Calendar.getInstance());

            document.addSignature(signature, new CreateSignatureBase(privateKey, certChain));

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.saveIncremental(baos);
            return baos.toByteArray();
        }
    }

    private static class CreateSignatureBase implements SignatureInterface {
        private final PrivateKey privateKey;
        private final Certificate[] certificateChain;

        public CreateSignatureBase(PrivateKey privateKey, Certificate[] certificateChain) {
            this.privateKey = privateKey;
            this.certificateChain = certificateChain;
        }

        @Override
        public byte[] sign(InputStream content) throws IOException {
            try {
                Store<?> certStore = new JcaCertStore(Arrays.asList(certificateChain));
                CMSSignedDataGenerator gen = new CMSSignedDataGenerator();
                X509Certificate cert = (X509Certificate) certificateChain[0];

                ContentSigner sha256Signer = new JcaContentSignerBuilder("SHA256WithRSA").build(privateKey);
                gen.addSignerInfoGenerator(new JcaSignerInfoGeneratorBuilder(
                        new JcaDigestCalculatorProviderBuilder().build())
                        .build(sha256Signer, cert));
                gen.addCertificates(certStore);

                CMSProcessableByteArray msg = new CMSProcessableByteArray(content.readAllBytes());
                CMSSignedData signedData = gen.generate(msg, false);
                return signedData.getEncoded();
            } catch (Exception e) {
                throw new IOException("Lỗi khi tạo định danh CMS để đóng dấu PDF", e);
            }
        }
    }
}
