import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ title = 'No data found', description = 'There are no records to display.', icon: Icon = PackageOpen }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <div className="bg-white p-3 rounded-full mb-4 shadow-sm">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
    </div>
  );
};

export default EmptyState;
