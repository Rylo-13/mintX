"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RingLoader } from "react-spinners";
import CheckIcon from "../Icons/CheckIcon";
import ErrorIcon from "../Icons/ErrorIcon";
import PendingIcon from "../Icons/PendingIcon";
import InfoIcon from "../Icons/InfoIcon";
import { getErrorMessage } from "@/utils/errorHandler";

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "completed" | "error";
}

interface ProcessModalProps {
  isOpen: boolean;
  steps: ProcessStep[];
  currentStep: string | null;
  onClose?: () => void;
  error?: string | null;
  title: string;
  subtitle?: string;
}

const ProcessModal: React.FC<ProcessModalProps> = ({
  isOpen,
  steps,
  currentStep,
  onClose,
  error,
  title,
  subtitle = "This will only take a moment...",
}) => {
  const getStepIcon = (step: ProcessStep) => {
    switch (step.status) {
      case "completed":
        return <CheckIcon />;
      case "loading":
        return <RingLoader color="#FF10F0" size={20} />;
      case "error":
        return <ErrorIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const getStepTextColor = (step: ProcessStep) => {
    switch (step.status) {
      case "completed":
        return "text-green-400";
      case "loading":
        return "text-[#D600C4]";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl p-8 max-w-md w-full shadow-2xl relative z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {title}
              </h2>
              <p className="text-gray-400 text-sm">
                {subtitle}
              </p>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                    step.status === "loading"
                      ? "bg-[#D600C4]/10"
                      : step.status === "completed"
                      ? "bg-green-500/10"
                      : step.status === "error"
                      ? "bg-red-500/10"
                      : "bg-gray-800/20"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${getStepTextColor(step)}`}>
                      {step.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <div className="flex items-start space-x-3">
                  <InfoIcon />
                  <div className="flex-1">
                    <p className="text-red-400 text-sm font-medium mb-1">Transaction Failed</p>
                    <p className="text-red-300/80 text-xs font-light leading-relaxed">
                      {getErrorMessage(error)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {onClose && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={onClose}
                  className="py-2.5 px-8 border border-white/10 rounded-full text-sm text-white hover:bg-white/5 transition-colors font-light"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProcessModal;