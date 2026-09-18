/**
 * Domain Template Service for SahAI Field Reusable Platform
 * 
 * Enables SahAI Field to be reused across diverse rural fieldwork domains:
 * - Public Health & ASHA workers (ABDM / Ayushman Bharat compliant)
 * - Agricultural Surveys & Crop Insurance (PMFBY compliant)
 * - Financial Inclusion & Doorstep Banking (SHG / KYC)
 * - Disaster Relief & Infrastructure Assessments (NDMA compliant)
 * - Custom Organization-defined schemas
 */

import { storageService } from './storageService';

export const BUILTIN_TEMPLATES = [
  {
    id: 'health_v1',
    name: 'Maternal & Primary Healthcare',
    category: 'Health Visit',
    icon: 'HeartPulse',
    description: 'ASHA & ANM doorstep maternal health, immunizations, vitals, and fever checks.',
    standardsCompliance: 'ABDM / FHIR R4 Draft',
    fields: [
      { key: 'name', label: 'Beneficiary Name', type: 'string', required: true },
      { key: 'age', label: 'Age', type: 'number', required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male', 'Other'] },
      { key: 'issue', label: 'Reported Symptoms / Complaints', type: 'text', required: true },
      { key: 'vitals', label: 'Vitals (BP / Pulse / Temp)', type: 'string' },
      { key: 'prescribed_action', label: 'Medications / First Aid', type: 'string' },
      { key: 'assistance_required', label: 'Referral to Primary Health Centre', type: 'boolean' },
      { key: 'priority', label: 'Triage Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] }
    ],
    sampleDoc: 'Ayushman Bharat Card',
    sampleVoice: 'Visited Sita Devi at her home in Ward 4. She is 38 years old. She reported high fever and continuous cough for 4 days. Blood pressure was measured at 125/82. Temperature 101.4 F. Prescribed paracetamol and scheduled appointment at Community Health Centre on Thursday. Needs urgent follow-up.'
  },
  {
    id: 'insurance_v1',
    name: 'Crop Loss & Farmland Insurance',
    category: 'Insurance Survey',
    icon: 'Sprout',
    description: 'PM Fasal Bima Yojana crop inundation, pest damage, and land parcel surveys.',
    standardsCompliance: 'PMFBY Kharif/Rabi Claim Schema',
    fields: [
      { key: 'name', label: 'Farmer Name', type: 'string', required: true },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { key: 'issue', label: 'Damage Assessment', type: 'text', required: true },
      { key: 'crop_type', label: 'Crop Inundated', type: 'string' },
      { key: 'estimated_loss', label: 'Estimated Loss in INR', type: 'number' },
      { key: 'assistance_required', label: 'Fast-Track Claim Recommendation', type: 'boolean' },
      { key: 'priority', label: 'Claim Urgency', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] }
    ],
    sampleDoc: 'Kisan Credit Record',
    sampleVoice: 'Inspected farmland of Ramesh Kumar in Khizrabad sector. He is 42 years old. Approximately 2.5 acres of paddy crop completely inundated following the flash rain on Sunday. Estimated yield loss is approximately thirty-five thousand rupees. Recommended for urgent claim disbursement under PM Fasal Bima scheme.'
  },
  {
    id: 'banking_v1',
    name: 'Doorstep Banking & Micro-KYC',
    category: 'Banking/KYC',
    icon: 'Landmark',
    description: 'Bank Mitra biometric verification, SHG micro-credit loans, and account opening.',
    standardsCompliance: 'BC / Microfinance Regulatory Standard',
    fields: [
      { key: 'name', label: 'Customer Name', type: 'string', required: true },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male', 'Other'] },
      { key: 'issue', label: 'Loan Purpose / Service Required', type: 'text', required: true },
      { key: 'estimated_loss', label: 'Loan Request Amount (INR)', type: 'number' },
      { key: 'assistance_required', label: 'Credit Approval Recommended', type: 'boolean' },
      { key: 'priority', label: 'Verification Status', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] }
    ],
    sampleDoc: 'Aadhaar Card / PAN',
    sampleVoice: 'Completed doorstep biometric and KYC verification for Anita Bai, age 45. Beneficiary of Mahila Samriddhi self-help group. Current loan request is for twenty thousand rupees for goat rearing expansion. All physical documentation verified against Aadhaar.'
  },
  {
    id: 'disaster_v1',
    name: 'Disaster Relief & Damage Assessment',
    category: 'General Field Survey',
    icon: 'ShieldAlert',
    description: 'Post-flood, cyclone, and seismic house damage inspection for relief aid.',
    standardsCompliance: 'NDMA Emergency Housing Survey',
    fields: [
      { key: 'name', label: 'Head of Household', type: 'string', required: true },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { key: 'issue', label: 'Structural Damage Description', type: 'text', required: true },
      { key: 'estimated_loss', label: 'Estimated Repair Cost (INR)', type: 'number' },
      { key: 'assistance_required', label: 'Emergency Ration / Tarpaulin Needed', type: 'boolean' },
      { key: 'priority', label: 'Habitability Hazard Level', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] }
    ],
    sampleDoc: 'Voter ID / Ration Card',
    sampleVoice: 'Inspected residential dwelling of Mohan Lal, 52 years old in village square. Thatched roof partially collapsed from cyclone wind and wall cracked. Estimated structural repair cost forty thousand rupees. Household needs immediate waterproof tarpaulin and emergency grain ration.'
  }
];

class TemplateService {
  /**
   * Get all active domain templates (built-in + custom from storage)
   */
  async getAllTemplates() {
    const customTemplates = (await storageService.getSetting('custom_templates')) || [];
    return [...BUILTIN_TEMPLATES, ...customTemplates];
  }

  /**
   * Get a template by category or ID
   */
  async getTemplateById(idOrCategory) {
    const templates = await this.getAllTemplates();
    return templates.find(t => t.id === idOrCategory || t.category === idOrCategory) || BUILTIN_TEMPLATES[0];
  }

  /**
   * Save a new custom template
   */
  async saveCustomTemplate(template) {
    const customTemplates = (await storageService.getSetting('custom_templates')) || [];
    const newTemplate = {
      ...template,
      id: template.id || 'custom_' + Date.now(),
      isCustom: true
    };

    const existingIdx = customTemplates.findIndex(t => t.id === newTemplate.id);
    if (existingIdx >= 0) {
      customTemplates[existingIdx] = newTemplate;
    } else {
      customTemplates.push(newTemplate);
    }

    await storageService.setSetting('custom_templates', customTemplates);
    return newTemplate;
  }
}

export const templateService = new TemplateService();
