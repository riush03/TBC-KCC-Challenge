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
exports.Web5Service = void 0;
const api_1 = require("@web5/api");
const credentials_1 = require("@web5/credentials");
const node_crypto_1 = require("node:crypto");
const constants_1 = require("../config/constants");
if (!globalThis.crypto)
    globalThis.crypto = node_crypto_1.webcrypto;
class Web5Service {
    constructor() {
        this.initialized = false;
    }
    static getInstance() {
        if (!Web5Service.instance) {
            Web5Service.instance = new Web5Service();
        }
        return Web5Service.instance;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized)
                return;
            try {
                const { web5, did } = yield api_1.Web5.connect({
                    techPreview: {
                        dwnEndpoints: [constants_1.CONFIG.DWN_ENDPOINT]
                    }
                });
                this.web5 = web5;
                this.issuerDid = did;
                ;
                this.initialized = true;
                console.log('Initialized with DID:', did);
            }
            catch (error) {
                console.error('Initialization failed:', error);
                throw new Error(`Web5 initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    createVerifiableCredential(customerDid, credentialData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                yield this.initialize();
            }
            try {
                const evidence = [
                    {
                        kind: 'document_verification',
                        checks: ['passport', 'utility_bill']
                    },
                    {
                        kind: 'sanction_screening',
                        checks: ['PEP']
                    }
                ];
                const credentialSchema = {
                    id: constants_1.CONFIG.SCHEMA_URL,
                    type: 'JsonSchema'
                };
                const credential = yield credentials_1.VerifiableCredential.create({
                    issuer: this.issuerDid.uri,
                    subject: customerDid,
                    expirationDate: constants_1.CONFIG.CREDENTIAL_EXPIRY,
                    data: credentialData,
                    credentialSchema,
                    evidence
                });
                const signedJwt = yield credential.sign({ did: this.issuerDid });
                console.log('Credential created and signed');
                return signedJwt;
            }
            catch (error) {
                console.error('Credential creation failed:', error);
                throw new Error(`Credential creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    installProtocol() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                yield this.initialize();
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
                const { status } = yield this.web5.dwn.protocols.configure({
                    message: {
                        definition: ProtocolDef
                    }
                });
                return status.code === 202;
            }
            catch (error) {
                console.error('Protocol installation failed:', error);
                throw new Error(`Protocol installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    getWritePermission() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                yield this.initialize();
            }
            try {
                const issuerDidUri = encodeURIComponent(this.issuerDid.uri);
                const response = yield fetch(`${constants_1.CONFIG.AUTH_ENDPOINT}?issuerDid=${issuerDidUri}`);
                if (!response.ok) {
                    throw new Error(`Authorization failed: ${response.statusText}`);
                }
                yield response.json();
                console.log('Write permission obtained');
            }
            catch (error) {
                console.error('Write permission failed:', error);
                throw new Error(`Write permission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    storeCredential(customerDid, signedJwt) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                yield this.initialize();
            }
            try {
                const { record } = yield this.web5.dwn.records.create({
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
            }
            catch (error) {
                console.error('Credential storage failed:', error);
                throw new Error(`Credential storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    getIssuerDid() {
        if (!this.initialized) {
            throw new Error('Web5Service not initialized');
        }
        return this.issuerDid.uri;
    }
    getIssuerDidDocument() {
        if (!this.initialized) {
            throw new Error('Web5Service not initialized');
        }
        return this.issuerDid;
    }
}
exports.Web5Service = Web5Service;
