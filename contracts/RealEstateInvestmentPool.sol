// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PropertyToken.sol";

/**
 * @title RealEstateInvestmentPool
 * @dev Main contract for managing real estate investments
 * Allows investors to pool funds and invest in tokenized properties
 */
contract RealEstateInvestmentPool is Ownable, Pausable, ReentrancyGuard {
    
    struct Investment {
        address propertyToken;
        uint256 investedAmount;      // In BNB
        uint256 tokensOwned;
        uint256 investmentDate;
        bool isActive;
    }

    struct Property {
        address propertyToken;
        string propertyAddress;
        uint256 targetRaise;          // Total BNB needed
        uint256 currentRaise;         // BNB raised so far
        uint256 pricePerShare;        // BNB per property token
        uint256 totalShares;
        bool isFunded;
        bool isActive;
        uint256 createdAt;
    }

    // Property registry
    Property[] public properties;
    mapping(address => uint256) public propertyIndex;  // propertyToken => index
    
    // Investor tracking
    mapping(address => Investment[]) public investorPortfolio;
    mapping(address => uint256) public totalInvested;
    mapping(address => uint256) public totalRentalEarned;

    // Platform fees
    uint256 public platformFeePercent = 250;  // 2.5% (basis points)
    address public feeRecipient;
    uint256 public totalFeesCollected;

    // Minimum investment
    uint256 public minimumInvestment = 0.1 ether;  // 0.1 BNB minimum

    event PropertyListed(
        address indexed propertyToken,
        string propertyAddress,
        uint256 targetRaise,
        uint256 pricePerShare,
        uint256 timestamp
    );
    event InvestmentMade(
        address indexed investor,
        address indexed propertyToken,
        uint256 amount,
        uint256 tokensReceived,
        uint256 timestamp
    );
    event PropertyFunded(address indexed propertyToken, uint256 totalRaised, uint256 timestamp);
    event RentalIncomeDistributed(address indexed propertyToken, uint256 amount, uint256 timestamp);
    event InvestmentWithdrawn(address indexed investor, address indexed propertyToken, uint256 amount);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev List a new property for investment
     */
    function listProperty(
        string memory name,
        string memory symbol,
        string memory propertyAddress,
        uint256 purchasePrice,
        uint256 monthlyRent,
        uint256 totalShares,
        uint256 pricePerShare,
        string memory metadataURI
    ) external onlyOwner returns (address) {
        // Deploy new PropertyToken
        PropertyToken propertyToken = new PropertyToken(
            name,
            symbol,
            propertyAddress,
            purchasePrice,
            monthlyRent,
            totalShares,
            metadataURI
        );

        uint256 targetRaise = totalShares * pricePerShare;

        properties.push(Property({
            propertyToken: address(propertyToken),
            propertyAddress: propertyAddress,
            targetRaise: targetRaise,
            currentRaise: 0,
            pricePerShare: pricePerShare,
            totalShares: totalShares,
            isFunded: false,
            isActive: true,
            createdAt: block.timestamp
        }));

        propertyIndex[address(propertyToken)] = properties.length - 1;
        propertyToken.setInvestmentPool(address(this));

        emit PropertyListed(
            address(propertyToken),
            propertyAddress,
            targetRaise,
            pricePerShare,
            block.timestamp
        );

        return address(propertyToken);
    }

    /**
     * @dev Invest in a property
     */
    function invest(address propertyToken) external payable nonReentrant whenNotPaused {
        require(msg.value >= minimumInvestment, "Below minimum investment");
        
        uint256 propIndex = propertyIndex[propertyToken];
        Property storage prop = properties[propIndex];
        
        require(prop.isActive, "Property not active");
        require(!prop.isFunded, "Property already funded");
        require(prop.currentRaise + msg.value <= prop.targetRaise, "Exceeds target raise");

        // Calculate tokens to mint (shares)
        uint256 tokenAmount = msg.value / prop.pricePerShare;
        require(tokenAmount > 0, "Investment too small");

        // Calculate platform fee
        uint256 fee = (msg.value * platformFeePercent) / 10000;
        uint256 netInvestment = msg.value - fee;

        // Update property raise
        prop.currentRaise += netInvestment;

        // Mint property tokens to investor
        PropertyToken(propertyToken).mint(msg.sender, tokenAmount);

        // Record investment
        investorPortfolio[msg.sender].push(Investment({
            propertyToken: propertyToken,
            investedAmount: netInvestment,
            tokensOwned: tokenAmount,
            investmentDate: block.timestamp,
            isActive: true
        }));

        totalInvested[msg.sender] += netInvestment;

        // Collect fee
        totalFeesCollected += fee;
        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        emit InvestmentMade(msg.sender, propertyToken, netInvestment, tokenAmount, block.timestamp);

        // Check if fully funded
        if (prop.currentRaise >= prop.targetRaise) {
            prop.isFunded = true;
            emit PropertyFunded(propertyToken, prop.currentRaise, block.timestamp);
        }
    }

    /**
     * @dev Distribute rental income to property (owner calls this monthly)
     */
    function distributeRentalIncome(address propertyToken) external payable onlyOwner {
        require(msg.value > 0, "Must send rental income");
        
        PropertyToken(propertyToken).distributeRentalIncome{value: msg.value}(msg.value);
        
        emit RentalIncomeDistributed(propertyToken, msg.value, block.timestamp);
    }

    /**
     * @dev Get investor's portfolio
     */
    function getInvestorPortfolio(address investor) external view returns (Investment[] memory) {
        return investorPortfolio[investor];
    }

    /**
     * @dev Get all active properties
     */
    function getAllProperties() external view returns (Property[] memory) {
        return properties;
    }

    /**
     * @dev Get investor's total portfolio value
     */
    function getInvestorPortfolioValue(address investor) external view returns (uint256) {
        Investment[] memory portfolio = investorPortfolio[investor];
        uint256 totalValue = 0;

        for (uint256 i = 0; i < portfolio.length; i++) {
            if (portfolio[i].isActive) {
                PropertyToken token = PropertyToken(portfolio[i].propertyToken);
                (, , uint256 currentValue, , uint256 totalShares, , ) = token.getPropertyInfo();
                
                // Calculate investor's share of current property value
                uint256 investorShare = (currentValue * portfolio[i].tokensOwned) / totalShares;
                totalValue += investorShare;
            }
        }

        return totalValue;
    }

    /**
     * @dev Get investor's pending rental income across all properties
     */
    function getInvestorPendingRentalIncome(address investor) external view returns (uint256) {
        Investment[] memory portfolio = investorPortfolio[investor];
        uint256 totalPending = 0;

        for (uint256 i = 0; i < portfolio.length; i++) {
            if (portfolio[i].isActive) {
                PropertyToken token = PropertyToken(portfolio[i].propertyToken);
                totalPending += token.pendingRentalIncome(investor);
            }
        }

        return totalPending;
    }

    /**
     * @dev Update platform fee
     */
    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 1000, "Fee too high (max 10%)");
        platformFeePercent = newFeePercent;
    }

    /**
     * @dev Update minimum investment
     */
    function setMinimumInvestment(uint256 newMinimum) external onlyOwner {
        minimumInvestment = newMinimum;
    }

    /**
     * @dev Pause/unpause investments
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get property count
     */
    function getPropertyCount() external view returns (uint256) {
        return properties.length;
    }

    // Receive BNB
    receive() external payable {}
}
