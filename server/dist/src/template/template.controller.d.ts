import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateService } from './template.service';
export declare class TemplateController {
    private readonly templateService;
    constructor(templateService: TemplateService);
    create(dto: CreateTemplateDto, user: {
        id: string;
    }): Promise<any>;
    findAll(user: {
        id: string;
        role: string;
    }): Promise<any>;
    findOne(id: string, user: {
        id: string;
        role: string;
    }): Promise<any>;
    update(id: string, dto: CreateTemplateDto, user: {
        id: string;
        role: string;
    }): Promise<any>;
    remove(id: string, user: {
        id: string;
        role: string;
    }): Promise<any>;
}
