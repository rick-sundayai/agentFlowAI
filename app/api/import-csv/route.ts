import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to import contacts' },
        { status: 401 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const csvFile = formData.get('csvFile') as File;

    if (!csvFile) {
      return NextResponse.json(
        { error: 'No CSV file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!csvFile.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // Read the file content
    const text = await csvFile.text();
    const lines = text.split('\n');
    
    // Detect delimiter (tab or comma)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    
    // Parse the header row to get column names
    const headers = firstLine.split(delimiter).map(header => header.trim());
    
    // Check for required columns - case insensitive check for 'name' or 'Name'
    if (!headers.some(h => h.toLowerCase() === 'name')) {
      return NextResponse.json(
        { error: 'CSV must include a "Name" column' },
        { status: 400 }
      );
    }

    // Map CSV columns to database fields - case insensitive
    // Only include fields that exist in the database schema
    const columnMap: Record<string, string> = {
      'name': 'name',
      'email': 'email',
      'phone': 'phone',
      'property address': 'property_address'
      // Temporarily remove fields not in the database schema
      // 'address': 'address',
      // 'company': 'company',
      // 'source': 'source'
    };

    // Parse the CSV data rows
    const contacts: Array<Record<string, string | null>> = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      const values = line.split(delimiter).map(value => value.trim());
      
      // Create a contact object
      const contact: Record<string, string | null> = {
        user_id: user.id
      };
      
      // Map CSV values to contact fields
      headers.forEach((header, index) => {
        const dbField = columnMap[header.toLowerCase()];
        if (dbField && values[index]) {
          contact[dbField] = values[index];
        }
      });
      
      // Note: Special handling for address field removed temporarily
      // Will be restored after database schema update
      
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
        count: contacts.length
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
