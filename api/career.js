export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    const { fullname, emailaddress, phonenumber, heardaboutus, sociallink } = req.body.payload.data;
    console.log('Received data:', { fullname, emailaddress, phonenumber, heardaboutus, sociallink });
    
    const API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
    const BASE_URL = `https://${process.env.PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`;

    // Create Person
    const personRes = await fetch(`${BASE_URL}/persons?api_token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fullname,
        email: [emailaddress],
        phone: [phonenumber],
        '5e5c224cb0cf2b47358238c62806f38725df3eeb': sociallink
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
        '4c93774ffffb80afe6c92a0df3bde9192cdf0859': heardaboutus
      })
    });
    const leadData = await leadRes.json();
    console.log('Lead response:', leadData);
    
    if (!leadData.success || !leadData.data) {
      throw new Error(`Failed to create lead: ${JSON.stringify(leadData)}`);
    }

    return res.status(200).json({ success: true, leadId: leadData.data.id });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
