export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    const formData = req.body.payload.data;
    const formName = req.body.payload.name;
    
    console.log('Form name:', formName);
    console.log('Received data:', formData);
    
    const API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
    const BASE_URL = `https://${process.env.PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`;

    // Check if this is the career form (has heardaboutus field)
    if (formData.heardaboutus) {
      // Career Form Logic
      const { fullname, emailaddress, phonenumber, heardaboutus, sociallink } = formData;

      // Create Person
      const personRes = await fetch(`${BASE_URL}/persons?api_token=${API_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullname,
          email: [emailaddress],
          phone: [phonenumber]
        })
      });
      const personData = await personRes.json();
      console.log('Person response:', personData);
      
      if (!personData.success || !personData.data) {
        throw new Error(`Failed to create person: ${JSON.stringify(personData)}`);
      }
      const personId = personData.data.id;

      // Create Lead
      const leadRes = await fetch(`${BASE_URL}/leads?api_token=${API_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Job Application - ${fullname}`,
          person_id: personId,
          '4c93774ffffb80afe6c92a0df3bde9192cdf0859': heardaboutus,
          '5e5c224cb0cf2b47358238c62806f38725df3eeb': sociallink
        })
      });
      const leadData = await leadRes.json();
      console.log('Lead response:', leadData);
      
      if (!leadData.success || !leadData.data) {
        throw new Error(`Failed to create lead: ${JSON.stringify(leadData)}`);
      }

      return res.status(200).json({ success: true, leadId: leadData.data.id });

    } else {
      // Order Form Logic
      const { fullname, emailaddress, phonenumber, companyname, servicename } = formData;

      // Create Organization
      const orgRes = await fetch(`${BASE_URL}/organizations?api_token=${API_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyname })
      });
      const orgData = await orgRes.json();
      console.log('Organization response:', orgData);
      
      if (!orgData.success || !orgData.data) {
        throw new Error(`Failed to create organization: ${JSON.stringify(orgData)}`);
      }
      const orgId = orgData.data.id;

      // Create Person
      const personRes = await fetch(`${BASE_URL}/persons?api_token=${API_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullname,
          email: [emailaddress],
          phone: [phonenumber],
          org_id: orgId
        })
      });
      const personData = await personRes.json();
      console.log('Person response:', personData);
      
      if (!personData.success || !personData.data) {
        throw new Error(`Failed to create person: ${JSON.stringify(personData)}`);
      }
      const personId = personData.data.id;

      // Create Lead
      const leadRes = await fetch(`${BASE_URL}/leads?api_token=${API_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${fullname} - ${servicename}`,
          person_id: personId,
          organization_id: orgId,
          '45fc36e3d6c0c6a940e6755d9c521a80be160fa9': servicename
        })
      });
      const leadData = await leadRes.json();
      console.log('Lead response:', leadData);
      
      if (!leadData.success || !leadData.data) {
        throw new Error(`Failed to create lead: ${JSON.stringify(leadData)}`);
      }

      return res.status(200).json({ success: true, leadId: leadData.data.id });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
