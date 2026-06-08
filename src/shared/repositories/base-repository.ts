export type ListOptions = {
  limit?: number;
  cursor?: string;
};

export type PaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
};

export interface BaseRepository<TDocument> {
  findById(id: string): Promise<TDocument | null>;
  list(options?: ListOptions): Promise<PaginatedResult<TDocument>>;
  create(id: string, data: TDocument): Promise<void>;
  update(id: string, data: Partial<TDocument>): Promise<void>;
}
