import { PartialType } from '@nestjs/mapped-types';
import { CreateVendeurDto } from './create-vendeur.dto';

export class UpdateVendeurDto extends PartialType(CreateVendeurDto) {}
