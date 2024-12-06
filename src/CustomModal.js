// src/CustomModal.js
import React from "react";
import Modal from "react-modal";

const CustomModal = ({
  isOpen,
  onRequestClose,
  title,
  children,
  onSubmit,
  submitLabel,
  showCancel = true,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="w-full max-w-lg mx-auto mt-20 bg-white rounded-lg shadow-lg p-6 outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {children}
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
          >
            {submitLabel}
          </button>
          {showCancel && (
            <button
              type="button"
              onClick={onRequestClose}
              className="ml-4 bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded shadow"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default CustomModal;
