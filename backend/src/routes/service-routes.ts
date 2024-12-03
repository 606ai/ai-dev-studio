import express from 'express';
import modelRoutes from './model';
import versionRoutes from './version';
import deploymentRoutes from './deployment';

const router = express.Router();

// Mount service-based routes
router.use('/models', modelRoutes);
router.use('/versions', versionRoutes);
router.use('/deployments', deploymentRoutes);

export default router;
