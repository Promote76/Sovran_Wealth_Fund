// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LiquidityRewardsVault.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VaultFactory
 * @dev Factory contract to deploy and manage multiple LiquidityRewardsVault instances
 * Each LP token pair gets its own isolated vault with customizable parameters
 */
contract VaultFactory is Ownable {
    
    // Vault registry
    address[] public allVaults;
    mapping(address => address) public lpTokenToVault; // LP token => vault address
    mapping(address => bool) public isVault; // Quick vault verification
    
    // Default reward token (SWF) for all vaults
    address public defaultRewardToken;
    
    // Events
    event VaultCreated(
        address indexed lpToken,
        address indexed vault,
        uint256 rewardRate,
        uint256 lockPeriod,
        uint256 minimumStake,
        uint256 vaultIndex
    );
    
    event DefaultRewardTokenUpdated(address indexed oldToken, address indexed newToken);
    
    constructor(address _defaultRewardToken) Ownable(msg.sender) {
        require(_defaultRewardToken != address(0), "Invalid reward token");
        defaultRewardToken = _defaultRewardToken;
    }
    
    /**
     * @notice Deploy a new vault for an LP token pair
     * @param lpToken The LP token address to stake
     * @param rewardRate Rewards per second per token
     * @param lockPeriod Lock period in seconds
     * @param minimumStake Minimum stake amount
     * @return vault Address of the newly deployed vault
     */
    function createVault(
        address lpToken,
        uint256 rewardRate,
        uint256 lockPeriod,
        uint256 minimumStake
    ) external onlyOwner returns (address vault) {
        require(lpToken != address(0), "Invalid LP token");
        require(lpTokenToVault[lpToken] == address(0), "Vault already exists for this LP token");
        
        // Deploy new vault
        LiquidityRewardsVault newVault = new LiquidityRewardsVault(
            lpToken,
            defaultRewardToken,
            rewardRate,
            lockPeriod,
            minimumStake
        );
        
        vault = address(newVault);
        
        // CRITICAL: Transfer vault ownership to factory owner so they can manage it
        newVault.transferOwnership(owner());
        
        // Register vault
        allVaults.push(vault);
        lpTokenToVault[lpToken] = vault;
        isVault[vault] = true;
        
        emit VaultCreated(
            lpToken,
            vault,
            rewardRate,
            lockPeriod,
            minimumStake,
            allVaults.length - 1
        );
        
        return vault;
    }
    
    /**
     * @notice Get vault address for a specific LP token
     * @param lpToken The LP token address
     * @return Vault address (0x0 if doesn't exist)
     */
    function getVault(address lpToken) external view returns (address) {
        return lpTokenToVault[lpToken];
    }
    
    /**
     * @notice Get all deployed vaults
     * @return Array of all vault addresses
     */
    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }
    
    /**
     * @notice Get total number of vaults
     * @return Number of deployed vaults
     */
    function vaultCount() external view returns (uint256) {
        return allVaults.length;
    }
    
    /**
     * @notice Get vault info for multiple LP tokens
     * @param lpTokens Array of LP token addresses
     * @return vaults Array of corresponding vault addresses
     */
    function getVaults(address[] calldata lpTokens) external view returns (address[] memory vaults) {
        vaults = new address[](lpTokens.length);
        for (uint256 i = 0; i < lpTokens.length; i++) {
            vaults[i] = lpTokenToVault[lpTokens[i]];
        }
        return vaults;
    }
    
    /**
     * @notice Update default reward token for future vaults
     * @param newRewardToken New reward token address
     */
    function setDefaultRewardToken(address newRewardToken) external onlyOwner {
        require(newRewardToken != address(0), "Invalid reward token");
        address oldToken = defaultRewardToken;
        defaultRewardToken = newRewardToken;
        emit DefaultRewardTokenUpdated(oldToken, newRewardToken);
    }
    
    /**
     * @notice Get detailed info about all vaults
     * @return lpTokens Array of LP token addresses
     * @return vaults Array of vault addresses
     * @return totalStakes Array of total staked amounts
     */
    function getVaultDetails() external view returns (
        address[] memory lpTokens,
        address[] memory vaults,
        uint256[] memory totalStakes
    ) {
        uint256 count = allVaults.length;
        lpTokens = new address[](count);
        vaults = new address[](count);
        totalStakes = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            vaults[i] = allVaults[i];
            LiquidityRewardsVault vault = LiquidityRewardsVault(allVaults[i]);
            lpTokens[i] = address(vault.lpToken());
            totalStakes[i] = vault.totalStaked();
        }
        
        return (lpTokens, vaults, totalStakes);
    }
}
