import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Recupere la file d'attente des taches de conciergerie (SLA 24h)
   * GET /admin/tasks
   */
  @Get('tasks')
  async getTasks() {
    return this.adminService.getTasks();
  }

  /**
   * Dechiffre les identifiants d'un coffre-fort de maniere tracee
   * POST /admin/credentials/decrypt
   */
  @Post('credentials/decrypt')
  async decryptCredentials(
    @Body('coffreFortId') coffreFortId: string
  ) {
    return this.adminService.decryptCredentials(coffreFortId);
  }

  /**
   * Valide et resout un litige d'echange
   * POST /admin/litigation/resolve
   */
  @Post('litigation/resolve')
  async resolveLitigation(
    @Body('litigationId') litigationId: string
  ) {
    return this.adminService.resolveLitigation(litigationId);
  }

  /**
   * Route utilitaire de test pour generer des donnees factices (DX)
   * POST /admin/generate-mock
   */
  @Post('generate-mock')
  async generateMockData() {
    return this.adminService.createMockDataForTesting();
  }
}
