import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateService } from './template.service';
export declare class TemplateController {
    private readonly templateService;
    constructor(templateService: TemplateService);
    create(dto: CreateTemplateDto, user: {
        id: string;
    }): Promise<({
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
    findAll(user: {
        id: string;
        role: string;
    }): Promise<({
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
    findOne(id: string, user: {
        id: string;
        role: string;
    }): Promise<{
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
    update(id: string, dto: CreateTemplateDto, user: {
        id: string;
        role: string;
    }): Promise<({
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
    remove(id: string, user: {
        id: string;
        role: string;
    }): Promise<{
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
