
try {
    const { authenticator } = require('otplib');
    console.log('Require success');
    const secret = authenticator.generateSecret();
    console.log('Secret:', secret);
} catch (e) {
    console.error('Error:', e);
}
