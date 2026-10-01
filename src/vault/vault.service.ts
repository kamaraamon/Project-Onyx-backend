import { Injectable, NotFoundException } from '@nestjs/common';
import { CryptoService } from '../common/services/crypto.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VaultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService
  ) {}

  /**
   * Chiffre et ajoute des accès dans le coffre-fort de l'utilisateur
   */
  async addCredentials(
    userId: string,
    serviceName: string,
    username: string,
    password: string
  ): Promise<{ id: string; serviceName: string; createdAt: Date }> {
    
    // Chiffrement des accès avec AES-256-GCM
    const encryptedUserResult = this.cryptoService.encrypt(username);
    const encryptedPassResult = this.cryptoService.encrypt(password);
    
    // Stockage en base de données
    const newEntry = await this.prisma.coffreFort.create({
      data: {
        userId,
        serviceName,
        encryptedUsername: encryptedUserResult.encryptedText,
        encryptedPassword: encryptedPassResult.encryptedText,
        iv: `${encryptedUserResult.iv}:${encryptedPassResult.iv}`,
        tag: `${encryptedUserResult.tag}:${encryptedPassResult.tag}`
      }
    });

    return {
      id: newEntry.id,
      serviceName: newEntry.serviceName,
      createdAt: newEntry.createdAt
    };
  }

  /**
   * Récupère la liste des identifiants stockés dans le coffre-fort d'un utilisateur et les déchiffre
   */
  async getCredentials(userId: string): Promise<any[]> {
    const userEntries = await this.prisma.coffreFort.findMany({
      where: { userId }
    });

    return userEntries.map(entry => {
      const [userIv, passIv] = entry.iv.split(':');
      const [userTag, passTag] = entry.tag ? entry.tag.split(':') : ['', ''];

      try {
        const decryptedUsername = this.cryptoService.decrypt(
          entry.encryptedUsername,
          userIv,
          userTag
        );
        const decryptedPassword = this.cryptoService.decrypt(
          entry.encryptedPassword,
          passIv,
          passTag
        );

        return {
          id: entry.id,
          serviceName: entry.serviceName,
          username: decryptedUsername,
          password: decryptedPassword,
          createdAt: entry.createdAt
        };
      } catch (err) {
        return {
          id: entry.id,
          serviceName: entry.serviceName,
          username: '[Erreur de déchiffrement]',
          password: '[Erreur de déchiffrement]',
          createdAt: entry.createdAt
        };
      }
    });
  }

  /**
   * Supprime un enregistrement du coffre-fort
   */
  async deleteCredentials(userId: string, entryId: string): Promise<void> {
    const entry = await this.prisma.coffreFort.findUnique({
      where: { id: entryId }
    });

    if (!entry || entry.userId !== userId) {
      throw new NotFoundException('Identifiant de coffre-fort introuvable.');
    }

    await this.prisma.coffreFort.delete({
      where: { id: entryId }
    });
  }
}
