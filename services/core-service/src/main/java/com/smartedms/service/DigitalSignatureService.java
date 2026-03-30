package com.smartedms.service;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigInteger;
import java.security.*;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.Date;

@Service
public class DigitalSignatureService {

    static {
        // Cài đặt BouncyCastle Provider để hỗ trợ các chuẩn mã hóa nâng cao và PKCS12
        Security.addProvider(new org.bouncycastle.jce.provider.BouncyCastleProvider());
    }

    /**
     * Tạo một cặp khóa RSA (2048-bit), kèm tự ký chứng thư số X.509
     * và đóng gói vào một file .p12 (PKCS12) keystore.
     */
    public byte[] generateKeyStore(String commonName, String password) throws Exception {
        // 1. Tạo cặp khóa RSA
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA", "BC");
        keyPairGenerator.initialize(2048, new SecureRandom());
        KeyPair keyPair = keyPairGenerator.generateKeyPair();

        // 2. Tạo chứng thư số (Certificate) tự ký (Self-signed)
        long now = System.currentTimeMillis();
        Date startDate = new Date(now);
        Date endDate = new Date(now + 365L * 24 * 60 * 60 * 1000); // Có hiệu lực 1 năm

        X500Name issuerName = new X500Name("CN=" + commonName);
        BigInteger serialNumber = BigInteger.valueOf(now);
        
        X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                issuerName, serialNumber, startDate, endDate, issuerName, keyPair.getPublic());
        
        ContentSigner contentSigner = new JcaContentSignerBuilder("SHA256WithRSAEncryption")
                .build(keyPair.getPrivate());
        
        X509CertificateHolder certHolder = certBuilder.build(contentSigner);
        X509Certificate certificate = new JcaX509CertificateConverter()
                .setProvider("BC")
                .getCertificate(certHolder);

        // 3. Khởi tạo Keystore định dạng PKCS12
        KeyStore keyStore = KeyStore.getInstance("PKCS12", "BC");
        keyStore.load(null, null);

        // 4. Lưu Private Key và Certificate Chain vào Keystore với mật khẩu
        keyStore.setKeyEntry("alias", keyPair.getPrivate(), password.toCharArray(), new Certificate[]{certificate});

        // 5. Xuất ra mảng byte
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        keyStore.store(baos, password.toCharArray());
        byte[] p12Data = baos.toByteArray();
        
        // Clear memory (tránh lộ thông tin)
        baos.close();
        
        return p12Data;
    }

    /**
     * Trích xuất PrivateKey và Certificate Chain từ luồng đọc file PKCS12
     */
    public KeyStoreData extractKeyStoreData(InputStream p12Stream, String password) throws Exception {
        KeyStore keyStore = KeyStore.getInstance("PKCS12", "BC");
        keyStore.load(p12Stream, password.toCharArray());

        String alias = keyStore.aliases().nextElement();
        PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias, password.toCharArray());
        Certificate[] certChain = keyStore.getCertificateChain(alias);

        return new KeyStoreData(privateKey, certChain);
    }

    public static class KeyStoreData {
        private final PrivateKey privateKey;
        private final Certificate[] certificateChain;

        public KeyStoreData(PrivateKey privateKey, Certificate[] certificateChain) {
            this.privateKey = privateKey;
            this.certificateChain = certificateChain;
        }

        public PrivateKey getPrivateKey() {
            return privateKey;
        }

        public Certificate[] getCertificateChain() {
            return certificateChain;
        }
    }
}
