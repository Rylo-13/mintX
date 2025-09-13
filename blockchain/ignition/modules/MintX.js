const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MintXModule", (m) => {
  const MintX = m.contract("MintX");

  return { MintX };
});
