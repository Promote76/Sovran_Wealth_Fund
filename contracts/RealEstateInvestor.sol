// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RealEstateInvestor
 * @dev All-in-one real estate investment platform
 * Manage multiple properties, investors, rental income, and appreciation in one contract
 * Gas-efficient design with no separate token deployments
 */
contract RealEstateInvestor is Ownable, Pausable, ReentrancyGuard {
    
    struct Property {
        uint256 id;
        string propertyAddress;
        uint256 purchasePrice;       // USD (scaled 1e18)
        uint256 currentValue;         // USD (scaled 1e18)
        uint256 monthlyRent;          // USD (scaled 1e18)
        uint256 totalShares;          // Total fractional shares
        uint256 pricePerShare;        // BNB per share
        uint256 sharesIssued;         // Shares sold to investors
        uint256 targetRaise;          // Total BNB needed
        uint256 currentRaise;         // BNB raised
        uint256 totalRentalDistributed;
        uint256 purchaseDate;
        uint256 lastDistributionTime;
        bool isFunded;
        bool isActive;
        string metadataURI;           // IPFS: docs, images, certificates
    }

    struct Investment {
        uint256 propertyId;
        uint256 sharesOwned;
        uint256 investedAmount;       // BNB invested
        uint256 investmentDate;
        uint256 lastClaimedRental;    // Track claimed rental per investor
        bool isActive;
    }

    struct InvestorStats {
        uint256 totalInvested;        // Total BNB invested across all properties
        uint256 totalRentalEarned;    // Total rental income claimed
        uint256 totalAppreciation;    // Unrealized gains
        uint256 propertyCount;        // Number of properties invested in
    }

    // Property management
    uint256 public propertyCount;
    mapping(uint256 => Property) public properties;
    
    // Investor ownership tracking
    // investor => propertyId => Investment
    mapping(address => mapping(uint256 => Investment)) public investments;
    
    // Investor property list
    // investor => array of propertyIds
    mapping(address => uint256[]) public investorProperties;
    
    // Investor stats
    mapping(address => InvestorStats) public investorStats;
    
    // Total platform stats
    uint256 public totalInvestors;
    uint256 public totalBNBInvested;
    uint256 public totalRentalDistributed;
    uint256 public totalFeesCollected;
    
    // Platform settings
    uint256 public platformFeePercent = 250;  // 2.5% (basis points)
    uint256 public minimumInvestment = 0.05 ether;  // 0.05 BNB minimum
    address public feeRecipient;
    
    // Track unique investors
    mapping(address => bool) public isInvestor;

    // Events
    event PropertyListed(
        uint256 indexed propertyId,
        string propertyAddress,
        uint256 targetRaise,
        uint256 totalShares,
        uint256 pricePerShare
    );
    event InvestmentMade(
        address indexed investor,
        uint256 indexed propertyId,
        uint256 amount,
        uint256 shares
    );
    event PropertyFunded(uint256 indexed propertyId, uint256 totalRaised);
    event RentalIncomeDistributed(uint256 indexed propertyId, uint256 amount);
    event RentalIncomeClaimed(
        address indexed investor,
        uint256 indexed propertyId,
        uint256 amount
    );
    event PropertyValueUpdated(
        uint256 indexed propertyId,
        uint256 oldValue,
        uint256 newValue
    );
    event PropertySold(uint256 indexed propertyId, uint256 salePrice, uint256 profit);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev List a new property for investment
     */
    function listProperty(
        string memory propertyAddress,
        uint256 purchasePrice,
        uint256 monthlyRent,
        uint256 totalShares,
        uint256 pricePerShare,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        propertyCount++;
        uint256 propertyId = propertyCount;

        properties[propertyId] = Property({
            id: propertyId,
            propertyAddress: propertyAddress,
            purchasePrice: purchasePrice,
            currentValue: purchasePrice,
            monthlyRent: monthlyRent,
            totalShares: totalShares,
            pricePerShare: pricePerShare,
            sharesIssued: 0,
            targetRaise: totalShares * pricePerShare,
            currentRaise: 0,
            totalRentalDistributed: 0,
            purchaseDate: block.timestamp,
            lastDistributionTime: block.timestamp,
            isFunded: false,
            isActive: true,
            metadataURI: metadataURI
        });

        emit PropertyListed(
            propertyId,
            propertyAddress,
            totalShares * pricePerShare,
            totalShares,
            pricePerShare
        );

        return propertyId;
    }

    /**
     * @dev Invest in a property
     */
    function invest(uint256 propertyId) external payable nonReentrant whenNotPaused {
        require(msg.value >= minimumInvestment, "Below minimum");
        require(propertyId > 0 && propertyId <= propertyCount, "Invalid property");
        
        Property storage prop = properties[propertyId];
        require(prop.isActive, "Property not active");
        require(!prop.isFunded, "Already funded");
        
        // Calculate shares
        uint256 sharesToBuy = msg.value / prop.pricePerShare;
        require(sharesToBuy > 0, "Investment too small");
        require(prop.sharesIssued + sharesToBuy <= prop.totalShares, "Exceeds available shares");

        // Calculate fee
        uint256 fee = (msg.value * platformFeePercent) / 10000;
        uint256 netInvestment = msg.value - fee;

        // Update property
        prop.currentRaise += netInvestment;
        prop.sharesIssued += sharesToBuy;

        // Track investor
        if (!isInvestor[msg.sender]) {
            isInvestor[msg.sender] = true;
            totalInvestors++;
        }

        // Create or update investment
        Investment storage investment = investments[msg.sender][propertyId];
        if (investment.sharesOwned == 0) {
            // First investment in this property
            investorProperties[msg.sender].push(propertyId);
            investorStats[msg.sender].propertyCount++;
            
            investment.propertyId = propertyId;
            investment.investmentDate = block.timestamp;
            investment.isActive = true;
        }

        investment.sharesOwned += sharesToBuy;
        investment.investedAmount += netInvestment;
        investment.lastClaimedRental = prop.totalRentalDistributed;

        // Update investor stats
        investorStats[msg.sender].totalInvested += netInvestment;
        totalBNBInvested += netInvestment;

        // Collect fee
        totalFeesCollected += fee;
        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee failed");

        emit InvestmentMade(msg.sender, propertyId, netInvestment, sharesToBuy);

        // Check if fully funded
        if (prop.sharesIssued >= prop.totalShares) {
            prop.isFunded = true;
            emit PropertyFunded(propertyId, prop.currentRaise);
        }
    }

    /**
     * @dev Distribute rental income (owner deposits monthly rent)
     */
    function distributeRentalIncome(uint256 propertyId) external payable onlyOwner {
        require(msg.value > 0, "No income sent");
        require(propertyId > 0 && propertyId <= propertyCount, "Invalid property");
        
        Property storage prop = properties[propertyId];
        require(prop.isActive, "Property not active");
        
        prop.totalRentalDistributed += msg.value;
        prop.lastDistributionTime = block.timestamp;
        totalRentalDistributed += msg.value;

        emit RentalIncomeDistributed(propertyId, msg.value);
    }

    /**
     * @dev Calculate pending rental income for an investor
     */
    function pendingRentalIncome(address investor, uint256 propertyId) 
        public 
        view 
        returns (uint256) 
    {
        Investment memory investment = investments[investor][propertyId];
        if (!investment.isActive || investment.sharesOwned == 0) return 0;

        Property memory prop = properties[propertyId];
        if (prop.totalShares == 0) return 0;

        // Total income distributed for this property
        uint256 totalDistributed = prop.totalRentalDistributed;
        
        // Investor's share based on ownership percentage
        uint256 investorShare = (totalDistributed * investment.sharesOwned) / prop.totalShares;
        
        // Subtract what they've already claimed
        uint256 alreadyClaimed = investment.lastClaimedRental;
        
        return investorShare > alreadyClaimed ? investorShare - alreadyClaimed : 0;
    }

    /**
     * @dev Claim rental income from one property
     */
    function claimRentalIncome(uint256 propertyId) external nonReentrant whenNotPaused {
        uint256 pending = pendingRentalIncome(msg.sender, propertyId);
        require(pending > 0, "No income to claim");

        Investment storage investment = investments[msg.sender][propertyId];
        investment.lastClaimedRental += pending;
        
        investorStats[msg.sender].totalRentalEarned += pending;

        (bool success, ) = payable(msg.sender).call{value: pending}("");
        require(success, "Transfer failed");

        emit RentalIncomeClaimed(msg.sender, propertyId, pending);
    }

    /**
     * @dev Claim rental income from all properties at once
     */
    function claimAllRentalIncome() external nonReentrant whenNotPaused {
        uint256[] memory propIds = investorProperties[msg.sender];
        uint256 totalClaimed = 0;

        for (uint256 i = 0; i < propIds.length; i++) {
            uint256 propertyId = propIds[i];
            uint256 pending = pendingRentalIncome(msg.sender, propertyId);
            
            if (pending > 0) {
                Investment storage investment = investments[msg.sender][propertyId];
                investment.lastClaimedRental += pending;
                totalClaimed += pending;
                
                emit RentalIncomeClaimed(msg.sender, propertyId, pending);
            }
        }

        require(totalClaimed > 0, "No income to claim");
        investorStats[msg.sender].totalRentalEarned += totalClaimed;

        (bool success, ) = payable(msg.sender).call{value: totalClaimed}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Update property value (for appreciation tracking)
     */
    function updatePropertyValue(uint256 propertyId, uint256 newValue) external onlyOwner {
        require(propertyId > 0 && propertyId <= propertyCount, "Invalid property");
        
        Property storage prop = properties[propertyId];
        uint256 oldValue = prop.currentValue;
        prop.currentValue = newValue;

        emit PropertyValueUpdated(propertyId, oldValue, newValue);
    }

    /**
     * @dev Get investor's appreciation for one property
     */
    function getInvestorAppreciation(address investor, uint256 propertyId) 
        public 
        view 
        returns (uint256) 
    {
        Investment memory investment = investments[investor][propertyId];
        if (!investment.isActive) return 0;

        Property memory prop = properties[propertyId];
        if (prop.currentValue <= prop.purchasePrice) return 0;

        uint256 appreciation = prop.currentValue - prop.purchasePrice;
        return (appreciation * investment.sharesOwned) / prop.totalShares;
    }

    /**
     * @dev Get investor's portfolio summary
     */
    function getInvestorPortfolio(address investor) 
        external 
        view 
        returns (
            uint256[] memory propertyIds,
            uint256[] memory sharesOwned,
            uint256[] memory investedAmounts,
            uint256[] memory currentValues,
            uint256[] memory pendingRentals,
            uint256[] memory appreciations
        ) 
    {
        uint256[] memory propIds = investorProperties[investor];
        uint256 count = propIds.length;

        propertyIds = new uint256[](count);
        sharesOwned = new uint256[](count);
        investedAmounts = new uint256[](count);
        currentValues = new uint256[](count);
        pendingRentals = new uint256[](count);
        appreciations = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 propId = propIds[i];
            Investment memory inv = investments[investor][propId];
            Property memory prop = properties[propId];

            propertyIds[i] = propId;
            sharesOwned[i] = inv.sharesOwned;
            investedAmounts[i] = inv.investedAmount;
            
            // Current value of investor's share
            currentValues[i] = (prop.currentValue * inv.sharesOwned) / prop.totalShares;
            
            pendingRentals[i] = pendingRentalIncome(investor, propId);
            appreciations[i] = getInvestorAppreciation(investor, propId);
        }

        return (propertyIds, sharesOwned, investedAmounts, currentValues, pendingRentals, appreciations);
    }

    /**
     * @dev Get all active properties
     */
    function getAllProperties() 
        external 
        view 
        returns (
            uint256[] memory ids,
            string[] memory addresses,
            uint256[] memory currentValues,
            uint256[] memory targetRaises,
            uint256[] memory currentRaises,
            bool[] memory isFundedList,
            bool[] memory isActiveList
        ) 
    {
        ids = new uint256[](propertyCount);
        addresses = new string[](propertyCount);
        currentValues = new uint256[](propertyCount);
        targetRaises = new uint256[](propertyCount);
        currentRaises = new uint256[](propertyCount);
        isFundedList = new bool[](propertyCount);
        isActiveList = new bool[](propertyCount);

        for (uint256 i = 1; i <= propertyCount; i++) {
            Property memory prop = properties[i];
            ids[i-1] = prop.id;
            addresses[i-1] = prop.propertyAddress;
            currentValues[i-1] = prop.currentValue;
            targetRaises[i-1] = prop.targetRaise;
            currentRaises[i-1] = prop.currentRaise;
            isFundedList[i-1] = prop.isFunded;
            isActiveList[i-1] = prop.isActive;
        }

        return (ids, addresses, currentValues, targetRaises, currentRaises, isFundedList, isActiveList);
    }

    /**
     * @dev Get investor's total pending rental income across all properties
     */
    function getTotalPendingRental(address investor) external view returns (uint256) {
        uint256[] memory propIds = investorProperties[investor];
        uint256 total = 0;

        for (uint256 i = 0; i < propIds.length; i++) {
            total += pendingRentalIncome(investor, propIds[i]);
        }

        return total;
    }

    /**
     * @dev Get investor's total portfolio value
     */
    function getPortfolioValue(address investor) external view returns (uint256) {
        uint256[] memory propIds = investorProperties[investor];
        uint256 totalValue = 0;

        for (uint256 i = 0; i < propIds.length; i++) {
            Investment memory inv = investments[investor][propIds[i]];
            Property memory prop = properties[propIds[i]];
            
            if (inv.isActive && prop.totalShares > 0) {
                totalValue += (prop.currentValue * inv.sharesOwned) / prop.totalShares;
            }
        }

        return totalValue;
    }

    /**
     * @dev Admin: Update platform fee
     */
    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 1000, "Max 10%");
        platformFeePercent = newFeePercent;
    }

    /**
     * @dev Admin: Update minimum investment
     */
    function setMinimumInvestment(uint256 newMinimum) external onlyOwner {
        minimumInvestment = newMinimum;
    }

    /**
     * @dev Admin: Mark property as sold
     */
    function recordPropertySale(uint256 propertyId, uint256 salePrice) external onlyOwner {
        require(propertyId > 0 && propertyId <= propertyCount, "Invalid property");
        
        Property storage prop = properties[propertyId];
        require(prop.isActive, "Already sold");
        
        prop.isActive = false;
        prop.currentValue = salePrice;
        
        uint256 profit = salePrice > prop.purchasePrice ? salePrice - prop.purchasePrice : 0;
        
        emit PropertySold(propertyId, salePrice, profit);
    }

    /**
     * @dev Pause/unpause
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() 
        external 
        view 
        returns (
            uint256 _propertyCount,
            uint256 _totalInvestors,
            uint256 _totalBNBInvested,
            uint256 _totalRentalDistributed,
            uint256 _totalFeesCollected
        ) 
    {
        return (
            propertyCount,
            totalInvestors,
            totalBNBInvested,
            totalRentalDistributed,
            totalFeesCollected
        );
    }

    // Receive BNB for rental income
    receive() external payable {}
}
