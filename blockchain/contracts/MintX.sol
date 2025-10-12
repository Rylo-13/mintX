// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@layerzerolabs/onft-evm/contracts/onft721/ONFT721.sol";

contract MintX is ONFT721, ERC721Enumerable, ERC721URIStorage {
    uint256 private currentTokenId;

    event NFTMinted(address indexed to, uint256 tokenId);

    constructor(
        string memory name,
        string memory symbol,
        address lzEndpoint,
        address delegate
    ) ONFT721(name, symbol, lzEndpoint, delegate) {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function setBaseURI(string memory baseURI) external override onlyOwner {
        baseTokenURI = baseURI;
    }

    function _baseURI() internal view override(ERC721, ONFT721) returns (string memory) {
        return baseTokenURI;
    }

    // Resolve multiple inheritance conflicts
    function _increaseBalance(address account, uint128 amount)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, amount);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    // Main minting function
    function mintNFT(string memory _tokenURI) external {
        currentTokenId++;
        uint256 newTokenId = currentTokenId;

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);

        emit NFTMinted(msg.sender, newTokenId);
    }

    // Get all tokens owned by an address
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
    }

    /**
     * @dev Function to set URI for bridged tokens
     * This should be called after a token is received from another chain
     * Only the token owner can set the URI for their token
     */
    function setBridgedTokenURI(uint256 tokenId, string memory uri) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only token owner can set URI");
        require(bytes(uri).length > 0, "URI cannot be empty");
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Batch restore URIs for multiple tokens
     */
    function batchSetBridgedURIs(
        uint256[] calldata tokenIds,
        string[] calldata uris
    ) external onlyOwner {
        require(tokenIds.length == uris.length, "Array length mismatch");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (_ownerOf(tokenIds[i]) != address(0) && bytes(uris[i]).length > 0) {
                _setTokenURI(tokenIds[i], uris[i]);
            }
        }
    }

    /**
     * @dev Manual URI setting function - only owner can set URIs
     */
    function setTokenURIByOwner(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _setTokenURI(tokenId, _tokenURI);
    }

    /**
     * @dev Get URI before bridging (for frontend to capture)
     */
    function getTokenURIForBridge(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenURI(tokenId);
    }
}
