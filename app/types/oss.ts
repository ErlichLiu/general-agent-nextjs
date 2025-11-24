export interface OSSConfig {
  username: string;
  password: string;
  uid: string;
  fieldName: string;
  formHeadUuid: string;
  apiHost: string;
  apiOrigin: string;
}

export interface AuthInfo {
  token: string;
  cookie: string;
}

export interface OSSUploadConfig {
  accessid: string;
  policy: string;
  signature: string;
  dir: string;
  host: string;
  expire: number;
}

export interface ResourceInfo {
  id: string;
  name: string;
  url: string;
  size: number;
}

export interface UploadResult {
  success: boolean;
  taskId: string;
  uploadedFiles: number;
  totalSize: number;
  totalSizeFormatted: string;
  primaryReport: {
    name: string;
    size: number;
    sizeFormatted: string;
  };
  resources: ResourceInfo[];
  uploadDetails: any[];
}

export interface FrontendConfig {
  queryId: string;        // 企业ID
  requirementId: string;  // 需求单ID
}
