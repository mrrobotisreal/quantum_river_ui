export type QRType = 'url' | 'wifi' | 'contact' | 'text' | 'email' | 'sms';

export interface QROptions {
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  foregroundColor: string;
  backgroundColor: string;
  margin: number;
}

export interface GeneratedQR {
  id: string;
  type: QRType;
  data: string;
  dataUrl: string;
  options: QROptions;
}
