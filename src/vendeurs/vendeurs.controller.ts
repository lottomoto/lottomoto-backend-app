import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { VendeursService } from './vendeurs.service';
import { CreateVendeurDto } from './dto/create-vendeur.dto';
import { UpdateVendeurDto } from './dto/update-vendeur.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vendeurs')
export class VendeursController {
  constructor(private readonly vendeursService: VendeursService) {}

  @Post()
  create(@Body() createVendeurDto: CreateVendeurDto) {
    return this.vendeursService.create(createVendeurDto);
  }

  @Get()
  findAll() {
    return this.vendeursService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendeursService.findOne(id);
  }

  @Patch('me/pin')
  @UseGuards(JwtAuthGuard)
  async changeMyPin(@Request() req: any, @Body() body: { pin: string }) {
    return this.vendeursService.changePinByUserId(req.user.uuid || req.user.id, body.pin);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVendeurDto: UpdateVendeurDto) {
    return this.vendeursService.update(id, updateVendeurDto);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.vendeursService.toggleActive(id);
  }

  @Patch(':id/reset-device')
  resetDevice(@Param('id') id: string) {
    return this.vendeursService.resetDeviceId(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vendeursService.remove(id);
  }
}
