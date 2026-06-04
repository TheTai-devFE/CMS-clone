export declare class PlaylistItemDto {
    mediaId: string;
    sortOrder: number;
    duration?: number;
    transitionEffect?: string;
}
export declare class AddPlaylistItemsDto {
    items: PlaylistItemDto[];
}
