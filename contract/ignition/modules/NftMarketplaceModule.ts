import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NftMarketplaceModule = buildModule("NftMarketplaceModule", (m) => {
  const admin = m.getAccount(0);

  const marketplace = m.contract("NftMarketplace");

  const proxy = m.contract("TransparentUpgradeableProxy", [marketplace, admin, "0x"]);

  const marketplaceProxy = m.contractAt("NftMarketplace", proxy, {
    id: "NftMarketplaceProxy",
  });

  m.call(marketplaceProxy, "initialize", [], { from: admin });

  const proxyAdminAddress = m.readEventArgument(proxy, "AdminChanged", "newAdmin");

  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

  return { marketplace: marketplaceProxy, proxyAdmin };
});

export default NftMarketplaceModule;
