// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { NftMarketplace } from "./NftMarketplace.sol";

contract NftMarketplace2 is NftMarketplace {
  function foo() public pure override returns (uint) {
    return 2;
  }
}
