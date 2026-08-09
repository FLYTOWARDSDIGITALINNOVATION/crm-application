import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import Lead from '../models/Lead';
import Customer from '../models/Customer';
import User from '../models/User';

// @desc    Convert a lead to a customer
// @route   POST /api/leads/:id/convert
// @access  Public
export const convertLeadToCustomer = async (req: Request, res: Response) => {
  try {
    const { dealValue, notes, phone, advanceAmount, sector } = req.body;
    
    // Parse numeric values since FormData sends them as strings
    const parsedDealValue = parseFloat(dealValue) || 0;
    const parsedAdvanceAmount = parseFloat(advanceAmount) || 0;
    
    // Handle PDF upload
    let pdfUrl = '';
    if (req.file) {
      pdfUrl = `/uploads/${req.file.filename}`;
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // 1. Update lead status
    lead.status = 'Converted';
    await lead.save();

    console.log('convertLeadToCustomer called for email:', lead.email);

    // 2. Check if customer exists, otherwise create
    let customer = await Customer.findOne({ email: { $regex: new RegExp('^' + lead.email + '$', 'i') } });
    console.log('Found existing customer?', !!customer);

    if (customer) {
      // Update existing customer with new deal details if needed
      customer.totalSpent = (customer.totalSpent || 0) + parsedDealValue;
      customer.advanceAmount = (customer.advanceAmount || 0) + parsedAdvanceAmount;
      if (pdfUrl) customer.pdfUrl = pdfUrl;
      if (notes) customer.notes = (customer.notes ? customer.notes + '\n' : '') + notes;
      await customer.save();
    } else {
      customer = await Customer.create({
        leadId: lead._id,
        name: lead.name,
        email: lead.email,
        phone: phone || lead.phone,
        company: lead.company,
        sector: sector || '',
        totalSpent: parsedDealValue,
        advanceAmount: parsedAdvanceAmount,
        pdfUrl: pdfUrl,
        notes: notes || '',
        requirements: lead.notes || notes || '',
        status: 'Active',
        joinedAt: new Date(),
      });
    }

    // 3. Create User account for the customer
    let credentials = null;
    const userExists = await User.findOne({ email: { $regex: new RegExp('^' + lead.email + '$', 'i') } });
    if (!userExists) {
      const password = 'Cust@' + Math.floor(10000 + Math.random() * 90000);
      await User.create({
        name: lead.name,
        email: lead.email,
        password: password,
        role: 'customer',
      });
      credentials = { email: lead.email, password };
      
      customer.portalPassword = password;
      await customer.save();
    } else {
      credentials = { email: lead.email, password: '(Account already exists)' };
    }

    res.status(201).json({ lead, customer, credentials });
  } catch (error) {
    res.status(500).json({ message: 'Server Error converting lead', error });
  }
};

// @desc    Get all leads
// @route   GET /api/leads
// @access  Public (Will be protected later)
export const getLeads = async (req: Request, res: Response) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Server Error retrieving leads', error });
  }
};

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Public
export const createLead = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, status, source, value, notes } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Please provide name and email' });
    }

    const lead = await Lead.create({
      name, email, phone, company, status, source, value, notes
    });

    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating lead', error });
  }
};

// @desc    Update a lead (e.g. status change)
// @route   PUT /api/leads/:id
// @access  Public
export const updateLead = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const previousStatus = lead.status;
    const newStatus = req.body.status;

    // Check if status is changed to Converted
    if (newStatus === 'Converted' && previousStatus !== 'Converted') {
      lead.status = 'Converted';
      await lead.save();

      // Check if Customer already exists
      let customer = await Customer.findOne({ leadId: lead._id });
      if (!customer) {
        customer = await Customer.findOne({ email: lead.email });
      }

      if (!customer) {
        // Create Customer
        customer = await Customer.create({
          leadId: lead._id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          totalSpent: req.body.value || lead.value || 0,
          notes: lead.notes || '',
          requirements: lead.notes || '',
          status: 'Active',
          joinedAt: new Date(),
        });
      }

      // Create User account if not exists
      const userExists = await User.findOne({ email: lead.email });
      if (!userExists) {
        const password = 'Cust@' + Math.floor(10000 + Math.random() * 90000);
        await User.create({
          name: lead.name,
          email: lead.email,
          password: password,
          role: 'customer',
        });
        customer.portalPassword = password;
        await customer.save();
      }

      return res.status(200).json(lead);
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedLead);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating lead', error });
  }
};

// @desc    Add timeline entry to a lead
// @route   POST /api/leads/:id/timeline
// @access  Public
export const addTimelineEntry = async (req: Request, res: Response) => {
  try {
    const { type, content, user } = req.body;
    
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          timeline: {
            $each: [{
              type,
              content,
              user: user || 'Unknown User',
              createdAt: new Date(),
            }],
            $position: 0
          }
        }
      },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json(updatedLead);
  } catch (error) {
    res.status(500).json({ message: 'Server Error adding timeline entry', error });
  }
};

// @desc    Bulk create leads from Excel
// @route   POST /api/leads/bulk
// @access  Public
export const bulkCreateLeads = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    // Read the Excel file from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'The Excel file is empty' });
    }

    // Map Excel columns to Lead model
    const leadsToCreate = data.map((row: any) => {
      const statusInput = row.Status || row.status || 'New';
      // Normalize status: Capitalize first letter (e.g., 'new' -> 'New')
      const status = statusInput.charAt(0).toUpperCase() + statusInput.slice(1).toLowerCase();
      
      const allowedStatuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Not Interested', 'Follow Up', 'Direct Visit'];
      const finalStatus = allowedStatuses.includes(status) ? status : 'New';

      return {
        name: row.Name || row.name || row['Full Name'],
        email: row.Email || row.email,
        phone: row.Phone || row.phone || '',
        company: row.Company || row.company || '',
        source: row.Source || row.source || 'Import',
        status: finalStatus,
        value: row.Value || row.value || 0,
        notes: row.Notes || row.notes || '',
      };
    });

    // Filter out rows missing name or email
    const validLeads = leadsToCreate.filter(lead => lead.name && lead.email);

    if (validLeads.length === 0) {
      return res.status(400).json({ message: 'No valid leads found (Name and Email are required)' });
    }

    // Duplicate Validation Optimization
    const emails = validLeads.map(l => l.email);
    const phones = validLeads.map(l => l.phone).filter(p => p); // non-empty phones

    // Fetch existing records in one query
    const existingRecords = await Lead.find({
      $or: [
        { email: { $in: emails } },
        { phone: { $in: phones } }
      ]
    }).select('email phone');

    const existingEmails = new Set(existingRecords.map(r => r.email));
    const existingPhones = new Set(existingRecords.filter(r => r.phone).map(r => r.phone));

    const leadsToInsert = [];
    const duplicateRecords = [];
    
    // Also track within the uploaded file itself
    const fileSeenEmails = new Set();
    const fileSeenPhones = new Set();

    for (const lead of validLeads) {
      if (existingEmails.has(lead.email) || fileSeenEmails.has(lead.email)) {
        duplicateRecords.push({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          reason: 'Email already exists'
        });
        continue;
      }
      
      if (lead.phone && (existingPhones.has(lead.phone) || fileSeenPhones.has(lead.phone))) {
        duplicateRecords.push({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          reason: 'Phone number already exists'
        });
        continue;
      }

      leadsToInsert.push(lead);
      fileSeenEmails.add(lead.email);
      if (lead.phone) fileSeenPhones.add(lead.phone);
    }

    // Insert into database
    let createdLeads: any[] = [];
    if (leadsToInsert.length > 0) {
      createdLeads = await Lead.insertMany(leadsToInsert);
    }

    res.status(201).json({
      message: `Successfully imported ${createdLeads.length} leads. Skipped ${duplicateRecords.length} duplicates.`,
      totalRecords: validLeads.length,
      imported: createdLeads.length,
      duplicates: duplicateRecords.length,
      duplicateRecords,
      leads: createdLeads
    });
  } catch (error) {
    console.error('Bulk Import Error:', error);
    res.status(500).json({ message: 'Server Error during bulk import', error });
  }
};

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Public
export const deleteLead = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Lead deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error deleting lead', error });
  }
};

