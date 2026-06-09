import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateService } from './template.service';

@Controller('api/templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  async create(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.templateService.create(dto, user.id);
  }

  @Get()
  async findAll(@CurrentUser() user: { id: string; role: string }) {
    return this.templateService.findAll(user.id, user.role);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.templateService.findOne(id, user.id, user.role);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.templateService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.templateService.remove(id, user.id, user.role);
  }
}
