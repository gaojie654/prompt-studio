import Queue from 'bull';
import cron from 'node-cron';
import { quotaResetJob } from './quotaReset';

// 图片处理队列
export const imageProcessingQueue = new Queue('image-processing', process.env.BULL_REDIS_URL || 'redis://localhost:6379');

// 邮件队列
export const emailQueueInstance = new Queue('email', process.env.BULL_REDIS_URL || 'redis://localhost:6379');

// 额度重置调度（每天凌晨0点执行）
cron.schedule('0 0 * * *', async () => {
  console.log('[Scheduler] 开始执行每日额度重置任务...');
  await quotaResetJob();
}, {
  timezone: 'Asia/Shanghai',
});

console.log('[Scheduler] 每日额度重置任务已调度 (每天 00:00 Asia/Shanghai)');

imageProcessingQueue.process(async (job) => {
  console.log('Processing image job:', job.id);
  return { processed: true };
});

emailQueueInstance.process(async (job) => {
  console.log('Sending email job:', job.id);
  return { sent: true };
});
