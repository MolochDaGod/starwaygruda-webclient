// Vercel Serverless Function: /api/wallet-login
export default function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { walletAddress, signature, message } = req.body || {};

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address required'
            });
        }

        console.log(`[Auth] Wallet login attempt: ${walletAddress}`);

        // Generate session token
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const sessionToken = `${walletAddress}_${timestamp}_${random}`;

        // Simple hash for account ID
        let hash = 0;
        for (let i = 0; i < walletAddress.length; i++) {
            const char = walletAddress.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const accountId = Math.abs(hash);

        res.status(200).json({
            success: true,
            accountId,
            token: sessionToken,
            walletAddress,
            characters: [],
            serverInfo: {
                name: 'StarWayGRUDA',
                population: 0,
                status: 'online'
            }
        });

    } catch (error) {
        console.error('[Auth] Wallet login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}
