import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface PassportQRProps {
  value: string;
  size?: number;
}

export const PassportQR: React.FC<PassportQRProps> = ({
  value,
  size = 180
}) => {
  return (
    <div className="bg-white p-3.5 rounded-xl flex items-center justify-center shadow-inner">
      <QRCodeSVG value={value} size={size} level="H" includeMargin={false} />
    </div>
  );
};
