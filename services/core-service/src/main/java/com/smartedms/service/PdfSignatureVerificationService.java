package com.smartedms.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cms.CMSProcessableByteArray;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.SignerInformation;
import org.bouncycastle.cms.SignerInformationStore;
import org.bouncycastle.cms.jcajce.JcaSimpleSignerInfoVerifierBuilder;
import org.bouncycastle.util.Store;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service
public class PdfSignatureVerificationService {

    public List<SignatureVerificationResult> verifySignatures(InputStream pdfStream) throws Exception {
        byte[] pdfBytes = pdfStream.readAllBytes();
        List<SignatureVerificationResult> results = new ArrayList<>();
        
        try (PDDocument document = PDDocument.load(pdfBytes)) {
            for (PDSignature sig : document.getSignatureDictionaries()) {
                SignatureVerificationResult result = new SignatureVerificationResult();
                result.setName(sig.getName());
                if (sig.getSignDate() != null) {
                    result.setSignDate(sig.getSignDate().getTime());
                }
                result.setReason(sig.getReason());
                result.setLocation(sig.getLocation());

                byte[] contents = sig.getContents(pdfBytes);
                byte[] signedContent = sig.getSignedContent(pdfBytes);
                
                try {
                    CMSSignedData cms = new CMSSignedData(new CMSProcessableByteArray(signedContent), contents);
                    Store<X509CertificateHolder> store = cms.getCertificates();
                    SignerInformationStore signers = cms.getSignerInfos();
                    Collection<SignerInformation> c = signers.getSigners();
                    
                    boolean isValid = true;
                    
                    for (SignerInformation signer : c) {
                        Collection<X509CertificateHolder> certCollection = store.getMatches(signer.getSID());
                        if (certCollection.isEmpty()) {
                            isValid = false;
                            continue;
                        }
                        
                        X509CertificateHolder certHolder = certCollection.iterator().next();
                        result.setSignerName(certHolder.getSubject().toString());
                        
                        // Xác minh chữ ký với public certificate
                        if (!signer.verify(new JcaSimpleSignerInfoVerifierBuilder().setProvider("BC").build(certHolder))) {
                            isValid = false;
                        }
                    }
                    
                    result.setValid(isValid && !c.isEmpty());
                } catch (Exception e) {
                    result.setValid(false);
                    result.setErrorMessage(e.getMessage());
                }
                
                results.add(result);
            }
        }
        return results;
    }

    public static class SignatureVerificationResult {
        private String name;
        private String signerName;
        private java.util.Date signDate;
        private String reason;
        private String location;
        private boolean isValid;
        private String errorMessage;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSignerName() { return signerName; }
        public void setSignerName(String signerName) { this.signerName = signerName; }
        public java.util.Date getSignDate() { return signDate; }
        public void setSignDate(java.util.Date signDate) { this.signDate = signDate; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public boolean isValid() { return isValid; }
        public void setValid(boolean valid) { isValid = valid; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }
}
