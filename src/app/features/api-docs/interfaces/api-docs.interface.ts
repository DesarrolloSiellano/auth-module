export interface ApiTcpCommand {
  command: string;
  domain: string;
  description: string;
  payloadExample?: Record<string, unknown>;
  responseExample?: Record<string, unknown>;
}

export interface ApiTcpDocs {
  message: string;
  note: string;
  serviceAuth: string;
  total: number;
  domains: string[];
  commands: ApiTcpCommand[];
}

export type RestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRestEndpoint {
  method: RestMethod;
  path: string;
  auth: string;
  description: string;
  requestExample?: Record<string, unknown>;
  responseExample?: Record<string, unknown>;
}

export interface ApiRestDocs {
  message: string;
  note: string;
  total: number;
  domains: string[];
  endpoints: ApiRestEndpoint[];
}
