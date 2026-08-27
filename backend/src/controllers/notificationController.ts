import { Request, Response } from 'express';
import User from '../models/User';

export const subscribe = async (req: Request, res: Response) => {
  try {
    const { subscription } = req.body;
    const userId = (req as any).user?.id;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }

    // Atomic update to prevent VersionError on concurrent requests
    await User.updateOne(
      { _id: userId, 'pushSubscriptions.endpoint': { $ne: subscription.endpoint } },
      { $push: { pushSubscriptions: subscription } }
    );

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Failed to subscribe' });
  }
};
