import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const CountryPhoneInput = ({
  value,
  onChange,
  placeholder = '+60 123456789',
  country = 'my',
  required = false,
  id,
  autoFocus = false,
}) => {
  return (
    <PhoneInput
      country={country}
      value={value}
      onChange={onChange}
      inputClass="!w-full !py-3 !pl-[60px] !pr-4 !border !border-gray-300 !rounded-lg !text-sm !focus:ring-2 !focus:ring-primary !focus:border-transparent"
      buttonClass="!border !border-gray-300 !rounded-l-lg"
      containerClass="!w-full"
      placeholder={placeholder}
      enableSearch
      inputProps={{ id, required, autoFocus }}
    />
  );
};

export default CountryPhoneInput;

