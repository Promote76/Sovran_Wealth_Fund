// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PropertyToken
 * @dev ERC20 token representing fractional ownership in a specific real estate property
 * Each property gets its own token, allowing investors to own shares
 */
contract PropertyToken is ERC20, Ownable, Pausable {
    struct PropertyDetails {
        string propertyAddress;
        uint256 purchasePrice;      // In USD (scaled by 1e18)
        uint256 currentValue;        // In USD (scaled by 1e18)
        uint256 purchaseDate;
        uint256 totalShares;         // Total tokens minted = property shares
        uint256 monthlyRent;         // Monthly rental income in USD (scaled by 1e18)
        bool isActive;
        string metadataURI;          // IPFS link to property documents, images, etc.
    }

    PropertyDetails public property;
    address public investmentPool;   // Address of RealEstateInvestmentPool contract
    
    // Rental income tracking
    uint256 public totalRentalDistributed;
    uint256 public lastDistributionTime;
    
    // Distribution tracking per token holder
    mapping(address => uint256) public lastClaimedDistribution;
    mapping(address => uint256) public unclaimedRentalIncome;

    event PropertyValueUpdated(uint256 oldValue, uint256 newValue, uint256 timestamp);
    event RentalIncomeDistributed(uint256 amount, uint256 timestamp);
    event RentalIncomeClaimed(address indexed investor, uint256 amount);
    event PropertySold(uint256 salePrice, uint256 profit, uint256 timestamp);

    constructor(
        string memory name,
        string memory symbol,
        string memory _propertyAddress,
        uint256 _purchasePrice,
        uint256 _monthlyRent,
        uint256 _totalShares,
        string memory _metadataURI
    ) ERC20(name, symbol) Ownable(msg.sender) {
        property = PropertyDetails({
            propertyAddress: _propertyAddress,
            purchasePrice: _purchasePrice,
            currentValue: _purchasePrice,
            purchaseDate: block.timestamp,
            totalShares: _totalShares,
            monthlyRent: _monthlyRent,
            isActive: true,
            metadataURI: _metadataURI
        });

        lastDistributionTime = block.timestamp;
    }

    /**
     * @dev Mint property tokens to investors (only callable by investment pool)
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == investmentPool || msg.sender == owner(), "Only pool or owner");
        require(totalSupply() + amount <= property.totalShares, "Exceeds total shares");
        _mint(to, amount);
    }

    /**
     * @dev Update property value (for appreciation tracking)
     */
    function updatePropertyValue(uint256 newValue) external onlyOwner {
        uint256 oldValue = property.currentValue;
        property.currentValue = newValue;
        emit PropertyValueUpdated(oldValue, newValue, block.timestamp);
    }

    /**
     * @dev Distribute rental income to all token holders
     * Income is credited proportionally, investors claim when ready
     */
    function distributeRentalIncome(uint256 amount) external payable onlyOwner {
        require(amount > 0, "Amount must be positive");
        require(msg.value >= amount, "Insufficient BNB sent");
        
        totalRentalDistributed += amount;
        lastDistributionTime = block.timestamp;
        
        emit RentalIncomeDistributed(amount, block.timestamp);
    }

    /**
     * @dev Calculate pending rental income for an investor
     */
    function pendingRentalIncome(address investor) public view returns (uint256) {
        if (totalSupply() == 0) return 0;
        
        uint256 balance = balanceOf(investor);
        if (balance == 0) return 0;

        // Calculate share of total distributed income
        uint256 shareOfIncome = (totalRentalDistributed * balance) / property.totalShares;
        uint256 alreadyClaimed = lastClaimedDistribution[investor];
        
        return shareOfIncome > alreadyClaimed ? shareOfIncome - alreadyClaimed : 0;
    }

    /**
     * @dev Claim rental income
     */
    function claimRentalIncome() external whenNotPaused {
        uint256 pending = pendingRentalIncome(msg.sender);
        require(pending > 0, "No rental income to claim");

        lastClaimedDistribution[msg.sender] += pending;
        
        (bool success, ) = payable(msg.sender).call{value: pending}("");
        require(success, "Transfer failed");

        emit RentalIncomeClaimed(msg.sender, pending);
    }

    /**
     * @dev Get current appreciation (property value increase)
     */
    function getAppreciation() public view returns (uint256) {
        if (property.currentValue > property.purchasePrice) {
            return property.currentValue - property.purchasePrice;
        }
        return 0;
    }

    /**
     * @dev Get investor's share of appreciation
     */
    function getInvestorAppreciation(address investor) public view returns (uint256) {
        uint256 totalAppreciation = getAppreciation();
        if (totalAppreciation == 0 || property.totalShares == 0) return 0;
        
        uint256 balance = balanceOf(investor);
        return (totalAppreciation * balance) / property.totalShares;
    }

    /**
     * @dev Set investment pool address
     */
    function setInvestmentPool(address _pool) external onlyOwner {
        investmentPool = _pool;
    }

    /**
     * @dev Pause/unpause transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Record property sale and distribute proceeds
     */
    function recordPropertySale(uint256 salePrice) external onlyOwner {
        require(property.isActive, "Property already sold");
        
        property.isActive = false;
        uint256 profit = salePrice > property.purchasePrice ? salePrice - property.purchasePrice : 0;
        
        emit PropertySold(salePrice, profit, block.timestamp);
    }

    /**
     * @dev Get comprehensive property info
     */
    function getPropertyInfo() external view returns (
        string memory propertyAddress,
        uint256 purchasePrice,
        uint256 currentValue,
        uint256 monthlyRent,
        uint256 totalShares,
        uint256 appreciation,
        bool isActive
    ) {
        return (
            property.propertyAddress,
            property.purchasePrice,
            property.currentValue,
            property.monthlyRent,
            property.totalShares,
            getAppreciation(),
            property.isActive
        );
    }

    // Receive BNB for rental income
    receive() external payable {}
}
