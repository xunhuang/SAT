import { Request, Response } from 'express';
import os from 'os';

/**
 * Simple health check endpoint
 */
export const getHealthStatus = (req: Request, res: Response) => {
  const healthData = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    system: {
      hostname: os.hostname(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAvg: os.loadavg(),
      cpus: os.cpus().length,
    },
  };

  res.status(200).json(healthData);
};

/**
 * Basic readiness check
 */
export const getReadiness = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'Ready',
    timestamp: new Date().toISOString(),
  });
};

export default {
  getHealthStatus,
  getReadiness,
};