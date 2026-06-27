import { IsEnum } from 'class-validator';
import { BouleStatus } from '../entities/boule.entity';

export class UpdateBouleDto {
  @IsEnum(BouleStatus)
  status: BouleStatus;
}
