import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export const TestERC721Module = (name: string, symbol: string) =>
  buildModule("TestERC721Module", (m) => {
    const testErc721 = m.contract("TestERC721", [name, symbol]);

    return { testErc721 };
  });
