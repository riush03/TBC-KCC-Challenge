export interface CustomerCredentialData {
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
  
  export interface CredentialSchema {
    id: string;
    type: string;
  }
  
  export interface CredentialOptions {
    issuer: string;
    subject: string;
    expirationDate: string;
    data: CustomerCredentialData;
    credentialSchema: CredentialSchema[];
    evidence?: EvidenceCheck[];
  }
  
  export interface VerificationResponse {
    credentialJwt: string;
    status: string;
    message: string;
  }
  