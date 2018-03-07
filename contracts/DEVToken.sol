pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract DEVToken is PausableToken, MintableToken {
  using SafeMath for uint256;

  string public name = "DEVToken";
  string public symbol = "DEV";
  uint8  public decimals = 18;

  bool   public transferEnabled = false; // indicates that tokens can transfer or not

  // Modifiers
  modifier onlyWhenTransferEnabled() {
      require(transferEnabled);
      _;
  }

  modifier validDestination(address _to) {
      require(_to != address(owner));
      _;
  }

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
   * @dev Mint tokens
   */
  function mintToken(address[] _to, uint256[] _amount)
    onlyOwner canMint public returns (bool) 
  {
      for (uint i = 0; i < _to.length; i++) {
        mint(_to[i], _amount[i]);
      }
      return true;
  }

  /**
   * @dev Override mint, cannot mint token for the owner of contract
   */
  function mint(address _to, uint256 _amount) 
    onlyOwner canMint validDestination(_to) public returns (bool) 
  {
    return super.mint(_to, _amount);
  }

  /**
   * @dev enable transfer, after it is not possible to disable
   */
  function enableTransfer() external onlyOwner {
      transferEnabled = true;
  }

  /**
   * @dev Overrides ERC20 transfer function with modifier that prevents the
   * ability to transfer tokens until after transfers have been enabled.
   */
  function transfer(address _to, uint256 _value) 
    public onlyWhenTransferEnabled validDestination(_to) returns (bool) 
  {
      return super.transfer(_to, _value);
  }

  /**
   * @dev Overrides ERC20 transfer function with modifier that prevents the
   * ability to transfer tokens until after transfers have been enabled.
   */
  function transferFrom(address _from, address _to, uint256 _value) 
    public onlyWhenTransferEnabled validDestination(_to) returns (bool) 
  {
      return super.transferFrom(_from, _to, _value);
  } 
}
