// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NftMarketplaceModule = buildModule("NftMarketplaceModule", (m) => {
  const proxy = m.contract("TransparentUpgradeableProxy");

  m.contractAt("NftMarketplace", proxy);

  return { proxy };
});

export default NftMarketplaceModule;
