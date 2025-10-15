import { MetadataResponse } from "./metadataResponse.interface";

export interface Response<T> {
  statusCode: number;
  message: string;
  url?: string;
  data: T[];
  meta: MetadataResponse;
}
