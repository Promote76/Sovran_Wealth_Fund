// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AXIOMRevenueRouter
 * @notice Routes platform revenue: 80% to Treasury, 20% to Real Estate Acquisition Fund
 * @dev Handles both BNB and ERC20 token revenue streams
 */
contract AXIOMRevenueRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public treasury;
    address public realEstateAcquisitionFund;
    
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public realEstateAllocation = 2000; // 20%
    
    uint256 public totalBNBDistributed;
    uint256 public totalBNBToRealEstate;
    uint256 public totalBNBToTreasury;
    
    mapping(address => uint256) public tokenDistributed;
    mapping(address => uint256) public tokenToRealEstate;
    mapping(address => uint256) public tokenToTreasury;
    
    enum RevenueSource {
        NFTMarketplace,
        Staking,
        Banking,
        Investments,
        Governance,
        Other
    }
    
    mapping(RevenueSource => uint256) public revenueBySource;
    
    event RevenueReceived(
        address indexed sender,
        uint256 amount,
        RevenueSource source,
        address token
    );
    
    event RevenueDistributed(
        uint256 realEstateCut,
        uint256 treasuryCut,
        address token
    );
    
    event AllocationUpdated(uint256 newAllocation);
    event TreasuryUpdated(address newTreasury);
    event RealEstateFundUpdated(address newFund);
    
    constructor(
        address _treasury,
        address _realEstateAcquisitionFund
    ) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        require(_realEstateAcquisitionFund != address(0), "Invalid fund");
        
        treasury = _treasury;
        realEstateAcquisitionFund = _realEstateAcquisitionFund;
    }
    
    /**
     * @notice Receive and distribute BNB revenue
     * @param source The source of the revenue
     */
    function distributeBNBRevenue(RevenueSource source) external payable nonReentrant {
        require(msg.value > 0, "No revenue");
        
        uint256 realEstateCut = (msg.value * realEstateAllocation) / BASIS_POINTS;
        uint256 treasuryCut = msg.value - realEstateCut;
        
        totalBNBDistributed += msg.value;
        totalBNBToRealEstate += realEstateCut;
        totalBNBToTreasury += treasuryCut;
        revenueBySource[source] += msg.value;
        
        (bool success1, ) = realEstateAcquisitionFund.call{value: realEstateCut}("");
        require(success1, "RE fund transfer failed");
        
        (bool success2, ) = treasury.call{value: treasuryCut}("");
        require(success2, "Treasury transfer failed");
        
        emit RevenueReceived(msg.sender, msg.value, source, address(0));
        emit RevenueDistributed(realEstateCut, treasuryCut, address(0));
    }
    
    /**
     * @notice Receive and distribute ERC20 token revenue
     * @param token The ERC20 token address
     * @param amount The amount of tokens
     * @param source The source of the revenue
     */
    function distributeTokenRevenue(
        address token,
        uint256 amount,
        RevenueSource source
    ) external nonReentrant {
        require(amount > 0, "No revenue");
        require(token != address(0), "Invalid token");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 realEstateCut = (amount * realEstateAllocation) / BASIS_POINTS;
        uint256 treasuryCut = amount - realEstateCut;
        
        tokenDistributed[token] += amount;
        tokenToRealEstate[token] += realEstateCut;
        tokenToTreasury[token] += treasuryCut;
        revenueBySource[source] += amount;
        
        IERC20(token).safeTransfer(realEstateAcquisitionFund, realEstateCut);
        IERC20(token).safeTransfer(treasury, treasuryCut);
        
        emit RevenueReceived(msg.sender, amount, source, token);
        emit RevenueDistributed(realEstateCut, treasuryCut, token);
    }
    
    /**
     * @notice Update the allocation percentage for real estate fund
     * @param newAllocation New allocation in basis points (2000 = 20%)
     */
    function updateAllocation(uint256 newAllocation) external onlyOwner {
        require(newAllocation <= 5000, "Max 50%"); // Reasonable cap
        realEstateAllocation = newAllocation;
        emit AllocationUpdated(newAllocation);
    }
    
    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }
    
    /**
     * @notice Update real estate fund address
     * @param newFund New fund address
     */
    function updateRealEstateFund(address newFund) external onlyOwner {
        require(newFund != address(0), "Invalid address");
        realEstateAcquisitionFund = newFund;
        emit RealEstateFundUpdated(newFund);
    }
    
    /**
     * @notice Get revenue statistics by source
     * @param source The revenue source
     * @return Total revenue from this source
     */
    function getRevenueBySource(RevenueSource source) external view returns (uint256) {
        return revenueBySource[source];
    }
    
    /**
     * @notice Emergency withdrawal (owner only)
     * @param token Token address (address(0) for BNB)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "BNB transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
    
    receive() external payable {
        // Allow direct BNB deposits (categorized as "Other")
        if (msg.value > 0) {
            this.distributeBNBRevenue{value: msg.value}(RevenueSource.Other);
        }
    }
}
