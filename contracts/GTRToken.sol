//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GTRToken is ERC20 {

    uint256 public constant TOTAL_SUPPLY = 1000 ether;

    constructor() ERC20("Guitars", "GTR") {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
}
