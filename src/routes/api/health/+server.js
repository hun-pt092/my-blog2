// Health check API endpoint
import { json } from '@sveltejs/kit';

export async function GET() {
    try {
        // Simple health check
        return json({ 
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'blog-api'
        });
    } catch (error) {
        return json({ 
            status: 'ERROR',
            error: error.message 
        }, { status: 500 });
    }
}
