import { Request, Response } from 'express';
import { Web5Service } from '../services/web5.service';
import { CustomerCredential, VerificationResponse } from '../types/identity';

export class IdentityController {
  private web5Service: Web5Service;

  constructor() {
    this.web5Service =  Web5Service.getInstance();
  }

  private validateCredentialData(data: CustomerCredential): boolean {
    if (!data.countryOfResidence || !/^[A-Z]{2}$/.test(data.countryOfResidence)) {
      throw new Error('Invalid country of residence code');
    }

    if (data.jurisdiction && !/^[A-Z]{2}$/.test(data.jurisdiction.country)) {
      throw new Error('Invalid jurisdiction country code');
    }

    return true;
  }

  async issueCredential(req: Request, res: Response): Promise<void> {
    try {
      const { customerDid, credentialData } = req.body;

      if (!customerDid || !credentialData) {
        res.status(400).json({
          error: 'Missing required parameters',
          message: 'customerDid and credentialData are required'
        });
        return;
      }

      this.validateCredentialData(credentialData);

      await this.web5Service.initialize();
      
      const protocolInstalled = await this.web5Service.installProtocol();
      if (!protocolInstalled) {
        throw new Error('Failed to install VC protocol');
      }

      const credentialJwt = await this.web5Service.createVerifiableCredential(
        customerDid,
        credentialData
      );

      await this.web5Service.getWritePermission();
      const recordId = await this.web5Service.storeCredential(customerDid, credentialJwt);

      const response: VerificationResponse = {
        issuerDid: this.web5Service.getIssuerDid(),
        credentialJwt,
        recordId,
        status: 'success'
      };

      res.json(response);
    } catch (error) {
      console.error('Credential issuance failed:', error);
      res.status(500).json({
        error: 'Credential issuance failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      await this.web5Service.initialize();
      res.json({
        status: 'connected',
        issuerDid: this.web5Service.getIssuerDid()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}