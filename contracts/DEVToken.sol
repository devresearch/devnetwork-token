pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol";

contract DEVToken is PausableToken, MintableToken {
  using SafeMath for uint256;

  string public name = "DEVToken";
  string public symbol = "DEV";
  uint8 public decimals = 18;
  
  /**
   * @dev mint timelocked tokens
   */
  function mintTimelocked(address _to, uint256 _amount, uint256 _releaseTime)
    onlyOwner canMint returns (TokenTimelock) {

    TokenTimelock timelock = new TokenTimelock(this, _to, _releaseTime);
    mint(timelock, _amount);

    return timelock;
  }
}
