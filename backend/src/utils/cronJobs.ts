import cron from 'node-cron';
import Task from '../models/Task';
import User from '../models/User';
import { sendPushNotification } from './webpush';

export const startCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const tasks = await Task.find({
        status: 'Pending',
        notified: false
      });

      for (const task of tasks) {
        if (!task.dueDate) continue;
        const dueTime = new Date(task.dueDate);
        // Check if due time is reached and it's not older than 1 hour
        if (now.getTime() >= dueTime.getTime() && (now.getTime() - dueTime.getTime()) < 60 * 60 * 1000) {
          const assignees = await User.find({ _id: { $in: task.assignedTo } });
          
          for (const assignee of assignees) {
            const subscriptions = assignee.pushSubscriptions || [];
            for (const sub of subscriptions) {
              try {
                await sendPushNotification(sub, {
                  title: 'Action Required',
                  body: task.description ? `${task.title}\n${task.description}` : task.title,
                  url: '/tasks'
                });
              } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                  // Sub is no longer valid, we should ideally remove it here.
                }
              }
            }
          }
          
          task.notified = true;
          await task.save();
        }
      }
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });
};
