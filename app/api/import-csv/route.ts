// app/api/import-csv/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 1. Securely identify the logged-in user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If no user is logged in, return an unauthorized response
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id; // Get the authenticated user's ID

  try {
    // 2. Receive and parse the file data from the request
    const formData = await request.formData();
    const file = formData.get('csvFile') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'File must be a CSV or TXT file' },
        { status: 400 }
      );
    }

    // Read the file content
    const csvContent = await file.text();
    
    // First try to send to n8n webhook
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    const N8N_WEBHOOK_API_KEY = process.env.N8N_WEBHOOK_API_KEY;

    if (N8N_WEBHOOK_URL && N8N_WEBHOOK_API_KEY) {
      try {
        // Construct the payload to send to n8n
        const n8nPayload = {
          userId: userId,
          csvContent: csvContent,
          fileName: file.name,
        };

        // Send the payload to the n8n webhook
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': N8N_WEBHOOK_API_KEY,
          },
          body: JSON.stringify(n8nPayload),
        });

        if (n8nResponse.ok) {
          // n8n webhook processed successfully
          return NextResponse.json({
            message: 'CSV file received and sent for processing. Your contacts will appear shortly.',
            source: 'n8n'
          }, { status: 200 });
        }
        
        // If we get here, n8n webhook failed - fall back to direct import
        console.log('n8n webhook failed, falling back to direct import');
      } catch (webhookError) {
        // Webhook error - fall back to direct import
        console.error('Error sending to n8n webhook:', webhookError);
      }
    }
    
    // If we get here, either n8n webhook failed or is not configured
    // Fall back to direct database import
    
    const lines = csvContent.split('\n');
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file appears to be empty or invalid' }, { status: 400 });
    }
    
    // Detect delimiter (tab or comma)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    
    // Parse the header row to get column names
    const headers = firstLine.split(delimiter).map(header => header.trim().toLowerCase());
    
    // Check for required columns - case insensitive check for 'name'
    if (!headers.includes('name')) {
      return NextResponse.json(
        { error: 'CSV must include a "name" column' },
        { status: 400 }
      );
    }

    // Map CSV columns to database fields - case insensitive
    const columnMap: Record<string, string> = {
      'name': 'name',
      'email': 'email',
      'phone': 'phone',
      'address': 'address',
      'property address': 'property_address',
      'property_address': 'property_address',
      'company': 'company',
      'source': 'source'
    };

    // Parse the CSV data rows
    const contacts: Array<Record<string, string | null>> = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      const values = line.split(delimiter).map(value => value.trim());
      
      // Create a contact object
      const contact: Record<string, string | null> = {
        user_id: userId
      };
      
      // Map CSV values to contact fields
      headers.forEach((header, index) => {
        const dbField = columnMap[header];
        if (dbField && values[index]) {
          contact[dbField] = values[index];
        }
      });
      
      // Ensure name is present
      if (contact.name) {
        contacts.push(contact);
      }
    }

    // Insert the contacts into the database
    if (contacts.length > 0) {
      const { error } = await supabase
        .from('contacts')
        .insert(contacts);

      if (error) {
        console.error('Error inserting contacts:', error);
        return NextResponse.json(
          { error: `Failed to import contacts: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Successfully imported ${contacts.length} contacts`,
        count: contacts.length,
        source: 'direct'
      });
    } else {
      return NextResponse.json(
        { error: 'No valid contacts found in CSV' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('CSV import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `CSV import failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}