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
}

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' }
];

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Enter phone number',
  className,
  disabled = false
}) => {
  const [countryCode, setCountryCode] = React.useState('+91');
  const [phoneNumber, setPhoneNumber] = React.useState('');

  React.useEffect(() => {
    // Parse the current value to extract country code and phone number
    if (value) {
      const match = value.match(/^(\+\d{1,3})(.*)$/);
      if (match) {
        setCountryCode(match[1] || '+91');
        setPhoneNumber(match[2] || '');
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  const handlePhoneChange = (phone: string) => {
    setPhoneNumber(phone);
    onChange(`${countryCode}${phone}`);
  };

  const handleCountryCodeChange = (code: string) => {
    setCountryCode(code);
    onChange(`${code}${phoneNumber}`);
  };

  return (
    <div className={cn('flex', className)}>
      <Select
        value={countryCode}
        onValueChange={handleCountryCodeChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-24 border-r-0 rounded-r-none">
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
        className="flex-1 rounded-l-none border-l-0"
        disabled={disabled}
      />
    </div>
  );
};
