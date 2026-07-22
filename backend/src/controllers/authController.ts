import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import EmployeeSession, { IEmployeeSession, ProofType } from '../models/EmployeeSession';
import { ensureEmployeeWorkLogCollection, getEmployeeWorkLogModel } from '../models/EmployeeWorkLog';
import { getAuthenticatedUser } from '../utils/auth';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

const buildUserResponse = (user: IUser) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  designation: user.designation || '',
  department: user.department || '',
  joiningDate: user.joiningDate || '',
  profileCompleted: !!user.profileCompleted,
  approvalStatus: user.approvalStatus || 'NotSubmitted',
  profile: user.profile || {},
  lastLoginAt: user.lastLoginAt || null,
  lastLogoutAt: user.lastLogoutAt || null,
});

const resolveProofType = (options: {
  hasWorkSummary: boolean;
  hasGitLink: boolean;
  hasScreenshot: boolean;
}): ProofType => {
  const proofSources: ProofType[] = [];

  if (options.hasWorkSummary) proofSources.push('text');
  if (options.hasGitLink) proofSources.push('git-link');
  if (options.hasScreenshot) proofSources.push('screenshot');

  if (proofSources.length > 1) {
    return 'multiple';
  }

  return proofSources[0] || 'text';
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userCount = await User.countDocuments({});
    const role = userCount === 0 ? 'admin' : (req.body.role || 'customer');

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        ...buildUserResponse(user),
        token: generateToken((user._id as any).toString()),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const now = new Date();

      if (user.role === 'employee') {
        const employeeLogModel = await ensureEmployeeWorkLogCollection(user._id.toString()).catch(() =>
          getEmployeeWorkLogModel(user._id.toString())
        );

        const activeSession = await EmployeeSession.findOne({
          userId: user._id,
          status: 'active',
        }).sort({ loginAt: -1 });

        if (activeSession) {
          return res.status(409).json({
            message: 'Employee already has an active session. Please logout before logging in again.',
          });
        }

        const session = await EmployeeSession.create({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          loginAt: now,
          status: 'active',
        });

        try {
          await employeeLogModel.create({
            employeeId: user._id,
            sharedSessionId: session._id,
            userName: user.name,
            userEmail: user.email,
            loginAt: now,
            status: 'active',
          });
        } catch (error) {
          console.warn('Unable to create employee work log entry on login:', error);
        }

        user.currentSessionId = session._id as any;
      } else {
        user.currentSessionId = undefined;
      }

      user.lastLoginAt = now;
      await user.save();
      // Record session tracking fields
      await User.updateOne(
        { _id: user._id },
        { $set: { lastLoginAt: new Date(), isOnline: true } }
      );

      res.json({
        ...buildUserResponse(user),
        token: generateToken((user._id as any).toString()),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Logout user (records logout time)
// @route   POST /api/auth/logout
// @access  Protected
// export const logoutUser = async (req: Request, res: Response) => {
//   try {
//     if (req.user?.id) {
//       await User.updateOne(
//         { _id: req.user.id },
//         { $set: { lastLogoutAt: new Date(), isOnline: false } }
//       );
//     }
//     res.json({ message: 'Logged out successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error });
//   }
// };

// @desc    Reset password by email (direct, no token email required)
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address' });
    }

    // Hash the new password manually, then use updateOne to bypass
    // the pre-save hook (which would double-hash if we called user.save())
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Save logout proof and mark the session complete
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    const now = new Date();

    if (user.role === 'employee') {
      const employeeLogModel = await ensureEmployeeWorkLogCollection(user._id.toString()).catch(() =>
        getEmployeeWorkLogModel(user._id.toString())
      );

      const workSummary = typeof req.body.workSummary === 'string' ? req.body.workSummary.trim() : '';
      const gitLink = typeof req.body.gitLink === 'string' ? req.body.gitLink.trim() : '';
      const screenshotFile = req.file as Express.Multer.File | undefined;

      const hasWorkSummary = workSummary.length > 0;
      const hasGitLink = gitLink.length > 0;
      const hasScreenshot = !!screenshotFile;

      if (!hasWorkSummary && !hasGitLink && !hasScreenshot) {
        return res.status(400).json({
          message: 'Please provide a work summary, screenshot, or Git push link before logout.',
        });
      }

      let session: IEmployeeSession | null = null;

      if (user.currentSessionId) {
        session = await EmployeeSession.findById(user.currentSessionId);
      }

      if (!session || session.status !== 'active') {
        session = await EmployeeSession.findOne({
          userId: user._id,
          status: 'active',
        }).sort({ loginAt: -1 });
      }

      if (!session) {
        session = await EmployeeSession.create({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          loginAt: user.lastLoginAt || now,
          status: 'completed',
        });
      }

      let privateLog = await employeeLogModel.findOne({
        sharedSessionId: session._id,
      });

      if (!privateLog) {
        try {
          privateLog = await employeeLogModel.create({
            employeeId: user._id,
            sharedSessionId: session._id,
            userName: user.name,
            userEmail: user.email,
            loginAt: session.loginAt || user.lastLoginAt || now,
            status: 'active',
          });
        } catch (error) {
          console.warn('Unable to create employee work log entry on logout:', error);
        }
      }

      if (hasWorkSummary) {
        session.workSummary = workSummary;
        if (privateLog) {
          privateLog.workSummary = workSummary;
        }
      }

      if (hasGitLink) {
        session.gitLink = gitLink;
        if (privateLog) {
          privateLog.gitLink = gitLink;
        }
      }

      if (hasScreenshot) {
        session.screenshot = `data:${screenshotFile.mimetype};base64,${screenshotFile.buffer.toString('base64')}`;
        if (privateLog) {
          privateLog.screenshot = `data:${screenshotFile.mimetype};base64,${screenshotFile.buffer.toString('base64')}`;
        }
      }

      session.proofType = resolveProofType({
        hasWorkSummary,
        hasGitLink,
        hasScreenshot,
      });
      session.logoutAt = now;
      session.status = 'completed';

      await session.save();

      if (privateLog) {
        privateLog.proofType = session.proofType;
        privateLog.logoutAt = now;
        privateLog.status = 'completed';
        await privateLog.save();
      }

      user.lastLogoutAt = now;
      user.currentSessionId = undefined;
      await user.save();

      return res.json({
        message: 'Logout details saved successfully',
        session,
      });
    }

    user.lastLogoutAt = now;
    await user.save();

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc Get current authenticated user
// @route GET /api/auth/me
// @access Protected
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Not authorised' });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(buildUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
