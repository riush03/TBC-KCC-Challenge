"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const identity_controller_1 = require("../controllers/identity.controller");
const router = express_1.default.Router();
const identityController = new identity_controller_1.IdentityController();
// Route for issuing a credential
router.post('/issue-credential', identityController.issueCredential.bind(identityController));
// Route for getting the status of the issuer
router.get('/status', identityController.getStatus.bind(identityController));
exports.default = router;
