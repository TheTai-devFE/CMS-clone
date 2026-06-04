export declare class CreateScheduleDto {
    scheduleName: string;
    playlistId?: string;
    templateId?: string;
    deviceIds: string[];
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    dayOfWeek?: number[];
}
