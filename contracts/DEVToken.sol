// Copyright (c) 2018 Devnetwork
// license that can be found in the LICENSE file.

pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol";

contract DEVToken is PausableToken, MintableToken {
  using SafeMath for uint256;

  string public name = "DEVToken";
  string public symbol = "DEV";
  uint8 public decimals = 18;

  /**
   * @dev Override the pause function to ensure no one can pause after minting.
   */
  function pause() onlyOwner whenNotPaused canMint public {
      super.pause();
  }

  /**
   * @dev Make sure we cannot finish minting when paused, otherwise we are paused forever.
   */
  function finishMinting() onlyOwner whenNotPaused canMint public returns (bool) {
      return super.finishMinting();
  }
  
  /**
   * @dev Mint timelocked tokens
   */
  function mintTimelocked(address _to, uint256 _amount, uint256 _releaseTime)
    onlyOwner canMint public returns (TokenTimelock) {

    TokenTimelock timelock = new TokenTimelock(this, _to, _releaseTime);
    mint(timelock, _amount);

    return timelock;
  }
}
