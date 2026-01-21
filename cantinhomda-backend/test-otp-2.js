
try {
    const lib = require('otplib');
    console.log('Lib keys:', Object.keys(lib));
    console.log('Lib:', lib);
    if (lib.authenticator) console.log('Authenticator found inside lib');
    if (lib.default) console.log('Default found inside lib');
} catch (e) {
    console.error('Error:', e);
}
