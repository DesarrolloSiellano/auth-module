import { MetadataResponse } from "./metadataResponse.interface";

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T[];
  meta: MetadataResponse;
}
