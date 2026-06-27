import { PartialType } from '@nestjs/mapped-types';
import { CreateSuccursaleDto } from './create-succursale.dto';

export class UpdateSuccursaleDto extends PartialType(CreateSuccursaleDto) {}
