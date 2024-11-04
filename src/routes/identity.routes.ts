import express from 'express';
import { IdentityController } from '../controllers/identity.controller';

const router = express.Router();
const identityController = new IdentityController();

// Route for issuing a credential
router.post('/issue-credential', identityController.issueCredential.bind(identityController));

// Route for getting the status of the issuer
router.get('/status', identityController.getStatus.bind(identityController));

export default router;
