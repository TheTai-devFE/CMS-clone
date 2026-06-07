import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
export declare class TemplateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTemplateDto, userId: string): Promise<any>;
    findAll(userId: string, role: string): Promise<any>;
    findOne(id: string, userId: string, role: string): Promise<any>;
    update(id: string, dto: CreateTemplateDto, userId: string, role: string): Promise<any>;
    remove(id: string, userId: string, role: string): Promise<any>;
}
