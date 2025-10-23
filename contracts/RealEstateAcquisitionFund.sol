// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RealEstateAcquisitionFund
 * @notice KeyGrow Rent-to-Own Program - Helps renters transition to homeownership
 * @dev Manages 20% of platform revenue for real estate acquisition support
 */
contract RealEstateAcquisitionFund is Ownable, ReentrancyGuard, Pausable {
    
    address public advancedStakingContract;
    address public axmTokenContract;
    
    uint256 public totalFundBalance;
    uint256 public totalDistributed;
    uint256 public totalRenters;
    uint256 public currentDistributionPeriod;
    
    enum Tier { None, Bronze, Silver, Gold, Platinum }
    
    struct TierRequirements {
        uint256 minStake;
        uint256 multiplier; // In basis points (100 = 1.0x)
    }
    
    mapping(Tier => TierRequirements) public tierRequirements;
    
    struct Renter {
        address wallet;
        uint256 registeredAt;
        uint256 totalAllocated;
        uint256 totalClaimed;
        bool active;
        uint256 lastClaimPeriod;
    }
    
    mapping(address => Renter) public renters;
    address[] public renterList;
    
    struct DistributionPeriod {
        uint256 startTime;
        uint256 endTime;
        uint256 totalAmount;
        uint256 renterCount;
        bool finalized;
    }
    
    mapping(uint256 => DistributionPeriod) public distributionPeriods;
    mapping(uint256 => mapping(address => uint256)) public periodAllocations;
    
    event RenterRegistered(address indexed renter, uint256 timestamp);
    event RenterDeactivated(address indexed renter, uint256 timestamp);
    event FundsReceived(uint256 amount, uint256 timestamp);
    event DistributionFinalized(uint256 indexed period, uint256 totalAmount, uint256 renterCount);
    event AllocationClaimed(address indexed renter, uint256 amount, uint256 period);
    event EmergencyWithdrawal(address indexed renter, uint256 amount);
    
    constructor(
        address _advancedStakingContract,
        address _axmTokenContract
    ) Ownable(msg.sender) {
        require(_advancedStakingContract != address(0), "Invalid staking contract");
        require(_axmTokenContract != address(0), "Invalid token contract");
        
        advancedStakingContract = _advancedStakingContract;
        axmTokenContract = _axmTokenContract;
        
        // Initialize tier requirements
        tierRequirements[Tier.Bronze] = TierRequirements({
            minStake: 1_000 * 10**18,    // 1,000 AXM
            multiplier: 100                // 1.0x
        });
        
        tierRequirements[Tier.Silver] = TierRequirements({
            minStake: 5_000 * 10**18,    // 5,000 AXM
            multiplier: 150                // 1.5x
        });
        
        tierRequirements[Tier.Gold] = TierRequirements({
            minStake: 25_000 * 10**18,   // 25,000 AXM
            multiplier: 250                // 2.5x
        });
        
        tierRequirements[Tier.Platinum] = TierRequirements({
            minStake: 100_000 * 10**18,  // 100,000 AXM
            multiplier: 400                // 4.0x
        });
        
        // Initialize first distribution period
        currentDistributionPeriod = 1;
        distributionPeriods[1].startTime = block.timestamp;
    }
    
    /**
     * @notice Register as a renter in the KeyGrow program
     */
    function registerAsRenter() external whenNotPaused {
        require(!renters[msg.sender].active, "Already registered");
        require(getUserTier(msg.sender) != Tier.None, "Must stake AXM to qualify");
        
        renters[msg.sender] = Renter({
            wallet: msg.sender,
            registeredAt: block.timestamp,
            totalAllocated: 0,
            totalClaimed: 0,
            active: true,
            lastClaimPeriod: 0
        });
        
        renterList.push(msg.sender);
        totalRenters++;
        
        emit RenterRegistered(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Deactivate as a renter (can reactivate later)
     */
    function deactivateRenter() external {
        require(renters[msg.sender].active, "Not active");
        renters[msg.sender].active = false;
        emit RenterDeactivated(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Get user's tier based on staked AXM
     * @param user User address
     * @return Current tier
     */
    function getUserTier(address user) public view returns (Tier) {
        // Call AdvancedStaking contract to get staked amount
        // Simplified - in production, query actual staking balance
        (bool success, bytes memory data) = advancedStakingContract.staticcall(
            abi.encodeWithSignature("getUserStake(address)", user)
        );
        
        if (!success) return Tier.None;
        
        uint256 stakedAmount = abi.decode(data, (uint256));
        
        if (stakedAmount >= tierRequirements[Tier.Platinum].minStake) {
            return Tier.Platinum;
        } else if (stakedAmount >= tierRequirements[Tier.Gold].minStake) {
            return Tier.Gold;
        } else if (stakedAmount >= tierRequirements[Tier.Silver].minStake) {
            return Tier.Silver;
        } else if (stakedAmount >= tierRequirements[Tier.Bronze].minStake) {
            return Tier.Bronze;
        }
        
        return Tier.None;
    }
    
    /**
     * @notice Get time-based multiplier
     * @param renterAddress Renter's address
     * @return Time multiplier in basis points
     */
    function getTimeMultiplier(address renterAddress) public view returns (uint256) {
        Renter memory renter = renters[renterAddress];
        if (!renter.active) return 0;
        
        uint256 monthsActive = (block.timestamp - renter.registeredAt) / 30 days;
        
        if (monthsActive >= 25) {
            return 200; // 2.0x
        } else if (monthsActive >= 13) {
            return 150; // 1.5x
        } else if (monthsActive >= 7) {
            return 120; // 1.2x
        } else {
            return 100; // 1.0x
        }
    }
    
    /**
     * @notice Calculate allocation for a renter in current period
     * @param renterAddress Renter's address
     * @return Calculated allocation amount
     */
    function calculateAllocation(address renterAddress) public view returns (uint256) {
        Renter memory renter = renters[renterAddress];
        if (!renter.active) return 0;
        
        Tier tier = getUserTier(renterAddress);
        if (tier == Tier.None) return 0;
        
        uint256 baseShare = totalFundBalance / totalRenters;
        uint256 tierMult = tierRequirements[tier].multiplier;
        uint256 timeMult = getTimeMultiplier(renterAddress);
        
        // Calculate weighted allocation
        uint256 allocation = (baseShare * tierMult * timeMult) / (100 * 100);
        
        return allocation;
    }
    
    /**
     * @notice Finalize current distribution period
     * @dev Only callable by owner monthly
     */
    function finalizeDistribution() external onlyOwner {
        DistributionPeriod storage period = distributionPeriods[currentDistributionPeriod];
        require(!period.finalized, "Already finalized");
        
        period.endTime = block.timestamp;
        period.totalAmount = totalFundBalance;
        period.renterCount = totalRenters;
        period.finalized = true;
        
        // Calculate allocations for all active renters
        for (uint256 i = 0; i < renterList.length; i++) {
            address renterAddr = renterList[i];
            if (renters[renterAddr].active) {
                uint256 allocation = calculateAllocation(renterAddr);
                periodAllocations[currentDistributionPeriod][renterAddr] = allocation;
                renters[renterAddr].totalAllocated += allocation;
            }
        }
        
        emit DistributionFinalized(currentDistributionPeriod, totalFundBalance, totalRenters);
        
        // Start new period
        currentDistributionPeriod++;
        distributionPeriods[currentDistributionPeriod].startTime = block.timestamp;
    }
    
    /**
     * @notice Claim allocated funds for a specific period
     * @param period Distribution period to claim from
     */
    function claimAllocation(uint256 period) external nonReentrant whenNotPaused {
        require(distributionPeriods[period].finalized, "Period not finalized");
        require(renters[msg.sender].lastClaimPeriod < period, "Already claimed");
        
        uint256 allocation = periodAllocations[period][msg.sender];
        require(allocation > 0, "No allocation");
        
        renters[msg.sender].lastClaimPeriod = period;
        renters[msg.sender].totalClaimed += allocation;
        totalDistributed += allocation;
        totalFundBalance -= allocation;
        
        (bool success, ) = msg.sender.call{value: allocation}("");
        require(success, "Transfer failed");
        
        emit AllocationClaimed(msg.sender, allocation, period);
    }
    
    /**
     * @notice Get renter information
     * @param renterAddress Renter's address
     * @return active Whether renter is active
     * @return registeredAt Registration timestamp
     * @return totalAllocated Total funds allocated
     * @return totalClaimed Total funds claimed
     * @return tier Current staking tier
     * @return timeMultiplier Time-based multiplier
     */
    function getRenterInfo(address renterAddress) external view returns (
        bool active,
        uint256 registeredAt,
        uint256 totalAllocated,
        uint256 totalClaimed,
        Tier tier,
        uint256 timeMultiplier
    ) {
        Renter memory renter = renters[renterAddress];
        return (
            renter.active,
            renter.registeredAt,
            renter.totalAllocated,
            renter.totalClaimed,
            getUserTier(renterAddress),
            getTimeMultiplier(renterAddress)
        );
    }
    
    /**
     * @notice Update tier requirements (governance)
     * @param tier Tier to update
     * @param minStake Minimum stake required
     * @param multiplier Allocation multiplier
     */
    function updateTierRequirements(
        Tier tier,
        uint256 minStake,
        uint256 multiplier
    ) external onlyOwner {
        require(tier != Tier.None, "Invalid tier");
        tierRequirements[tier] = TierRequirements(minStake, multiplier);
    }
    
    /**
     * @notice Pause the contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdrawal for a renter
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external nonReentrant {
        Renter storage renter = renters[msg.sender];
        require(renter.active, "Not active");
        require(amount <= renter.totalAllocated - renter.totalClaimed, "Insufficient balance");
        
        renter.totalClaimed += amount;
        totalDistributed += amount;
        totalFundBalance -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit EmergencyWithdrawal(msg.sender, amount);
    }
    
    /**
     * @notice Receive BNB from revenue router
     */
    receive() external payable {
        totalFundBalance += msg.value;
        emit FundsReceived(msg.value, block.timestamp);
    }
    
    /**
     * @notice Fallback for receiving BNB
     */
    fallback() external payable {
        totalFundBalance += msg.value;
        emit FundsReceived(msg.value, block.timestamp);
    }
}
