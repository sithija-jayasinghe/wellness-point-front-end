import React from 'react';

const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
