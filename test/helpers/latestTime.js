// Copyright (c) 2018 Devnetwork
// license that can be found in the LICENSE file.

// Returns the time of the last mined block in seconds
export default function latestTime () {
  return web3.eth.getBlock('latest').timestamp;
}
