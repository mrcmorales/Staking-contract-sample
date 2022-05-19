//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract Staking is Ownable, ReentrancyGuard {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct Staker {
        uint256 balance;
        bool isInBalanceKey;
    }

    IERC20 private stakingToken;
    bool public stakingFlag;
    bool public unStakingFlag;
    mapping(address => bool) public whitelist;
    mapping(address => Staker) public balances;
    address[] private balancesKey;

    event Staked(address from, uint256 amount);
    event UnStaked(address to, uint256 amount);
    event Refunded();

    modifier isWhitelisted() {
        require(whitelist[msg.sender], 'Address is not whitelisted');
        _;
    }

    modifier isStakingAllowed() {
        require(stakingFlag, 'Staking is not allowed');
        _;
    }

    modifier isUnStakingAllowed() {
        require(unStakingFlag, 'UnStaking is not allowed');
        _;
    }

    /**
    * @param _tokenAddress address of token we want to stake
    */
    constructor(IERC20 _tokenAddress) {
        stakingToken = _tokenAddress;
    }

    /**
    * @dev add address to whitelist
    */
    function addAddressToWhitelist(address _address) external onlyOwner {
        whitelist[_address] = true;
    }

    /**
    * @dev remove address from whitelist
    */
    function removeAddressFromWhitelist(address _address) external onlyOwner {
        whitelist[_address] = false;
    }

    /**
    * @dev To allow staking
    */
    function allowStaking() external onlyOwner {
        stakingFlag = true;
    }

    /**
    * @dev To allow unStaking
    */
    function allowUnStaking() external onlyOwner
    {
        unStakingFlag = true;
    }

    /**
    * @param _amount Amount of tokens to stake
    * @dev To stake tokens
    */
    function stake(uint256 _amount) external isWhitelisted() isStakingAllowed() nonReentrant() {
        require(_amount != 0, "Stake 0 tokens is not allowed");
        require(_amount <= stakingToken.balanceOf(msg.sender), "Not enough tokens in your wallet");

        if (false == balances[msg.sender].isInBalanceKey) {
            balancesKey.push(msg.sender);
        }

        balances[msg.sender] = Staker({balance : balances[msg.sender].balance.add(_amount), isInBalanceKey : true});
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit Staked(msg.sender, _amount);
    }

    /**
    * @param _amount Amount of tokens to unstake
    * @dev To unstake tokens
    */
    function unStake(uint256 _amount) external isWhitelisted() isUnStakingAllowed() nonReentrant() {
        require(_amount != 0, "UnStake 0 tokens is not allowed");
        require(_amount <= balances[msg.sender].balance, "You have not enough tokens staked to unstake");

        balances[msg.sender] = Staker({balance : balances[msg.sender].balance.sub(_amount), isInBalanceKey : true});
        stakingToken.safeTransfer(msg.sender, _amount);

        emit UnStaked(msg.sender, _amount);
    }

    /**
    * @dev Refund staked tokens to the wallets and stop stake and unstake.
    */
    function refund() external onlyOwner {

        for (uint256 i = 0; i < balancesKey.length; i++) {
            uint256 _amount = balances[balancesKey[i]].balance;
            if (_amount > 0) {
                stakingToken.safeTransfer(balancesKey[i], _amount);
            }
        }

        denyStaking();
        denyUnStaking();

        emit Refunded();
    }

    /**
    * @dev To deny staking
    */
    function denyStaking() public onlyOwner {
        stakingFlag = false;
    }

    /**
    * @dev To deny unStaking
    */
    function denyUnStaking() public onlyOwner {
        unStakingFlag = false;
    }
}
