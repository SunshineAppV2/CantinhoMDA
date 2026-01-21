
try {
    const { TOTP } = require('otplib');
    console.log('TOTP Class:', TOTP);
    const authenticator = new TOTP();
    console.log('Instance created');
    const secret = authenticator.generateSecret();
    console.log('Secret:', secret);
    const url = authenticator.keyuri('user', 'service', secret);
    console.log('URL:', url);
} catch (e) {
    console.error('Error:', e);
}
