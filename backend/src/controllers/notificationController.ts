import { Request, Response } from 'express';
import User from '../models/User';

export const subscribe = async (req: Request, res: Response) => {
  try {
    const { subscription } = req.body;
    const userId = (req as any).user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Avoid duplicates
    const subscriptions = user.pushSubscriptions || [];
    const exists = subscriptions.find((sub: any) => sub.endpoint === subscription.endpoint);
    
    if (!exists) {
      subscriptions.push(subscription);
      user.pushSubscriptions = subscriptions;
      user.markModified('pushSubscriptions');
      await user.save();
    }

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Failed to subscribe' });
  }
};
