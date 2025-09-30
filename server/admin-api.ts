import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from './db';
import { users, supportTickets, auditLogs, systemSettings } from '../shared/schema';
import { eq, desc, count, sum, gte, lte, and } from 'drizzle-orm';

const router = express.Router();

// Admin authentication middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid admin token' });
  }
};

// Dashboard metrics endpoint
router.get('/metrics', requireAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsersResult,
      recentUsersResult,
      activeSubscriptionsResult,
      openTicketsResult,
      revenueResult
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
      db.select({ count: count() }).from(users).where(eq(users.subscriptionStatus, 'active')),
      db.select({ count: count() }).from(supportTickets).where(eq(supportTickets.status, 'open')),
      db.select({ 
        total: sum(users.lifetimeValue),
        monthly: sum(users.monthlyRevenue)
      }).from(users)
    ]);

    res.json({
      totalUsers: totalUsersResult[0]?.count || 0,
      recentUsers: recentUsersResult[0]?.count || 0,
      activeSubscriptions: activeSubscriptionsResult[0]?.count || 0,
      openTickets: openTicketsResult[0]?.count || 0,
      totalRevenue: revenueResult[0]?.total || 0,
      monthlyRevenue: revenueResult[0]?.monthly || 0
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

// User management endpoints
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status, role } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select().from(users);
    
    if (search) {
      // Add search functionality for email/name
    }
    
    if (status) {
      query = query.where(eq(users.status, status as string));
    }
    
    if (role) {
      query = query.where(eq(users.role, role as string));
    }

    const usersList = await query
      .orderBy(desc(users.createdAt))
      .limit(Number(limit))
      .offset(offset);

    res.json({
      users: usersList,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: usersList.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.params.id));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's support tickets
    const tickets = await db.select().from(supportTickets)
      .where(eq(supportTickets.userId, req.params.id))
      .orderBy(desc(supportTickets.createdAt));

    res.json({
      user,
      tickets,
      stats: {
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        lifetimeValue: user.lifetimeValue || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { status, role, subscriptionStatus } = req.body;
    
    const [updatedUser] = await db
      .update(users)
      .set({
        status,
        role,
        subscriptionStatus,
        updatedAt: new Date()
      })
      .where(eq(users.id, req.params.id))
      .returning();

    // Log admin action
    await logAdminAction(req.user.id, 'user_updated', {
      targetUserId: req.params.id,
      changes: { status, role, subscriptionStatus }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Support ticket management
router.get('/support/tickets', requireAdmin, async (req, res) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      priority: supportTickets.priority,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      userId: supportTickets.userId,
      assignedTo: supportTickets.assignedTo,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id));

    if (status) {
      query = query.where(eq(supportTickets.status, status as string));
    }

    if (priority) {
      query = query.where(eq(supportTickets.priority, priority as string));
    }

    if (assignedTo) {
      query = query.where(eq(supportTickets.assignedTo, assignedTo as string));
    }

    const tickets = await query
      .orderBy(desc(supportTickets.createdAt))
      .limit(Number(limit))
      .offset(offset);

    res.json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: tickets.length
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

router.get('/support/tickets/:id', requireAdmin, async (req, res) => {
  try {
    const [ticket] = await db.select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      description: supportTickets.description,
      priority: supportTickets.priority,
      status: supportTickets.status,
      type: supportTickets.type,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      userId: supportTickets.userId,
      assignedTo: supportTickets.assignedTo,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .where(eq(supportTickets.id, req.params.id));

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Failed to fetch ticket' });
  }
});

router.patch('/support/tickets/:id', requireAdmin, async (req, res) => {
  try {
    const { status, priority, assignedTo, response } = req.body;

    const [updatedTicket] = await db
      .update(supportTickets)
      .set({
        status,
        priority,
        assignedTo,
        response,
        updatedAt: new Date()
      })
      .where(eq(supportTickets.id, req.params.id))
      .returning();

    // Log admin action
    await logAdminAction(req.user.id, 'ticket_updated', {
      ticketId: req.params.id,
      changes: { status, priority, assignedTo }
    });

    res.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
});

// Revenue analytics
router.get('/revenue/overview', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get revenue by subscription tier
    const subscriptionRevenue = await db
      .select({
        plan: users.subscriptionPlan,
        count: count(),
        revenue: sum(users.monthlyRevenue)
      })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, 'active'),
          gte(users.createdAt, start),
          lte(users.createdAt, end)
        )
      )
      .groupBy(users.subscriptionPlan);

    // Calculate growth metrics
    const currentPeriod = await db
      .select({ revenue: sum(users.monthlyRevenue) })
      .from(users)
      .where(gte(users.createdAt, start));

    const previousPeriod = await db
      .select({ revenue: sum(users.monthlyRevenue) })
      .from(users)
      .where(
        and(
          gte(users.createdAt, new Date(start.getTime() - (end.getTime() - start.getTime()))),
          lte(users.createdAt, start)
        )
      );

    const currentRevenue = currentPeriod[0]?.revenue || 0;
    const previousRevenue = previousPeriod[0]?.revenue || 0;
    const growth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    res.json({
      overview: {
        currentRevenue,
        previousRevenue,
        growth: Math.round(growth * 100) / 100
      },
      breakdown: subscriptionRevenue
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ message: 'Failed to fetch revenue analytics' });
  }
});

// System settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await db.select().from(systemSettings);
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

router.patch('/settings/:key', requireAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    
    const [updatedSetting] = await db
      .update(systemSettings)
      .set({ 
        value,
        updatedAt: new Date(),
        updatedBy: req.user.id
      })
      .where(eq(systemSettings.key, req.params.key))
      .returning();

    // Log admin action
    await logAdminAction(req.user.id, 'setting_updated', {
      key: req.params.key,
      value
    });

    res.json({ setting: updatedSetting });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Failed to update setting' });
  }
});

// Audit logs
router.get('/audit-logs', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, userId, action } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
      userId: auditLogs.userId,
      userEmail: users.email
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id));

    if (userId) {
      query = query.where(eq(auditLogs.userId, userId as string));
    }

    if (action) {
      query = query.where(eq(auditLogs.action, action as string));
    }

    const logs = await query
      .orderBy(desc(auditLogs.createdAt))
      .limit(Number(limit))
      .offset(offset);

    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: logs.length
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

// Utility function to log admin actions
async function logAdminAction(adminId: string, action: string, details: any) {
  try {
    await db.insert(auditLogs).values({
      userId: adminId,
      action,
      details: JSON.stringify(details),
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

export default router;