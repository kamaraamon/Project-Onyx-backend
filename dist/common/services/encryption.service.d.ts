export declare class EncryptionService {
    private readonly algorithm;
    private readonly key;
    constructor();
    encrypt(text: string): {
        encryptedData: string;
        iv: string;
        tag: string;
    };
    decrypt(encryptedData: string, iv: string, tag: string): string;
}
