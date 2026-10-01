export declare class CryptoService {
    private readonly algorithm;
    private readonly secretKey;
    encrypt(text: string): {
        encryptedText: string;
        iv: string;
        tag: string;
    };
    decrypt(encryptedText: string, ivHex: string, tagHex: string): string;
}
