import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { cn } from '../utils';

const SearchableSelect = ({ 
    options = [], 
    value, 
    onChange, 
    name,
    placeholder = "Select option...", 
    className,
    disabled = false,
    multiple = false,
    direction = 'down'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Find selected label
    const getDisplayValue = () => {
        if (multiple) {
            if (!value || !Array.isArray(value) || value.length === 0) return placeholder;
            // Map selected values to React Nodes/Strings
            const selectedLabels = options
                .filter(opt => value.includes(opt.value))
                .map(opt => {
                     const isInactive = opt.status === 'Inactive' || opt.status === 'INACTIVE';
                     return isInactive 
                        ? `${opt.label} (Inactive)` 
                        : opt.label;
                });
            return selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder;
        }
        const selectedOption = options.find(opt => opt.value === value);
        if(!selectedOption) return placeholder;

        const isInactive = selectedOption.status === 'Inactive' || selectedOption.status === 'INACTIVE';
        return isInactive ? `${selectedOption.label} (Inactive)` : selectedOption.label;
    };

    const filteredOptions = options.filter(opt => 
        (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (optionValue) => {
        if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValue = currentValues.includes(optionValue)
                ? currentValues.filter(v => v !== optionValue)
                : [...currentValues, optionValue];
            
            if (onChange) {
                onChange({ 
                    target: { 
                        name: name, 
                        value: newValue 
                    } 
                });
            }
            // Keep open for multiple selection
            // Optional: setSearchTerm(''); 
        } else {
            if (onChange) {
                onChange({ 
                    target: { 
                        name: name, 
                        value: optionValue 
                    } 
                });
            }
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <div
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer",
                    disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400",
                    isOpen ? "ring-2 ring-cyan-500 border-transparent" : "",
                    "focus:outline-none"
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={((!multiple && value) || (multiple && value?.length > 0)) ? "text-gray-900" : "text-gray-400"}>
                    {getDisplayValue()}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400 opacity-50" />
            </div>

            {isOpen && (
                <div className={cn(
                    "absolute z-50 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg max-h-60",
                    direction === 'up' ? "bottom-full mb-1" : "mt-1"
                )}>
                    <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full rounded-md border border-gray-200 py-2 pl-8 pr-4 text-sm focus:border-cyan-500 focus:outline-none"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-500 text-center">
                                No results found.
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = multiple 
                                    ? (value || []).includes(option.value)
                                    : option.value === value;
                                const isInactive = option.status === 'Inactive' || option.status === 'INACTIVE';
                                
                                return (
                                    <div
                                        key={option.value}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-gray-50",
                                            isSelected ? "bg-cyan-50 text-cyan-700" : "text-gray-900",
                                            isInactive && "text-gray-500 opacity-60"
                                        )}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <span>{option.label} {isInactive && "(Inactive)"}</span>
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-cyan-600" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
