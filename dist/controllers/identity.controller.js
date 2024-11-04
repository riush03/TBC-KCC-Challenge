"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityController = void 0;
const web5_service_1 = require("../services/web5.service");
class IdentityController {
    constructor() {
        this.web5Service = web5_service_1.Web5Service.getInstance();
    }
    validateCredentialData(data) {
        if (!data.countryOfResidence || !/^[A-Z]{2}$/.test(data.countryOfResidence)) {
            throw new Error('Invalid country of residence code');
        }
        if (data.jurisdiction && !/^[A-Z]{2}$/.test(data.jurisdiction.country)) {
            throw new Error('Invalid jurisdiction country code');
        }
        return true;
    }
    issueCredential(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield this.web5Service.initialize();
                const protocolInstalled = yield this.web5Service.installProtocol();
                if (!protocolInstalled) {
                    throw new Error('Failed to install VC protocol');
                }
                const credentialJwt = yield this.web5Service.createVerifiableCredential(customerDid, credentialData);
                yield this.web5Service.getWritePermission();
                const recordId = yield this.web5Service.storeCredential(customerDid, credentialJwt);
                const response = {
                    issuerDid: this.web5Service.getIssuerDid(),
                    credentialJwt,
                    recordId,
                    status: 'success'
                };
                res.json(response);
            }
            catch (error) {
                console.error('Credential issuance failed:', error);
                res.status(500).json({
                    error: 'Credential issuance failed',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    getStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.web5Service.initialize();
                res.json({
                    status: 'connected',
                    issuerDid: this.web5Service.getIssuerDid()
                });
            }
            catch (error) {
                res.status(500).json({
                    error: 'Failed to get status',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
}
exports.IdentityController = IdentityController;
