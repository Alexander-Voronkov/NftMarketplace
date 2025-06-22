// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {
  OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract NftMarketplace is Initializable, OwnableUpgradeable {
  function initialize() public initializer {
    __Ownable_init(msg.sender);
  }
}
