import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Modal.css';

/**
 * Reusable Confirmation/Alert Modal
 * @param {boolean} isOpen - Is modal open
 * @param {string} title - Modal title
 * @param {string} message - Main text content
 * @param {function} onConfirm - Function to call on "Yes/OK"
 * @param {function} onCancel - Function to call on "No/Cancel"
 * @param {boolean} isDanger - If true, confirm button is red (for delete)
 * @param {boolean} isAlert - If true, only shows "OK" button (no cancel)
 */
export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isDanger = false,
    isAlert = false
}) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="modal-container small-modal"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                >
                    <div className="modal-header">
                        <h2>{title}</h2>
                        <button onClick={onCancel} className="modal-close">×</button>
                    </div>

                    <div className="modal-form">
                        <p className="confirm-message">{message}</p>
                    </div>

                    <div className="modal-actions">
                        {!isAlert && (
                            <button onClick={onCancel} className="btn btn-secondary">
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            className={`btn ${isDanger ? 'btn-danger-solid' : 'btn-primary'}`}
                        >
                            {isAlert ? 'OK' : (isDanger ? 'Delete' : 'Confirm')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
