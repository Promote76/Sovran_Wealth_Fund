// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LiquidityRewardsVault
 * @dev Full-featured LP token staking vault with time-weighted rewards, APY, and lock periods
 * @notice Stake LP tokens to earn rewards over time with flexible APY and optional lock periods
 */
contract LiquidityRewardsVault is Ownable, ReentrancyGuard, Pausable {
    
    // ========== STATE VARIABLES ==========
    
    IERC20 public lpToken;
    IERC20 public rewardToken;
    
    // Staking parameters
    uint256 public rewardRate; // Rewards per second per token staked (scaled by 1e18)
    uint256 public lockPeriod; // Lock period in seconds (default: 7 days)
    uint256 public minimumStake; // Minimum amount to stake (in wei)
    
    // Global stats
    uint256 public totalStaked;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    // User data
    struct StakeInfo {
        uint256 amount;           // Amount of LP tokens staked
        uint256 startTime;        // When user first staked
        uint256 lastClaimTime;    // Last time rewards were claimed
        uint256 rewardPerTokenPaid; // Reward per token already paid
        uint256 rewards;          // Pending rewards
    }
    
    mapping(address => StakeInfo) public stakes;
    
    // ========== EVENTS ==========
    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event LockPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event MinimumStakeUpdated(uint256 oldMinimum, uint256 newMinimum);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RewardsFunded(uint256 amount);
    
    // ========== CONSTRUCTOR ==========
    
    /**
     * @param _lpToken Address of the LP token to stake
     * @param _rewardToken Address of the reward token (can be same as LP token)
     * @param _rewardRate Initial reward rate (rewards per second per token, scaled by 1e18)
     * @param _lockPeriod Lock period in seconds (0 for no lock)
     * @param _minimumStake Minimum stake amount in wei (0 for no minimum)
     */
    constructor(
        address _lpToken,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _lockPeriod,
        uint256 _minimumStake
    ) Ownable(msg.sender) {
        require(_lpToken != address(0), "Invalid LP token");
        require(_rewardToken != address(0), "Invalid reward token");
        
        lpToken = IERC20(_lpToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        lockPeriod = _lockPeriod;
        minimumStake = _minimumStake;
        lastUpdateTime = block.timestamp;
    }
    
    // ========== MODIFIERS ==========
    
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (account != address(0)) {
            stakes[account].rewards = earned(account);
            stakes[account].rewardPerTokenPaid = rewardPerTokenStored;
        }
        _;
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @notice Calculate reward per token
     * @return Reward per token value
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        
        return rewardPerTokenStored + (
            ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked
        );
    }
    
    /**
     * @notice Calculate earned rewards for an account
     * @param account User address
     * @return Amount of rewards earned
     */
    function earned(address account) public view returns (uint256) {
        StakeInfo memory stake = stakes[account];
        return (
            (stake.amount * (rewardPerToken() - stake.rewardPerTokenPaid)) / 1e18
        ) + stake.rewards;
    }
    
    /**
     * @notice Get pending rewards for an account
     * @param account User address
     * @return Pending reward amount
     */
    function pendingRewards(address account) external view returns (uint256) {
        return earned(account);
    }
    
    /**
     * @notice Calculate current APY based on reward rate
     * @return APY percentage (scaled by 100, e.g., 1500 = 15%)
     */
    function calculateAPY() external view returns (uint256) {
        if (totalStaked == 0) return 0;
        
        // Annual rewards = rewardRate * seconds per year
        uint256 annualRewards = rewardRate * 365 days;
        // APY = (annualRewards / totalStaked) * 100
        return (annualRewards * 10000) / totalStaked;
    }
    
    /**
     * @notice Get user stake information
     * @param account User address
     * @return amount Staked amount
     * @return startTime Stake start time
     * @return lastClaimTime Last claim time
     * @return pendingReward Pending rewards
     * @return canWithdraw Whether lock period has passed
     */
    function getUserStake(address account) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lastClaimTime,
        uint256 pendingReward,
        bool canWithdraw
    ) {
        StakeInfo memory stake = stakes[account];
        amount = stake.amount;
        startTime = stake.startTime;
        lastClaimTime = stake.lastClaimTime;
        pendingReward = earned(account);
        canWithdraw = block.timestamp >= stake.startTime + lockPeriod;
    }
    
    // ========== STAKING FUNCTIONS ==========
    
    /**
     * @notice Stake LP tokens
     * @param amount Amount of LP tokens to stake
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        require(amount >= minimumStake, "Below minimum stake");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // SECURITY FIX: Always refresh lock period on new stakes if lock is enabled
        // This prevents users from staking dust, waiting, then adding large amounts to bypass lock
        if (lockPeriod > 0) {
            userStake.startTime = block.timestamp;
        } else if (userStake.amount == 0) {
            // Only set on first stake if no lock period
            userStake.startTime = block.timestamp;
        }
        
        // Set last claim time on first stake
        if (userStake.amount == 0) {
            userStake.lastClaimTime = block.timestamp;
        }
        
        // Transfer LP tokens from user
        lpToken.transferFrom(msg.sender, address(this), amount);
        
        // Update stake info
        userStake.amount += amount;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @notice Alias for stake() to maintain compatibility
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        require(amount >= minimumStake, "Below minimum stake");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // SECURITY FIX: Always refresh lock period on new stakes if lock is enabled
        if (lockPeriod > 0) {
            userStake.startTime = block.timestamp;
        } else if (userStake.amount == 0) {
            userStake.startTime = block.timestamp;
        }
        
        if (userStake.amount == 0) {
            userStake.lastClaimTime = block.timestamp;
        }
        
        lpToken.transferFrom(msg.sender, address(this), amount);
        userStake.amount += amount;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @notice Withdraw staked LP tokens
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient stake");
        
        // Check lock period
        require(
            block.timestamp >= userStake.startTime + lockPeriod,
            "Lock period not ended"
        );
        
        // Update stake info
        userStake.amount -= amount;
        totalStaked -= amount;
        
        // If fully withdrawn, reset start time
        if (userStake.amount == 0) {
            userStake.startTime = 0;
        }
        
        // Transfer LP tokens back to user
        lpToken.transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Claim accumulated rewards
     */
    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = stakes[msg.sender].rewards;
        require(reward > 0, "No rewards to claim");
        
        stakes[msg.sender].rewards = 0;
        stakes[msg.sender].lastClaimTime = block.timestamp;
        
        // Transfer reward tokens
        rewardToken.transfer(msg.sender, reward);
        
        emit RewardsClaimed(msg.sender, reward);
    }
    
    /**
     * @notice Withdraw stake and claim rewards in one transaction
     * @param amount Amount to withdraw (0 to just claim rewards)
     */
    function exit(uint256 amount) external nonReentrant updateReward(msg.sender) {
        StakeInfo storage userStake = stakes[msg.sender];
        
        // Withdraw if amount specified
        if (amount > 0) {
            require(userStake.amount >= amount, "Insufficient stake");
            require(
                block.timestamp >= userStake.startTime + lockPeriod,
                "Lock period not ended"
            );
            
            userStake.amount -= amount;
            totalStaked -= amount;
            
            if (userStake.amount == 0) {
                userStake.startTime = 0;
            }
            
            lpToken.transfer(msg.sender, amount);
            emit Withdrawn(msg.sender, amount);
        }
        
        // Claim rewards if any
        uint256 reward = userStake.rewards;
        if (reward > 0) {
            userStake.rewards = 0;
            userStake.lastClaimTime = block.timestamp;
            rewardToken.transfer(msg.sender, reward);
            emit RewardsClaimed(msg.sender, reward);
        }
    }
    
    // ========== OWNER FUNCTIONS ==========
    
    /**
     * @notice Update reward rate
     * @param _rewardRate New reward rate (per second per token, scaled by 1e18)
     */
    function setRewardRate(uint256 _rewardRate) external onlyOwner updateReward(address(0)) {
        uint256 oldRate = rewardRate;
        rewardRate = _rewardRate;
        emit RewardRateUpdated(oldRate, _rewardRate);
    }
    
    /**
     * @notice Update lock period
     * @param _lockPeriod New lock period in seconds
     */
    function setLockPeriod(uint256 _lockPeriod) external onlyOwner {
        uint256 oldPeriod = lockPeriod;
        lockPeriod = _lockPeriod;
        emit LockPeriodUpdated(oldPeriod, _lockPeriod);
    }
    
    /**
     * @notice Update minimum stake requirement
     * @param _minimumStake New minimum stake amount
     */
    function setMinimumStake(uint256 _minimumStake) external onlyOwner {
        uint256 oldMinimum = minimumStake;
        minimumStake = _minimumStake;
        emit MinimumStakeUpdated(oldMinimum, _minimumStake);
    }
    
    /**
     * @notice Fund the contract with reward tokens
     * @param amount Amount of reward tokens to add
     */
    function fundRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "Cannot fund 0");
        rewardToken.transferFrom(msg.sender, address(this), amount);
        emit RewardsFunded(amount);
    }
    
    /**
     * @notice Pause staking (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause staking
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw - allows users to withdraw without lock period check
     * @dev Only callable when paused, for emergency situations
     */
    function emergencyWithdraw() external nonReentrant {
        require(paused(), "Not in emergency mode");
        
        StakeInfo storage userStake = stakes[msg.sender];
        uint256 amount = userStake.amount;
        require(amount > 0, "No stake to withdraw");
        
        // Reset stake
        userStake.amount = 0;
        userStake.startTime = 0;
        totalStaked -= amount;
        
        // Transfer LP tokens back (forfeit rewards in emergency)
        lpToken.transfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    /**
     * @notice Recover accidentally sent tokens (not LP or reward tokens)
     * @param token Token address to recover
     * @param amount Amount to recover
     */
    function recoverERC20(address token, uint256 amount) external onlyOwner {
        require(token != address(lpToken), "Cannot recover LP token");
        require(token != address(rewardToken), "Cannot recover reward token");
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @notice Get balance of user (alias for compatibility)
     * @param user User address
     * @return Staked amount
     */
    function balanceOf(address user) external view returns (uint256) {
        return stakes[user].amount;
    }
    
    /**
     * @notice Get user staked amount (alias for compatibility)
     * @param user User address
     * @return Staked amount
     */
    function staked(address user) external view returns (uint256) {
        return stakes[user].amount;
    }
}
