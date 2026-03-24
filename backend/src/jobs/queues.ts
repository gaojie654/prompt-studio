import Queue from 'bull';

export const imageProcessQueue = new Queue('image-processing', process.env.BULL_REDIS_URL || 'redis://localhost:6379');

export const emailQueue = new Queue('email', process.env.BULL_REDIS_URL || 'redis://localhost:6379');

imageProcessQueue.process(async (job) => {
  console.log('Processing image job:', job.id);
  return { processed: true };
});

emailQueue.process(async (job) => {
  console.log('Sending email job:', job.id);
  return { sent: true };
});
