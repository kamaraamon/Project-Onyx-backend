import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  // Clé secrète de 32 octets (256 bits). Dans un environnement réel, elle doit être chargée via ConfigService
  private readonly secretKey = process.env.ENCRYPTION_KEY 
    ? crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32)
    : Buffer.from('f3b9c8d1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9', 'hex');

  /**
   * Chiffre une chaîne de caractères en utilisant l'algorithme AES-256-GCM
   */
  encrypt(text: string): { encryptedText: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12); // Vecteur d'initialisation recommandé de 12 octets pour GCM
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag().toString('hex');
    
    return {
      encryptedText: encrypted,
      iv: iv.toString('hex'),
      tag: tag,
    };
  }

  /**
   * Déchiffre une chaîne de caractères chiffrée en AES-256-GCM
   */
  decrypt(encryptedText: string, ivHex: string, tagHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
    
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
