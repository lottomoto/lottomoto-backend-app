import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { VendeursService } from './vendeurs.service';
import { CreateVendeurDto } from './dto/create-vendeur.dto';
import { UpdateVendeurDto } from './dto/update-vendeur.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('vendeurs')
export class VendeursController {
  constructor(private readonly vendeursService: VendeursService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  create(@Body() createVendeurDto: CreateVendeurDto) {
    return this.vendeursService.create(createVendeurDto);
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
  update(@Param('id') id: string, @Body() updateVendeurDto: UpdateVendeurDto) {
    return this.vendeursService.update(id, updateVendeurDto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  toggleActive(@Param('id') id: string) {
    return this.vendeursService.toggleActive(id);
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
  remove(@Param('id') id: string) {
    return this.vendeursService.remove(id);
  }
}
