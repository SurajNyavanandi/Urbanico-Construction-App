import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Official Google Pay Vector Icon
 */
export const GooglePayIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <rect width="24" height="24" rx="6" fill="#FFFFFF" stroke="#E5E5E7" strokeWidth="0.8" />
    <path
      d="M12.24 10.42v3.16h4.55c-.2 1.05-.8 1.95-1.7 2.54l2.74 2.13c1.6-1.48 2.53-3.66 2.53-6.25 0-.62-.06-1.22-.16-1.79l-7.96.21z"
      fill="#4285F4"
    />
    <path
      d="M6.38 14.54l-2.7 2.08C5.35 19.95 8.52 22 12.24 22c2.76 0 5.08-.91 6.78-2.48l-2.74-2.13c-.92.62-2.1.99-4.04.99-2.65 0-4.9-1.79-5.71-4.22l-.15.38z"
      fill="#34A853"
    />
    <path
      d="M6.53 9.77c-.22.66-.35 1.36-.35 2.08s.13 1.42.35 2.08L3.68 16c-.72-1.43-1.13-3.04-1.13-4.75 0-1.71.41-3.32 1.13-4.75l2.85 3.27z"
      fill="#FBBC05"
    />
    <path
      d="M12.24 6.2c1.5 0 2.85.52 3.91 1.53l2.93-2.93C17.31 3.16 14.99 2 12.24 2 8.52 2 5.35 4.05 3.68 7.37l2.85 2.4c.81-2.43 3.06-4.22 5.71-4.22l-.0-.65z"
      fill="#EA4335"
    />
  </svg>
);

/**
 * Official PhonePe Vector Icon (Signature Purple with Devanagari 'पे')
 */
export const PhonePeIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <rect width="24" height="24" rx="6" fill="#5F259F" />
    <path
      d="M8.5 6.5h7.2v2.2H12.8v1.6c1.6.2 3 1.5 3 3.4 0 2.2-1.7 3.8-4.2 3.8h-1.2v3.5H8.5V6.5zm3.8 5.7c-.8 0-1.7-.1-1.9-.2v2.1h1.1c1.2 0 1.9-.7 1.9-1.8 0-1.2-.7-1.8-1.9-1.8l.8 1.7z"
      fill="#FFFFFF"
    />
    <path
      d="M14.2 5.5l2.4-2h1.8l-3.2 2.7h-1z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official BHIM UPI Vector Icon (NPCI Dual Chevron & UPI Mark)
 */
export const UpiIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <rect width="24" height="24" rx="6" fill="#FFFFFF" stroke="#E5E5E7" strokeWidth="0.8" />
    <path d="M12.5 5L7 14h5.5l-2 5L17 9.5h-5.5l2-4.5z" fill="#0071E3" />
    <path d="M5.5 17h3v1.5h-3V17zm4 0h3v1.5h-3V17zm4 0h3v1.5h-3V17z" fill="#1D1D1F" />
  </svg>
);

/**
 * Official Full UPI Logo Badge
 */
export const UpiBadgeIcon: React.FC<{ width?: number; height?: number }> = ({ width = 48, height = 20 }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 64 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <rect width="64" height="24" rx="4" fill="#FFFFFF" stroke="#E5E5E7" strokeWidth="0.8" />
    <path d="M14 6l-6 12h6.5l2-4.5h5l-2 4.5H32L26 6H14z" fill="#008450" />
    <path d="M17.5 9l-3 6h4.5l1.2-2.8h3.2L24 9h-6.5z" fill="#F47920" />
    <text x="34" y="16.5" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11" fontWeight="900" fill="#1D1D1F" letterSpacing="0.5">
      UPI
    </text>
  </svg>
);

/**
 * Official Paytm Icon
 */
export const PaytmIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <rect width="24" height="24" rx="6" fill="#002970" />
    <text x="12" y="15" textAnchor="middle" fill="#00BAF2" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
      Paytm
    </text>
  </svg>
);

/**
 * Official Amazon Pay Icon
 */
export const AmazonPayIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <rect width="24" height="24" rx="6" fill="#131921" />
    <path d="M6 15c3.2 2 8.8 2 12-.5" stroke="#FF9900" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16.5 13.5l1.7 1.2-1.2 1.5" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <text x="12" y="11" textAnchor="middle" fill="#FFFFFF" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">
      amazon
    </text>
  </svg>
);

/**
 * Official Visa Vector
 */
export const VisaIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size * 1.5}
    height={size}
    viewBox="0 0 36 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <rect width="36" height="24" rx="4" fill="#1A1F71" />
    <text x="18" y="16.5" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" fontStyle="italic" fontFamily="sans-serif" letterSpacing="0.8">
      VISA
    </text>
  </svg>
);

/**
 * Official Mastercard Vector
 */
export const MastercardIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size * 1.5}
    height={size}
    viewBox="0 0 36 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <rect width="36" height="24" rx="4" fill="#111111" />
    <circle cx="14" cy="12" r="6" fill="#EB001B" />
    <circle cx="22" cy="12" r="6" fill="#F79E1B" fillOpacity="0.88" />
  </svg>
);

/**
 * Official RuPay Vector
 */
export const RupayIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size * 1.5}
    height={size}
    viewBox="0 0 36 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <rect width="36" height="24" rx="4" fill="#FFFFFF" stroke="#E5E5E7" strokeWidth="0.8" />
    <text x="14" y="16" textAnchor="middle" fill="#097939" fontSize="9" fontWeight="900" fontStyle="italic" fontFamily="sans-serif">
      Ru
    </text>
    <text x="25" y="16" textAnchor="middle" fill="#0071E3" fontSize="9" fontWeight="900" fontStyle="italic" fontFamily="sans-serif">
      Pay
    </text>
    <path d="M29 7l4 5-4 5" stroke="#F47920" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Apple Pay Badge (Apple Minimalist Monochrome)
 */
export const ApplePayBadge: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size * 1.6}
    height={size}
    viewBox="0 0 40 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <rect width="40" height="24" rx="4" fill="#000000" />
    <path
      d="M12.8 11.2c-.1-.9.7-1.7 1.2-2-.6-.9-1.6-.9-1.9-.9-.8-.1-1.6.5-2 .5-.4 0-1.1-.5-1.7-.5-1.1 0-2.1.7-2.6 1.7-1.1 1.9-.3 4.8.8 6.4.5.8 1.1 1.6 1.9 1.6.8 0 1.1-.5 2-.5.9 0 1.2.5 2 .5.8 0 1.4-.7 1.9-1.5.6-.9.8-1.7.9-1.8-.1 0-1.6-.6-1.5-2.5zM12.1 8c.4-.5.7-1.2.6-1.9-.6 0-1.4.4-1.8 1-.4.4-.7 1.1-.6 1.8.7.1 1.4-.4 1.8-.9z"
      fill="#FFFFFF"
    />
    <text x="25" y="16" fontFamily="-apple-system, system-ui, sans-serif" fontSize="10" fontWeight="600" fill="#FFFFFF">
      Pay
    </text>
  </svg>
);
