
      module.exports = {
        solidity: {
          version: "0.8.17",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            },
            evmVersion: "paris",
            outputSelection: {
              "*": {
                "*": [
                  "abi",
                  "evm.bytecode",
                  "evm.deployedBytecode",
                  "evm.methodIdentifiers"
                ]
              }
            }
          }
        }
      };
    