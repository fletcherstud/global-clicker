const fetch = require('node-fetch');

async function verifyTurnstileToken(token) {
  const formData = new URLSearchParams();
  formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return {
      success: data.success,
      error: data['error-codes']?.join(', '),
      challengeTs: data.challenge_ts,
    };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { success: false, error: 'Verification request failed' };
  }
}

function turnstileMiddleware() {
  return async (req, res, next) => {
    // Skip verification if the user is already verified
    if (req.session?.turnstileVerified) {
      return next();
    }

    const token = req.headers['cf-turnstile-token'];
    
    if (!token) {
      return res.status(403).json({ 
        error: 'Turnstile token required',
        needsVerification: true 
      });
    }

    const verification = await verifyTurnstileToken(token);
    
    if (!verification.success) {
      return res.status(403).json({ 
        error: verification.error || 'Verification failed',
        needsVerification: true
      });
    }

    // Store verification in session
    if (req.session) {
      req.session.turnstileVerified = true;
      req.session.turnstileVerifiedAt = verification.challengeTs;
    }

    next();
  };
}

module.exports = turnstileMiddleware; 