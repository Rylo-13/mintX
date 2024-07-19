// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AiART is ERC721URIStorage {
    uint256 private _currentTokenId;

    constructor() ERC721("AiART", "AIART") {}

    function mintNFT(string memory _tokenURI) external {
        _currentTokenId++; // Increment token ID before minting
        uint256 newTokenId = _currentTokenId;
        _mint(msg.sender, newTokenId); // Mint the NFT
        _setTokenURI(newTokenId, _tokenURI); // Set token URI for the minted token
    }
}
