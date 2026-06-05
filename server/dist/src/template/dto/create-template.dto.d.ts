export declare class CreateZoneDto {
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    contentData?: Record<string, unknown>;
}
export declare class CreateTemplateDto {
    name: string;
    width?: number;
    height?: number;
    orientation?: string;
    zones?: CreateZoneDto[];
}
