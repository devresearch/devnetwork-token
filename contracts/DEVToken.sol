pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract DEVToken is StandardToken, BurnableToken, Ownable {
  using SafeMath for uint256;

  // Constants
  string public  name = "DEVToken";
  string public  symbol = "DEV";
  uint8  public  decimals = 18;
  uint256 public constant INITIAL_SUPPLY = 400000000 * (10 ** uint256(decimals));

  bool    public transferEnabled = false; // indicates that tokens can transfer or not
  uint256 public transferTimeLockedStart;
  uint256 public transferTimeLockedEnd;
  uint256 public spreadTokenAmount;
  
  address public foundation;
  address public bounty;

  // Modifiers
  modifier validDestination(address _to) {
    require(_to != address(0x0));
    require(_to != address(this));
    require(_to != owner);
    _;
  }

  function DEVToken(address _foundation,
    address _bounty, 
    uint256 _transferTimeLockedStart, 
    uint256 _transferTimeLockedEnd) public 
  {
    totalSupply_ = INITIAL_SUPPLY;

    // mint token
    balances[msg.sender] = INITIAL_SUPPLY;
    Transfer(address(0x0), msg.sender, INITIAL_SUPPLY);

    foundation = _foundation;
    bounty = _bounty;

    transferTimeLockedStart = _transferTimeLockedStart;
    transferTimeLockedEnd = _transferTimeLockedEnd;
  }

  /**
   * @dev Method for spreading devnetwork token to many addresses
   * @param _to multiple address for sending token to
   * @param _valueInWei amounts of devnetwork token in wei 
   */
  function spreadTokenAddresses(address[] _to, uint256[] _valueInWei) 
    public onlyOwner 
  {
    for (uint256 i = 0 ; i < _to.length ; i++) {
      spreadToken(_to[i], _valueInWei[i]);
    }
  }

  /**
   * @dev Method for spreading devnetwork token to many addresses
   * @param _to address for sending token to
   * @param _valueInWei amount of devnetwork token in wei 
   */
  function spreadToken(address _to, uint256 _valueInWei) 
    public onlyOwner validDestination(_to) 
  {
    spreadTokenAmount = spreadTokenAmount.add(_valueInWei);

    require(spreadTokenAmount <= totalSupply_);
    require(spreadTokenAmount <= balances[msg.sender]);

    balances[_to] = balances[_to].add(_valueInWei);
    balances[msg.sender] = balances[msg.sender].sub(_valueInWei);
    Transfer(msg.sender, _to, _valueInWei);
  }

  /**
   * @dev Enable transfer, and it is not possible to disable transfer again
   */
  function enableTransfer() external onlyOwner {
    transferEnabled = true;
  }

  /**
   * @dev Overrides ERC20 transfer function with modifier that prevents the
   * ability to transfer tokens until after transfers have been enabled.
   */
  function transfer(address _to, uint256 _value) 
    public validDestination(_to) returns (bool) 
  {
    require(transferEnabled);
    if (_from == foundation) {
      require(now >= transferTimeLockedEnd);
    }
    return super.transfer(_to, _value);
  }

  /**
   * @dev Overrides ERC20 transfer function with modifier that prevents the
   * ability to transfer tokens until after transfers have been enabled.
   */
  function transferFrom(address _from, address _to, uint256 _value) 
    public validDestination(_to) returns (bool) 
  {
    require(transferEnabled);
    if (_from == foundation) {
      require(now >= transferTimeLockedEnd);
    }
    return super.transferFrom(_from, _to, _value);
  } 

  /**
    * Overrides the burn function so that it cannot be called until after
    * transfers have been enabled.
    * @param _value    The amount of devnetwork tokens in wei
    */
  function burn(uint256 _value) public {
    require(transferEnabled || msg.sender == owner);
    super.burn(_value);
  }
}
