import React from 'react';
import Button from './Button';

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden ring-1 ring-black ring-opacity-5">
        <div className="p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
          <Button variant={variant} onClick={onConfirm} className="w-full sm:w-auto">
            {confirmText}
          </Button>
          <Button variant="ghost" onClick={onCancel} className="mt-3 w-full sm:mt-0 sm:w-auto">
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
