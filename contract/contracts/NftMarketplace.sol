// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {
  IERC721Metadata
} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {
  OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract NftMarketplace is Initializable, OwnableUpgradeable {
  struct Order {
    address maker;
    address nftAddress;
    uint256 tokenId;
    uint256 price;
    bool isSellOrder;
    bool active;
  }

  struct Proposal {
    address proposer;
    uint256 proposedPrice;
    bool accepted;
    bool rejected;
  }

  uint256 public orderCounter;
  mapping(uint256 => Order) public orders;
  mapping(uint256 => Proposal[]) public orderProposals;
  mapping(uint256 => address) public acceptedBuyers;

  event OrderCreated(
    uint256 indexed orderId,
    address indexed maker,
    address indexed nftAddress,
    uint256 tokenId,
    uint256 price,
    bool isSellOrder
  );
  event OrderCancelled(uint256 indexed orderId);
  event ProposalCreated(uint256 indexed orderId, address indexed proposer, uint256 proposedPrice);
  event ProposalAccepted(uint256 indexed orderId, address indexed proposer, uint256 acceptedPrice);
  event NFTTransferred(
    address indexed from,
    address indexed to,
    address nftAddress,
    uint256 tokenId,
    uint256 price
  );

  function initialize() public initializer {
    __Ownable_init(msg.sender);
  }

  modifier onlyOrderMaker(uint256 orderId) {
    require(msg.sender == orders[orderId].maker, "Not order maker");
    _;
  }

  function foo() public pure virtual returns (uint) {
    return 1;
  }

  function createOrder(
    address nftAddress,
    uint256 tokenId,
    uint256 price,
    bool isSellOrder
  ) external returns (uint256) {
    require(price > 0, "Price must be positive");
    require(IERC721(nftAddress).ownerOf(tokenId) == msg.sender, "Not NFT owner");

    orderCounter++;
    orders[orderCounter] = Order({
      maker: msg.sender,
      nftAddress: nftAddress,
      tokenId: tokenId,
      price: price,
      isSellOrder: isSellOrder,
      active: true
    });

    emit OrderCreated(orderCounter, msg.sender, nftAddress, tokenId, price, isSellOrder);
    return orderCounter;
  }

  function cancelOrder(uint256 orderId) external onlyOrderMaker(orderId) {
    orders[orderId].active = false;
    emit OrderCancelled(orderId);
  }

  function buy(uint256 orderId) external payable {
    Order storage order = orders[orderId];
    require(
      acceptedBuyers[orderId] == msg.sender || msg.value == order.price,
      "Your proposal has not been accepted yet"
    );
    require(order.isSellOrder, "Not a sell order");
    require(
      IERC721(order.nftAddress).ownerOf(order.tokenId) == order.maker,
      "Seller no longer owns NFT"
    );

    order.active = false;

    payable(order.maker).transfer(msg.value);

    IERC721(order.nftAddress).safeTransferFrom(order.maker, msg.sender, order.tokenId);

    emit NFTTransferred(order.maker, msg.sender, order.nftAddress, order.tokenId, msg.value);
  }

  function proposePrice(uint256 orderId, uint256 proposedPrice) external {
    Order storage order = orders[orderId];
    require(order.active, "Order inactive");
    require(proposedPrice > 0 && proposedPrice < order.price, "Invalid proposed price");

    orderProposals[orderId].push(
      Proposal({
        proposer: msg.sender,
        proposedPrice: proposedPrice,
        accepted: false,
        rejected: false
      })
    );

    emit ProposalCreated(orderId, msg.sender, proposedPrice);
  }

  function acceptProposal(uint256 orderId, uint256 proposalIndex) external onlyOrderMaker(orderId) {
    Order storage order = orders[orderId];
    Proposal storage proposal = orderProposals[orderId][proposalIndex];
    require(!proposal.accepted && !proposal.rejected, "Proposal already resolved");
    require(order.active, "Order not active");

    proposal.accepted = true;
    order.active = false;

    acceptedBuyers[orderId] = proposal.proposer;

    require(
      IERC721(order.nftAddress).ownerOf(order.tokenId) == order.maker,
      "Maker no longer owns NFT"
    );

    emit ProposalAccepted(orderId, proposal.proposer, proposal.proposedPrice);
  }

  function rejectProposal(uint256 orderId, uint256 proposalIndex) external onlyOrderMaker(orderId) {
    Proposal storage proposal = orderProposals[orderId][proposalIndex];
    require(!proposal.accepted && !proposal.rejected, "Already resolved");
    proposal.rejected = true;
  }

  function getProposals(uint256 orderId) external view returns (Proposal[] memory) {
    return orderProposals[orderId];
  }

  function onERC721Received(
    address,
    address,
    uint256,
    bytes calldata
  ) external pure returns (bytes4) {
    return this.onERC721Received.selector;
  }
}
