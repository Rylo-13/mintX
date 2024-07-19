const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AiARTModule", (m) => {
  const AiART = m.contract("AiART", []);

  return { AiART };
});
