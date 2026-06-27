import { PartialType } from '@nestjs/mapped-types';
import { CreateBorletteDto } from './create-borlette.dto';

export class UpdateBorletteDto extends PartialType(CreateBorletteDto) {}
