import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = process.env['ENCRYPTION_KEY'];

if (!secretKey || secretKey.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
}

export class EncryptionService {
  private static key = Buffer.from(secretKey as string, 'utf8');

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + Encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, this.key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '••••••••';
    }
    return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
  }
} 