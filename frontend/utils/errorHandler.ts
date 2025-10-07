/**
 * Format blockchain/wallet errors for user-friendly display
 * Removes technical details like hex strings and provides clear messages
 */
export const getErrorMessage = (error: any): string => {
  const errorString = error?.message || error?.toString() || "Unknown error";

  // User rejected transaction
  if (errorString.includes("User rejected") || errorString.includes("User denied")) {
    return "You cancelled the transaction in your wallet.";
  }

  // Insufficient funds
  if (errorString.includes("insufficient funds")) {
    return "Insufficient funds to complete the transaction. Please add more ETH to your wallet.";
  }

  // Network errors
  if (errorString.includes("network") || errorString.includes("Network")) {
    return "Network error. Please check your connection and try again.";
  }

  // Gas estimation failed
  if (errorString.includes("gas") || errorString.includes("Gas")) {
    return "Transaction failed. This might be due to insufficient gas or a contract issue.";
  }

  // Generic blockchain error - strip out the hex data
  if (errorString.includes("TransactionExecutionError") || errorString.includes("Error:")) {
    // Extract only the main error message, remove hex strings
    const cleanMessage = errorString
      .replace(/0x[a-fA-F0-9]+/g, "") // Remove hex strings
      .replace(/Request Arguments:.*?Details:/s, "") // Remove request details
      .replace(/Details:.*$/s, "") // Remove everything after Details
      .trim();

    if (cleanMessage.includes("User denied")) {
      return "You cancelled the transaction in your wallet.";
    }

    return "Transaction failed. Please try again.";
  }

  // If error is too long, truncate it
  if (errorString.length > 150) {
    return "An error occurred. Please try again.";
  }

  return errorString;
};
