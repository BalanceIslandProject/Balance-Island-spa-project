const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeImages() {
    console.log("Removing images from all campaigns...");
    const { data, error } = await supabase
        .from('campaigns')
        .update({ image: null, image_url: null })
        .not('id', 'is', null);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Successfully removed images from all campaigns.");
    }
}

removeImages();
