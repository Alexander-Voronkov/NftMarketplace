import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import NftMarketplaceModule from "../ignition/modules/NftMarketplaceModule";
import { TestERC721Module } from "../ignition/modules/TestERC721Module";
import {
  NftMarketplace2__factory,
  NftMarketplace__factory,
  ProxyAdmin__factory,
  TestERC721__factory,
} from "../typechain-types";
import { NftMarketplace2Module } from "../ignition/modules/NftMarketPlace2Module";
import { AbiCoder } from "ethers";

describe("NftMarketplace", function () {
  async function deployFixture() {
    const [deployer, user1, user2] = await ethers.getSigners();

    const { marketplace, proxyAdmin } = await ignition.deploy(NftMarketplaceModule);
    const { marketplace2 } = await ignition.deploy(NftMarketplace2Module);
    const { testErc721 } = await ignition.deploy(TestERC721Module("Test nft", "TNFT"));

    const typedMarketplace = NftMarketplace__factory.connect(
      await marketplace.getAddress(),
      deployer,
    );
    const typedMarketplace2 = NftMarketplace2__factory.connect(
      await marketplace2.getAddress(),
      deployer,
    );
    const typedNft = TestERC721__factory.connect(await testErc721.getAddress(), deployer);
    const typedProxyAdmin = ProxyAdmin__factory.connect(await proxyAdmin.getAddress(), deployer);

    await typedNft.connect(user1).mint(1);

    return {
      marketplace: typedMarketplace,
      proxyAdmin: typedProxyAdmin,
      marketplace2: typedMarketplace2,
      nft: typedNft,
      deployer,
      user1,
      user2,
    };
  }

  it("should create a sell order", async () => {
    const { marketplace, nft, user1 } = await loadFixture(deployFixture);

    await nft.connect(user1).approve(await marketplace.getAddress(), 1);

    await expect(
      marketplace
        .connect(user1)
        .createOrder(await nft.getAddress(), 1, ethers.parseEther("1"), true),
    )
      .to.emit(marketplace, "OrderCreated")
      .withArgs(
        1,
        await user1.getAddress(),
        await nft.getAddress(),
        1,
        ethers.parseEther("1"),
        true,
      );
  });

  it("should cancel an order", async () => {
    const { marketplace, nft, user1 } = await loadFixture(deployFixture);

    await nft.connect(user1).approve(await marketplace.getAddress(), 1);
    await marketplace
      .connect(user1)
      .createOrder(await nft.getAddress(), 1, ethers.parseEther("1"), true);

    await expect(marketplace.connect(user1).cancelOrder(1))
      .to.emit(marketplace, "OrderCancelled")
      .withArgs(1);
  });

  it("should allow another user to buy the NFT", async () => {
    const { marketplace, nft, user1, user2 } = await loadFixture(deployFixture);

    await nft.connect(user1).approve(await marketplace.getAddress(), 1);
    await marketplace
      .connect(user1)
      .createOrder(await nft.getAddress(), 1, ethers.parseEther("1"), true);

    await expect(marketplace.connect(user2).buy(1, { value: ethers.parseEther("1") }))
      .to.emit(marketplace, "NFTTransferred")
      .withArgs(
        await user1.getAddress(),
        await user2.getAddress(),
        await nft.getAddress(),
        1,
        ethers.parseEther("1"),
      );

    expect(await nft.ownerOf(1)).to.equal(await user2.getAddress());
  });

  it("should allow user2 to propose a lower price", async () => {
    const { marketplace, nft, user1, user2 } = await loadFixture(deployFixture);

    await nft.connect(user1).approve(await marketplace.getAddress(), 1);
    await marketplace
      .connect(user1)
      .createOrder(await nft.getAddress(), 1, ethers.parseEther("1"), true);

    await expect(marketplace.connect(user2).proposePrice(1, ethers.parseEther("0.5")))
      .to.emit(marketplace, "ProposalCreated")
      .withArgs(1, await user2.getAddress(), ethers.parseEther("0.5"));
  });

  it("should allow user1 to accept proposal from user2", async () => {
    const { marketplace, nft, user1, user2 } = await loadFixture(deployFixture);

    await nft.connect(user1).approve(await marketplace.getAddress(), 1);
    await marketplace
      .connect(user1)
      .createOrder(await nft.getAddress(), 1, ethers.parseEther("1"), true);

    await marketplace.connect(user2).proposePrice(1, ethers.parseEther("0.5"));

    await user2.sendTransaction({
      to: user1,
      value: ethers.parseEther("0.5"),
    });

    await expect(marketplace.connect(user1).acceptProposal(1, 0))
      .to.emit(marketplace, "ProposalAccepted")
      .withArgs(1, await user2.getAddress(), ethers.parseEther("0.5"));

    // expect(await nft.ownerOf(1)).to.equal(await user2.getAddress());
  });

  it("should reject a proposal", async () => {
    const { marketplace, nft, user1, user2 } = await loadFixture(deployFixture);

    await nft.connect(user1).approve(await marketplace.getAddress(), 1);
    await marketplace
      .connect(user1)
      .createOrder(await nft.getAddress(), 1, ethers.parseEther("1"), true);

    await marketplace.connect(user2).proposePrice(1, ethers.parseEther("0.5"));

    await expect(marketplace.connect(user1).rejectProposal(1, 0)).to.not.be.reverted;
  });

  it("should deploy newer contract version", async () => {
    const { marketplace, marketplace2, proxyAdmin, nft, deployer, user1, user2 } =
      await loadFixture(deployFixture);

    expect(await marketplace.foo()).to.eq(1);

    await proxyAdmin.connect(deployer).upgradeAndCall(marketplace, marketplace2, "0x");

    expect(await marketplace.foo()).to.eq(2);
  });
});
