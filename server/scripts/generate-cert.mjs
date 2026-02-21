// server/scripts/generate-cert.mjs
// Generates a self-signed TLS certificate for local HTTPS development.
// Run once: node scripts/generate-cert.mjs

import forge from 'node-forge';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const certsDir = join(__dirname, '..', 'certs');
mkdirSync(certsDir, { recursive: true });

console.log('🔐 Generating self-signed TLS certificate (node-forge)...');

// Generate RSA key pair
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'organizationName', value: 'CNC Dashboard Dev' },
    { name: 'countryName', value: 'IN' },
];

cert.setSubject(attrs);
cert.setIssuer(attrs); // self-signed

cert.setExtensions([
    { name: 'basicConstraints', cA: true },
    { name: 'keyUsage', keyCertSign: true, digitalSignature: true, nonRepudiation: true, keyEncipherment: true, dataEncipherment: true },
    {
        name: 'subjectAltName', altNames: [
            { type: 2, value: 'localhost' },   // DNS
            { type: 7, ip: '127.0.0.1' },     // IP
        ]
    },
]);

// Self-sign with SHA-256
cert.sign(keys.privateKey, forge.md.sha256.create());

// Export PEM
const certPem = forge.pki.certificateToPem(cert);
const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

writeFileSync(join(certsDir, 'cert.pem'), certPem);
writeFileSync(join(certsDir, 'key.pem'), keyPem);

console.log('✅ cert.pem and key.pem written to server/certs/');
console.log('⚠️  Self-signed cert — browsers will show a security warning.');
console.log('   Click "Advanced → Proceed to localhost" to accept it in dev.');
console.log('   For production, replace with a cert from Let\'s Encrypt.');
