'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { cn } from './lib/utils';

interface CountryCodeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showValidation?: boolean;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' }
];

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Enter phone number',
  className,
  disabled = false,
  showValidation = false
}) => {
  const [countryCode, setCountryCode] = React.useState('+91');
  const [phoneNumber, setPhoneNumber] = React.useState('');

  // Initialize state from value prop
  React.useEffect(() => {
    if (value) {
      const match = value.match(/^(\+\d{1,3})(.*)$/);
      if (match) {
        setCountryCode(match[1] || '+91');
        setPhoneNumber(match[2] || '');
      } else {
        setPhoneNumber(value);
      }
    } else {
      setCountryCode('+91');
      setPhoneNumber('');
    }
  }, []); // Only run once on mount

  const handlePhoneChange = (phone: string) => {
    // Only allow digits
    const cleanPhone = phone.replace(/\D/g, '');
    setPhoneNumber(cleanPhone);
    onChange(`${countryCode}${cleanPhone}`);
  };

  const handleCountryCodeChange = (code: string) => {
    setCountryCode(code);
    onChange(`${code}${phoneNumber}`);
  };

  // Check if phone number is complete (10 digits)
  const isComplete = phoneNumber.length === 10;
  const isValid = showValidation ? isComplete : true;

  return (
    <div className={cn('flex', className)}>
      <Select
        value={countryCode}
        onValueChange={handleCountryCodeChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-28 border-r-0 rounded-r-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        placeholder={placeholder}
        value={phoneNumber}
        onChange={(e) => handlePhoneChange(e.target.value)}
        className={cn(
          "flex-1 rounded-l-none border-l-0",
          showValidation && !isValid && phoneNumber.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500",
          showValidation && isComplete && "border-green-500 focus:border-green-500 focus:ring-green-500"
        )}
        disabled={disabled}
        maxLength={10}
      />
    </div>
  );
};
