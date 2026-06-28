import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { VendeursService } from './vendeurs.service';
import { CreateVendeurDto } from './dto/create-vendeur.dto';
import { UpdateVendeurDto } from './dto/update-vendeur.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { LogsService } from '../logs/logs.service';
import { ActionType } from '../logs/entities/log.entity';

@Controller('vendeurs')
export class VendeursController {
  constructor(
    private readonly vendeursService: VendeursService,
    private readonly logsService: LogsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  async create(@Request() req: any, @Body() createVendeurDto: CreateVendeurDto) {
    const result = await this.vendeursService.create(createVendeurDto);
    this.logsService.create({
      action: ActionType.CREATE,
      entityType: 'Vendeur',
      entityId: result.id,
      userId: req.user.id,
      details: { username: createVendeurDto.username },
    });
    return result;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR, UserRole.COMPTABLE)
  findAll() {
    return this.vendeursService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR, UserRole.COMPTABLE)
  findOne(@Param('id') id: string) {
    return this.vendeursService.findOne(id);
  }

  @Patch('me/pin')
  @UseGuards(JwtAuthGuard)
  async changeMyPin(@Request() req: any, @Body() body: { pin: string }) {
    return this.vendeursService.changePinByUserId(req.user.uuid || req.user.id, body.pin);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  async update(@Request() req: any, @Param('id') id: string, @Body() updateVendeurDto: UpdateVendeurDto) {
    const result = await this.vendeursService.update(id, updateVendeurDto);
    this.logsService.create({
      action: ActionType.UPDATE,
      entityType: 'Vendeur',
      entityId: id,
      userId: req.user.id,
      details: { fields: Object.keys(updateVendeurDto) },
    });
    return result;
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  async toggleActive(@Request() req: any, @Param('id') id: string) {
    const result = await this.vendeursService.toggleActive(id);
    this.logsService.create({
      action: ActionType.UPDATE,
      entityType: 'Vendeur',
      entityId: id,
      userId: req.user.id,
      details: { action: 'toggle-active', isActive: result.isActive },
    });
    return result;
  }

  @Patch(':id/reset-device')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  resetDevice(@Param('id') id: string) {
    return this.vendeursService.resetDeviceId(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.vendeursService.remove(id);
    this.logsService.create({
      action: ActionType.DELETE,
      entityType: 'Vendeur',
      entityId: id,
      userId: req.user.id,
    });
  }
}
