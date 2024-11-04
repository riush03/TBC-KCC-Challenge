// src/types/identity.ts
import { CredentialSchema } from '@web5/credentials';
import { BearerDid } from '@web5/dids';

export interface CustomerCredential {
  countryOfResidence: string;
  tier?: string;
  jurisdiction?: {
    country: string;
  };
}

export interface EvidenceCheck {
  kind: string;
  checks: string[];
}

export interface VerificationResponse {
  issuerDid: String;
  credentialJwt: string;
  recordId: string;
  status: string;
}

export interface CredentialCreateOptions {
  issuer: string;
  subject: string;
  expirationDate: string;
  data: CustomerCredential;
  credentialSchema: CredentialSchema;
  evidence: EvidenceCheck[];
}