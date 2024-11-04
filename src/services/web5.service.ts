import { Web5 } from '@web5/api';
import { BearerDid } from '@web5/dids';
import { VerifiableCredential, type CredentialSchema } from '@web5/credentials';
import { webcrypto } from 'node:crypto';
import { CONFIG } from '../config/constants';
import { CustomerCredential, EvidenceCheck } from '../types/identity';

if (!globalThis.crypto) globalThis.crypto = webcrypto as unknown as Crypto;

export class Web5Service {
  private web5!: Web5;
  private issuerDid!: BearerDid;
  private static instance: Web5Service;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): Web5Service {
    if (!Web5Service.instance) {
      Web5Service.instance = new Web5Service();
    }
    return Web5Service.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const { web5, did } = await Web5.connect({
        techPreview: {
          dwnEndpoints: [CONFIG.DWN_ENDPOINT]
        }
      });

      this.web5 = web5;
      this.issuerDid = did as unknown as BearerDid;;
      this.initialized = true;
      console.log('Initialized with DID:', did);
    } catch (error) {
      console.error('Initialization failed:', error);
      throw new Error(`Web5 initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createVerifiableCredential(
    customerDid: string,
    credentialData: CustomerCredential
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const evidence: EvidenceCheck[] = [
        {
          kind: 'document_verification',
          checks: ['passport', 'utility_bill']
        },
        {
          kind: 'sanction_screening',
          checks: ['PEP']
        }
      ];

      const credentialSchema: CredentialSchema = {
        id: CONFIG.SCHEMA_URL,
        type: 'JsonSchema'
      };

      const credential = await VerifiableCredential.create({
        issuer: this.issuerDid.uri,
        subject: customerDid,
        expirationDate: CONFIG.CREDENTIAL_EXPIRY,
        data: credentialData,
        credentialSchema,
        evidence
      });

      const signedJwt = await credential.sign({ did: this.issuerDid });
      console.log('Credential created and signed');
      return signedJwt;
    } catch (error) {
      console.error('Credential creation failed:', error);
      throw new Error(`Credential creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async installProtocol(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const ProtocolDef = {
        protocol: "https://identity.foundation/protocols/verifiable-credentials",
        published: true,
        types: {
          credential: {
            schema: "https://identity.foundation/schemas/verifiable-credential",
            dataFormats: ["application/vc+jwt"]
          }
        },
        structure: {
          credential: {
            $actions: [
              { who: "anyone", can: ["read"] },
              { who: "author", can: ["write"] }
            ]
          }
        }
      };

      const { status } = await this.web5.dwn.protocols.configure({
        message: {
          definition: ProtocolDef
        }
      });

      return status.code === 202;
    } catch (error) {
      console.error('Protocol installation failed:', error);
      throw new Error(`Protocol installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWritePermission(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const issuerDidUri = encodeURIComponent(this.issuerDid.uri);
      const response = await fetch(`${CONFIG.AUTH_ENDPOINT}?issuerDid=${issuerDidUri}`);

      if (!response.ok) {
        throw new Error(`Authorization failed: ${response.statusText}`);
      }

      await response.json();
      console.log('Write permission obtained');
    } catch (error) {
      console.error('Write permission failed:', error);
      throw new Error(`Write permission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async storeCredential(customerDid: string, signedJwt: string) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { record } = await this.web5.dwn.records.create({
        data: signedJwt,
        message: {
          schema: 'KnownCustomerCredential',
          dataFormat: 'application/vc+jwt',
          published: false,
          protocol: 'https://identity.foundation/protocols/verifiable-credentials',
          recipient: customerDid
        },
      });

       // Check if record is defined
    if (!record) {
      throw new Error('Record creation returned undefined');
    }

      console.log('Credential stored successfully');
      return record.id;
    } catch (error) {
      console.error('Credential storage failed:', error);
      throw new Error(`Credential storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getIssuerDid(): string {
    if (!this.initialized) {
      throw new Error('Web5Service not initialized');
    }
    return this.issuerDid.uri;
  }

  getIssuerDidDocument(): BearerDid {
    if (!this.initialized) {
      throw new Error('Web5Service not initialized');
    }
    return this.issuerDid;
  }
}