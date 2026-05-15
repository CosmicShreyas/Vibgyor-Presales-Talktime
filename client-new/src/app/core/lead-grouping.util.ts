import { Client, HierarchicalGroup, HierarchicalParentGroup, HierarchicalSingleGroup } from '../models';

export function buildClientHierarchicalGroups(filteredClients: Client[]): {
  hierarchicalGroups: Record<string, HierarchicalGroup>;
  sortedGroupKeys: string[];
} {
  const hierarchicalGroups: Record<string, HierarchicalGroup> = {};
  const csvGroups: Record<string, { fileName: string; importId: string; leads: Client[] }> = {};
  const manualLeads: Client[] = [];
  const brandPartnerGroups: Record<string, { name: string; code: string; leads: Client[] }> = {};
  const facebookCampaigns: Record<string, Client[]> = {};
  const instagramCampaigns: Record<string, Client[]> = {};
  const mappingLeads: Client[] = [];

  filteredClients.forEach((client) => {
    if (client.source === 'Brand Partners' && client.metadata?.brandPartnerName) {
      const brandPartnerName = client.metadata.brandPartnerName;
      const brandPartnerCode = client.metadata.brandPartnerCode || 'Unknown';
      if (!brandPartnerGroups[brandPartnerName]) {
        brandPartnerGroups[brandPartnerName] = { name: brandPartnerName, code: brandPartnerCode, leads: [] };
      }
      brandPartnerGroups[brandPartnerName].leads.push(client);
    } else if (
      client.importMethod === 'csv' &&
      client.csvFileName &&
      client.csvImportId &&
      client.source !== 'Brand Partners'
    ) {
      const csvFileKey = `csv-${client.csvFileName}-${client.csvImportId}`;
      if (!csvGroups[csvFileKey]) {
        csvGroups[csvFileKey] = { fileName: client.csvFileName!, importId: client.csvImportId!, leads: [] };
      }
      csvGroups[csvFileKey].leads.push(client);
    } else if (client.importMethod === 'facebook') {
      const campaignId = client.metadata?.facebookCampaignId || 'unknown';
      const campaignName = client.metadata?.facebookCampaignName || 'Unknown Campaign';
      const key = `facebook-campaign-${campaignId}-${campaignName}`;
      if (!facebookCampaigns[key]) facebookCampaigns[key] = [];
      facebookCampaigns[key].push(client);
    } else if (client.importMethod === 'instagram') {
      const campaignId = client.metadata?.facebookCampaignId || 'unknown';
      const campaignName = client.metadata?.facebookCampaignName || 'Unknown Campaign';
      const key = `instagram-campaign-${campaignId}-${campaignName}`;
      if (!instagramCampaigns[key]) instagramCampaigns[key] = [];
      instagramCampaigns[key].push(client);
    } else if (client.importMethod === 'mapping') {
      mappingLeads.push(client);
    } else {
      manualLeads.push(client);
    }
  });

  if (Object.keys(brandPartnerGroups).length > 0) {
    const sub: HierarchicalParentGroup['subCategories'] = {};
    Object.keys(brandPartnerGroups).forEach((brandPartnerName) => {
      const bp = brandPartnerGroups[brandPartnerName];
      const key = `bp-${bp.code}`;
      sub[key] = { name: `${bp.name} (${bp.code})`, children: { [key]: bp.leads } };
    });
    hierarchicalGroups['brand-partners'] = { type: 'parent', name: 'Brand Partners', subCategories: sub };
  }

  if (Object.keys(csvGroups).length > 0) {
    const children: Record<string, Client[]> = {};
    Object.keys(csvGroups).forEach((k) => {
      children[k] = csvGroups[k].leads;
    });
    hierarchicalGroups['databases'] = {
      type: 'parent',
      name: 'Databases',
      subCategories: { 'csv-imports': { name: 'CSV Imports', children } },
    };
  }

  if (manualLeads.length > 0) {
    hierarchicalGroups['manual'] = { type: 'single', leads: manualLeads };
  }
  if (mappingLeads.length > 0) {
    hierarchicalGroups['mapping'] = { type: 'single', leads: mappingLeads };
  }
  Object.keys(facebookCampaigns).forEach((key) => {
    hierarchicalGroups[key] = { type: 'single', leads: facebookCampaigns[key] };
  });
  Object.keys(instagramCampaigns).forEach((key) => {
    hierarchicalGroups[key] = { type: 'single', leads: instagramCampaigns[key] };
  });

  const sortedGroupKeys = Object.keys(hierarchicalGroups).sort((a, b) => {
    if (a === 'brand-partners') return -1;
    if (b === 'brand-partners') return 1;
    if (a === 'manual') return -1;
    if (b === 'manual') return 1;
    if (a === 'mapping') return -1;
    if (b === 'mapping') return 1;
    if (a === 'databases') return -1;
    if (b === 'databases') return 1;
    if (a.startsWith('facebook-campaign-') && !b.startsWith('facebook-campaign-')) return -1;
    if (b.startsWith('facebook-campaign-') && !a.startsWith('facebook-campaign-')) return 1;
    return a.localeCompare(b);
  });

  return { hierarchicalGroups, sortedGroupKeys };
}
