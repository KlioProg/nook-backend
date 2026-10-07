import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PurposeCode } from '../generated/prisma/enums.js';
import { PurposesService } from './purposes.service.js';

@ApiTags('Purposes')
@Controller('purposes')
export class PurposesController {
  constructor(private readonly purposes: PurposesService) {}

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { type: 'string', enum: Object.values(PurposeCode) },
    },
  })
  findAll() {
    return this.purposes.findAll();
  }
}
