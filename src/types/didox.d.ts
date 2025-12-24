export interface DIDOXLoginResponse {
  token: string;
  related_companies?: RelatedCompany[] | null;
  related_branches?: RelatedBranch[] | null;
}

export interface RelatedCompany {
  tin: string;
  name: string;
  roles: number[];
}

export interface RelatedBranch {
  // Define based on API response
  [key: string]: unknown;
}

export interface DIDOXTimestampRequest {
  pkcs7: string;
  signatureHex: string;
}

export interface DIDOXTimestampResponse {
  timeStampTokenB64?: string;
  success: boolean;
  isAttachedPkcs7?: boolean;
  error?: string;
  message?: string;
}

export interface DIDOXLoginRequest {
  signature?: string;
  password?: string;
}

export interface DIDOXProfile {
  vatRate: number | null;
  fullName: string;
  shortName: string;
  tin: string;
  name: string;
  // Add other fields as needed
  [key: string]: unknown;
}

