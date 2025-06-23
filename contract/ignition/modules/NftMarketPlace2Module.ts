import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export const NftMarketplace2Module = buildModule("NftMarketplace2Module", (m) => {
  const marketplace2 = m.contract("NftMarketplace2");

  return { marketplace2 };
});
