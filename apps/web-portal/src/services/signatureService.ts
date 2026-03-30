import axiosClient from '../lib/axiosClient';

export const generateKeystore = async (commonName: string, password: string): Promise<Blob> => {
    const response = await axiosClient.post('/v1/signature/generate-keystore', null, {
        params: { commonName, password },
        responseType: 'blob', // Download file
    });
    return response.data;
};

export const verifyKeystore = async (file: File, password: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    const response = await axiosClient.post('/v1/signature/verify-keystore', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const verifyPdf = async (pdfFile: File): Promise<any[]> => {
    const formData = new FormData();
    formData.append('pdfFile', pdfFile);

    const response = await axiosClient.post('/v1/signature/verify-pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

