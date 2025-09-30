// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MoabiteConstitution.sol";

/**
 * @title SovranID
 * @dev NFT-based citizenship system for The Moabite Federation
 * Each SovranID represents a citizen with tribal metadata and governance rights
 */
contract SovranID is ERC721, ERC721URIStorage, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    
    // Tribal affiliation structure
    struct TribalInfo {
        string tribeName;         // Name of the tribe/clan
        string lineage;           // Ancestral lineage information
        string region;            // Geographic region
        uint256 joinDate;         // When citizen joined the tribe
        bool isTribalLeader;      // Leadership status
        string additionalData;    // Additional tribal metadata
    }
    
    // Citizen profile structure
    struct CitizenProfile {
        uint256 tokenId;          // SovranID token ID
        string sovereignName;     // Chosen sovereign name
        bytes32 biometricHash;    // Hash of biometric data (optional)
        string ipfsMetadata;      // IPFS hash of additional metadata
        uint256 issuanceDate;     // When the ID was issued
        uint256 expirationDate;   // ID expiration (0 for lifetime)
        bool isActive;            // Current status
        bool hasVotingRights;     // Constitutional voting rights
        TribalInfo tribal;        // Tribal affiliation data
    }
    
    // State variables
    MoabiteConstitution public constitution;
    Counters.Counter private _tokenIdCounter;
    
    mapping(uint256 => CitizenProfile) public citizens;
    mapping(address => uint256) public addressToTokenId;
    mapping(string => bool) public sovereignNameTaken;
    mapping(string => uint256[]) public tribeMembers; // tribe name => token IDs
    
    uint256 public constant MAX_SUPPLY = 100000; // Maximum citizens
    bool public mintingPaused = false;
    
    // Events
    event SovranIDMinted(uint256 indexed tokenId, address indexed citizen, string sovereignName, string tribeName);
    event TribalInfoUpdated(uint256 indexed tokenId, string tribeName, bool isLeader);
    event VotingRightsGranted(uint256 indexed tokenId, bool granted);
    event CitizenshipRevoked(uint256 indexed tokenId, string reason);
    event BiometricHashUpdated(uint256 indexed tokenId, bytes32 newHash);
    
    modifier onlyConstitution() {
        require(msg.sender == address(constitution), "SovranID: Only constitution contract");
        _;
    }
    
    modifier onlyActiveCitizen(uint256 tokenId) {
        require(citizens[tokenId].isActive, "SovranID: Citizen not active");
        require(citizens[tokenId].expirationDate == 0 || block.timestamp <= citizens[tokenId].expirationDate, "SovranID: ID expired");
        _;
    }
    
    constructor(address _constitution) ERC721("SovranID - Moabite Federation Citizenship", "SOVRANID") {
        require(_constitution != address(0), "Invalid constitution address");
        constitution = MoabiteConstitution(_constitution);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
        
        // Start token IDs at 1
        _tokenIdCounter.increment();
    }
    
    /**
     * @dev Mint a new SovranID for a citizen
     */
    function mintSovranID(
        address to,
        string memory sovereignName,
        string memory tribeName,
        string memory lineage,
        string memory region,
        string memory ipfsMetadata,
        bytes32 biometricHash,
        bool hasVotingRights
    ) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256) {
        require(!mintingPaused, "SovranID: Minting is paused");
        require(to != address(0), "SovranID: Cannot mint to zero address");
        require(addressToTokenId[to] == 0, "SovranID: Address already has ID");
        require(!sovereignNameTaken[sovereignName], "SovranID: Sovereign name taken");
        require(bytes(sovereignName).length > 0, "SovranID: Sovereign name required");
        require(bytes(tribeName).length > 0, "SovranID: Tribe name required");
        require(_tokenIdCounter.current() <= MAX_SUPPLY, "SovranID: Max supply reached");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Create citizen profile
        citizens[tokenId] = CitizenProfile({
            tokenId: tokenId,
            sovereignName: sovereignName,
            biometricHash: biometricHash,
            ipfsMetadata: ipfsMetadata,
            issuanceDate: block.timestamp,
            expirationDate: 0, // Lifetime by default
            isActive: true,
            hasVotingRights: hasVotingRights,
            tribal: TribalInfo({
                tribeName: tribeName,
                lineage: lineage,
                region: region,
                joinDate: block.timestamp,
                isTribalLeader: false,
                additionalData: ""
            })
        });
        
        // Update mappings
        addressToTokenId[to] = tokenId;
        sovereignNameTaken[sovereignName] = true;
        tribeMembers[tribeName].push(tokenId);
        
        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, ipfsMetadata);
        
        // Grant citizenship in constitution contract
        if (hasVotingRights) {
            constitution.grantCitizenship(to);
        }
        
        emit SovranIDMinted(tokenId, to, sovereignName, tribeName);
        
        return tokenId;
    }
    
    /**
     * @dev Update tribal information
     */
    function updateTribalInfo(
        uint256 tokenId,
        string memory newTribeName,
        string memory newLineage,
        string memory newRegion,
        string memory additionalData
    ) external onlyRole(REGISTRAR_ROLE) onlyActiveCitizen(tokenId) {
        CitizenProfile storage citizen = citizens[tokenId];
        
        // Remove from old tribe if changing
        if (keccak256(bytes(citizen.tribal.tribeName)) != keccak256(bytes(newTribeName))) {
            _removeFromTribe(tokenId, citizen.tribal.tribeName);
            tribeMembers[newTribeName].push(tokenId);
        }
        
        citizen.tribal.tribeName = newTribeName;
        citizen.tribal.lineage = newLineage;
        citizen.tribal.region = newRegion;
        citizen.tribal.additionalData = additionalData;
        
        emit TribalInfoUpdated(tokenId, newTribeName, citizen.tribal.isTribalLeader);
    }
    
    /**
     * @dev Grant or revoke tribal leadership
     */
    function setTribalLeadership(uint256 tokenId, bool isLeader) external onlyRole(REGISTRAR_ROLE) onlyActiveCitizen(tokenId) {
        CitizenProfile storage citizen = citizens[tokenId];
        citizen.tribal.isTribalLeader = isLeader;
        
        // Grant tribal leader role in constitution if needed
        if (isLeader) {
            constitution.grantRole(constitution.TRIBAL_LEADER_ROLE(), ownerOf(tokenId));
        }
        
        emit TribalInfoUpdated(tokenId, citizen.tribal.tribeName, isLeader);
    }
    
    /**
     * @dev Update biometric hash
     */
    function updateBiometricHash(uint256 tokenId, bytes32 newHash) external {
        require(ownerOf(tokenId) == msg.sender || hasRole(REGISTRAR_ROLE, msg.sender), "SovranID: Not authorized");
        require(citizens[tokenId].isActive, "SovranID: Citizen not active");
        
        citizens[tokenId].biometricHash = newHash;
        emit BiometricHashUpdated(tokenId, newHash);
    }
    
    /**
     * @dev Grant or revoke voting rights
     */
    function setVotingRights(uint256 tokenId, bool hasRights) external onlyRole(REGISTRAR_ROLE) onlyActiveCitizen(tokenId) {
        CitizenProfile storage citizen = citizens[tokenId];
        citizen.hasVotingRights = hasRights;
        
        address citizenAddress = ownerOf(tokenId);
        if (hasRights) {
            constitution.grantCitizenship(citizenAddress);
        } else {
            constitution.revokeCitizenship(citizenAddress);
        }
        
        emit VotingRightsGranted(tokenId, hasRights);
    }
    
    /**
     * @dev Revoke citizenship
     */
    function revokeCitizenship(uint256 tokenId, string memory reason) external onlyRole(REGISTRAR_ROLE) {
        require(_exists(tokenId), "SovranID: Token does not exist");
        
        CitizenProfile storage citizen = citizens[tokenId];
        citizen.isActive = false;
        citizen.hasVotingRights = false;
        
        // Remove from constitution
        address citizenAddress = ownerOf(tokenId);
        constitution.revokeCitizenship(citizenAddress);
        
        // Remove from tribe
        _removeFromTribe(tokenId, citizen.tribal.tribeName);
        
        emit CitizenshipRevoked(tokenId, reason);
    }
    
    /**
     * @dev Get citizen profile
     */
    function getCitizenProfile(uint256 tokenId) external view returns (
        string memory sovereignName,
        string memory tribeName,
        string memory lineage,
        string memory region,
        uint256 issuanceDate,
        bool isActive,
        bool hasVotingRights,
        bool isTribalLeader
    ) {
        require(_exists(tokenId), "SovranID: Token does not exist");
        CitizenProfile storage citizen = citizens[tokenId];
        
        return (
            citizen.sovereignName,
            citizen.tribal.tribeName,
            citizen.tribal.lineage,
            citizen.tribal.region,
            citizen.issuanceDate,
            citizen.isActive,
            citizen.hasVotingRights,
            citizen.tribal.isTribalLeader
        );
    }
    
    /**
     * @dev Get tribe members
     */
    function getTribeMembers(string memory tribeName) external view returns (uint256[] memory) {
        return tribeMembers[tribeName];
    }
    
    /**
     * @dev Check if address is a citizen
     */
    function isCitizen(address account) external view returns (bool) {
        uint256 tokenId = addressToTokenId[account];
        if (tokenId == 0) return false;
        
        CitizenProfile storage citizen = citizens[tokenId];
        return citizen.isActive && (citizen.expirationDate == 0 || block.timestamp <= citizen.expirationDate);
    }
    
    /**
     * @dev Verify biometric hash
     */
    function verifyBiometric(uint256 tokenId, bytes32 hash) external view returns (bool) {
        require(_exists(tokenId), "SovranID: Token does not exist");
        return citizens[tokenId].biometricHash == hash && citizens[tokenId].isActive;
    }
    
    /**
     * @dev Remove token from tribe members array
     */
    function _removeFromTribe(uint256 tokenId, string memory tribeName) internal {
        uint256[] storage members = tribeMembers[tribeName];
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == tokenId) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Pause/unpause minting
     */
    function setMintingPaused(bool paused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        mintingPaused = paused;
    }
    
    /**
     * @dev Override transfer to update constitution citizenship
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        if (from != address(0) && to != address(0)) {
            // Update address mapping
            addressToTokenId[from] = 0;
            addressToTokenId[to] = tokenId;
            
            // Update constitution citizenship
            CitizenProfile storage citizen = citizens[tokenId];
            if (citizen.hasVotingRights && citizen.isActive) {
                constitution.revokeCitizenship(from);
                constitution.grantCitizenship(to);
            }
        }
    }
    
    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}