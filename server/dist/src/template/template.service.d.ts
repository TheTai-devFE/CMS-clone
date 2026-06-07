import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
export declare class TemplateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTemplateDto, userId: string): Promise<({
        zones: {
            id: string;
            name: string;
            y: number;
            type: string;
            templateId: string;
            width: number;
            height: number;
            x: number;
            contentData: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
        width: number;
        height: number;
        orientation: string;
    }) | null>;
    findAll(userId: string, role: string): Promise<({
        zones: {
            id: string;
            name: string;
            y: number;
            type: string;
            templateId: string;
            width: number;
            height: number;
            x: number;
            contentData: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
        width: number;
        height: number;
        orientation: string;
    })[]>;
    findOne(id: string, userId: string, role: string): Promise<{
        zones: {
            id: string;
            name: string;
            y: number;
            type: string;
            templateId: string;
            width: number;
            height: number;
            x: number;
            contentData: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
        width: number;
        height: number;
        orientation: string;
    }>;
    update(id: string, dto: CreateTemplateDto, userId: string, role: string): Promise<({
        zones: {
            id: string;
            name: string;
            y: number;
            type: string;
            templateId: string;
            width: number;
            height: number;
            x: number;
            contentData: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
        width: number;
        height: number;
        orientation: string;
    }) | null>;
    remove(id: string, userId: string, role: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
        width: number;
        height: number;
        orientation: string;
    }>;
}
