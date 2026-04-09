import { Router, Request, Response } from 'express';
import { getJob } from '../utils/jobStore';
import { registerClient, removeClient } from '../utils/sseManager';

const router = Router();

router.get('/:jobId', (req: Request, res: Response): void => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Immediately emit current state so late-connecting clients catch up
  for (const [platform, status] of Object.entries(job.statuses)) {
    res.write(`data: ${JSON.stringify({ platform, ...status })}\n\n`);
  }

  registerClient(jobId, res);

  req.on('close', () => {
    removeClient(jobId);
  });
});

export default router;
