// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MoabiteConstitution
 * @dev Constitutional foundation contract for The Moabite Federation digital nation-state
 * Stores constitutional documents on IPFS and enforces governance rules across all sub-DAOs
 */
contract MoabiteConstitution is AccessControlEnumerable, ReentrancyGuard, Pausable {
    
    // Role definitions for The Moabite Federation
    bytes32 public constant GRAND_VIZIER_ROLE = keccak256("GRAND_VIZIER_ROLE");
    bytes32 public constant TRIBAL_LEADER_ROLE = keccak256("TRIBAL_LEADER_ROLE");
    bytes32 public constant IMAM_ROLE = keccak256("IMAM_ROLE");
    bytes32 public constant CITIZEN_ROLE = keccak256("CITIZEN_ROLE");
    
    // Constitutional document structure
    struct ConstitutionalDocument {
        string ipfsCID;           // IPFS hash of the document
        string title;             // Document title
        string documentType;      // "constitution", "amendment", "law", "treaty"
        uint256 ratificationDate; // Timestamp of ratification
        address proposedBy;       // Address that proposed the document
        uint256 votesFor;         // Votes in favor
        uint256 votesAgainst;     // Votes against
        bool isRatified;          // Whether the document is active
        bool isActive;            // Current status
    }
    
    // Governance proposal structure
    struct GovernanceProposal {
        uint256 id;
        string title;
        string description;
        string ipfsCID;           // IPFS hash of detailed proposal
        address proposer;
        uint256 createdAt;
        uint256 votingEndsAt;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
        bool passed;
        mapping(address => bool) hasVoted;
    }
    
    // State variables
    mapping(uint256 => ConstitutionalDocument) public constitutionalDocuments;
    mapping(uint256 => GovernanceProposal) public proposals;
    mapping(address => bool) public authorizedContracts; // Contracts that can enforce constitutional rules
    
    uint256 public nextDocumentId = 1;
    uint256 public nextProposalId = 1;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant QUORUM_PERCENTAGE = 30; // 30% of total voters needed
    
    string public mainConstitutionCID; // Primary constitution IPFS hash
    uint256 public foundingDate;
    
    // Events
    event ConstitutionalDocumentAdded(uint256 indexed documentId, string ipfsCID, string title, string documentType);
    event DocumentRatified(uint256 indexed documentId, uint256 votesFor, uint256 votesAgainst);
    event ProposalCreated(uint256 indexed proposalId, address proposer, string title);
    event ProposalVoted(uint256 indexed proposalId, address voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event ContractAuthorized(address indexed contractAddress, bool authorized);
    
    modifier onlyGrandVizier() {
        require(hasRole(GRAND_VIZIER_ROLE, msg.sender), "MoabiteConstitution: Caller is not Grand Vizier");
        _;
    }
    
    modifier onlyTribalLeaderOrAbove() {
        require(
            hasRole(GRAND_VIZIER_ROLE, msg.sender) || 
            hasRole(TRIBAL_LEADER_ROLE, msg.sender),
            "MoabiteConstitution: Insufficient authority"
        );
        _;
    }
    
    modifier onlyCitizen() {
        require(hasRole(CITIZEN_ROLE, msg.sender), "MoabiteConstitution: Must be citizen");
        _;
    }
    
    constructor(string memory _mainConstitutionCID, address _grandVizier) {
        require(bytes(_mainConstitutionCID).length > 0, "Constitution CID required");
        require(_grandVizier != address(0), "Invalid Grand Vizier address");
        
        mainConstitutionCID = _mainConstitutionCID;
        foundingDate = block.timestamp;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _grandVizier);
        _grantRole(GRAND_VIZIER_ROLE, _grandVizier);
        
        // Add founding constitutional document
        constitutionalDocuments[1] = ConstitutionalDocument({
            ipfsCID: _mainConstitutionCID,
            title: "The Moabite Federation Constitution",
            documentType: "constitution",
            ratificationDate: block.timestamp,
            proposedBy: _grandVizier,
            votesFor: 1,
            votesAgainst: 0,
            isRatified: true,
            isActive: true
        });
        
        emit ConstitutionalDocumentAdded(1, _mainConstitutionCID, "The Moabite Federation Constitution", "constitution");
        emit DocumentRatified(1, 1, 0);
    }
    
    /**
     * @dev Add a new constitutional document (amendment, law, treaty)
     */
    function addConstitutionalDocument(
        string memory _ipfsCID,
        string memory _title,
        string memory _documentType
    ) external onlyTribalLeaderOrAbove returns (uint256) {
        require(bytes(_ipfsCID).length > 0, "IPFS CID required");
        require(bytes(_title).length > 0, "Title required");
        
        uint256 documentId = nextDocumentId++;
        
        constitutionalDocuments[documentId] = ConstitutionalDocument({
            ipfsCID: _ipfsCID,
            title: _title,
            documentType: _documentType,
            ratificationDate: 0,
            proposedBy: msg.sender,
            votesFor: 0,
            votesAgainst: 0,
            isRatified: false,
            isActive: false
        });
        
        emit ConstitutionalDocumentAdded(documentId, _ipfsCID, _title, _documentType);
        return documentId;
    }
    
    /**
     * @dev Create a governance proposal
     */
    function createProposal(
        string memory _title,
        string memory _description,
        string memory _ipfsCID
    ) external onlyCitizen returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_description).length > 0, "Description required");
        
        uint256 proposalId = nextProposalId++;
        GovernanceProposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.title = _title;
        proposal.description = _description;
        proposal.ipfsCID = _ipfsCID;
        proposal.proposer = msg.sender;
        proposal.createdAt = block.timestamp;
        proposal.votingEndsAt = block.timestamp + VOTING_PERIOD;
        proposal.executed = false;
        proposal.passed = false;
        
        emit ProposalCreated(proposalId, msg.sender, _title);
        return proposalId;
    }
    
    /**
     * @dev Vote on a governance proposal
     */
    function voteOnProposal(uint256 _proposalId, bool _support) external onlyCitizen {
        GovernanceProposal storage proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp <= proposal.votingEndsAt, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (_support) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }
        
        emit ProposalVoted(_proposalId, msg.sender, _support);
    }
    
    /**
     * @dev Execute a proposal after voting period
     */
    function executeProposal(uint256 _proposalId) external {
        GovernanceProposal storage proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp > proposal.votingEndsAt, "Voting still active");
        require(!proposal.executed, "Proposal already executed");
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 citizenCount = getRoleMemberCount(CITIZEN_ROLE);
        
        // Check quorum (30% of citizens must vote)
        require(totalVotes >= (citizenCount * QUORUM_PERCENTAGE) / 100, "Quorum not met");
        
        proposal.executed = true;
        proposal.passed = proposal.votesFor > proposal.votesAgainst;
        
        emit ProposalExecuted(_proposalId, proposal.passed);
    }
    
    /**
     * @dev Grant citizenship (SovranID NFT integration)
     */
    function grantCitizenship(address _citizen) external onlyTribalLeaderOrAbove {
        require(_citizen != address(0), "Invalid citizen address");
        _grantRole(CITIZEN_ROLE, _citizen);
    }
    
    /**
     * @dev Revoke citizenship
     */
    function revokeCitizenship(address _citizen) external onlyGrandVizier {
        _revokeRole(CITIZEN_ROLE, _citizen);
    }
    
    /**
     * @dev Authorize a contract to enforce constitutional rules
     */
    function authorizeContract(address _contract, bool _authorized) external onlyGrandVizier {
        require(_contract != address(0), "Invalid contract address");
        authorizedContracts[_contract] = _authorized;
        emit ContractAuthorized(_contract, _authorized);
    }
    
    /**
     * @dev Check if an action complies with constitutional rules
     */
    function isActionConstitutional(
        address _actor,
        string memory _actionType,
        bytes memory _actionData
    ) external view returns (bool) {
        require(authorizedContracts[msg.sender], "Unauthorized contract");
        
        // Basic constitutional checks
        if (!hasRole(CITIZEN_ROLE, _actor)) {
            return false; // Non-citizens cannot perform constitutional actions
        }
        
        // Additional rule checks can be added here based on action type
        return true;
    }
    
    /**
     * @dev Get constitutional document details
     */
    function getConstitutionalDocument(uint256 _documentId) external view returns (
        string memory ipfsCID,
        string memory title,
        string memory documentType,
        uint256 ratificationDate,
        address proposedBy,
        bool isRatified,
        bool isActive
    ) {
        ConstitutionalDocument storage doc = constitutionalDocuments[_documentId];
        return (
            doc.ipfsCID,
            doc.title,
            doc.documentType,
            doc.ratificationDate,
            doc.proposedBy,
            doc.isRatified,
            doc.isActive
        );
    }
    
    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 _proposalId) external view returns (
        string memory title,
        string memory description,
        string memory ipfsCID,
        address proposer,
        uint256 createdAt,
        uint256 votingEndsAt,
        uint256 votesFor,
        uint256 votesAgainst,
        bool executed,
        bool passed
    ) {
        GovernanceProposal storage proposal = proposals[_proposalId];
        return (
            proposal.title,
            proposal.description,
            proposal.ipfsCID,
            proposal.proposer,
            proposal.createdAt,
            proposal.votingEndsAt,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.executed,
            proposal.passed
        );
    }
    
    /**
     * @dev Emergency pause (Grand Vizier only)
     */
    function pause() external onlyGrandVizier {
        _pause();
    }
    
    /**
     * @dev Resume operations
     */
    function unpause() external onlyGrandVizier {
        _unpause();
    }
}