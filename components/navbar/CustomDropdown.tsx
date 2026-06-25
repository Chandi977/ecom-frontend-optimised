import React, { useState } from 'react';

const CustomDropdown = ({ options = [], placeholder, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="custom-dropdown">
      <div className={` ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)} style={{textTransform:"capitalize" , padding:"10px" , position:"sticky" , fontSize:"18px" , fontFamily:"Montserrat"}}>
        {selectedOption ? selectedOption.label : placeholder}
        {options.length > 0 && <span className="arrow-down"></span>}
      </div>
      {isOpen && (
        <ul className="dropdown-options" style={{position:"absolute" , backgroundColor:"white" , padding:"10px"}}>
          {options.map((option) => (
            <li key={option.value} onClick={() => handleOptionClick(option)}>
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;

