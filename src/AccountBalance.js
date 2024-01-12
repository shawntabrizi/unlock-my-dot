import React, { useEffect, useState, createContext, useContext } from 'react';
import { useSubstrate } from './SubstrateContext';
import { useAccount } from './AccountContext';
import { hexToString } from '@polkadot/util';
import ProgressBar from 'react-bootstrap/ProgressBar';

const AccountBalanceContext = createContext();

const useAccountBalance = () => {
  const context = useContext(AccountBalanceContext);
  if (!context) {
    throw new Error(
      'useAccountBalance must be used within an AccountBalanceProvider'
    );
  }
  return context;
};

const AccountBalanceProvider = ({ children }) => {
  const { api } = useSubstrate();
  const { selectedAccount } = useAccount();
  const [balances, setBalances] = useState(null);
  const [tokenInfo, setTokenInfo] = useState({ name: 'UNITS', decimals: 12 });

  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        if (api) {
          const chainInfo = await api.registry.getChainProperties();
          setTokenInfo({
            name: chainInfo.tokenSymbol.value[0].toString(),
            decimals: chainInfo.tokenDecimals.value[0].toNumber(),
          });
        }
      } catch (error) {
        console.error('Error fetching token information:', error);
      }
    };

    const fetchBalances = async () => {
      try {
        if (api && selectedAccount) {
          const { address } = selectedAccount;
          // Subscribe to balance changes
          const unsubscribe = await api.derive.balances.all(
            address,
            (result) => {
              setBalances(result);
            }
          );

          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Error fetching account balances:', error);
      }
    };

    fetchTokenInfo();
    fetchBalances();
  }, [api, selectedAccount]);

  // Calculate the total balance
  const calculateTotalBalance = () => {
    if (balances) {
      const { freeBalance, reservedBalance } = balances;
      return freeBalance.add(reservedBalance);
    }
    return null;
  };

  const formattedBalance = (value) =>
    value !== null
      ? (parseFloat(value) / 10 ** tokenInfo.decimals).toFixed(4)
      : 'Loading Balance...';

  const formattedBalanceName = (value) =>
    value !== null
      ? `${(parseFloat(value) / 10 ** tokenInfo.decimals).toFixed(4)} ${
          tokenInfo.name
        }`
      : 'Loading Balance...';

  const formattedAddress = () => {
    if (selectedAccount !== null && selectedAccount.address !== null)
      if (api !== null) {
        // Format the address with proper SS58
        return api.createType('Address', selectedAccount.address).toString();
      }

    return 'Loading Address...';
  };

  return (
    <AccountBalanceContext.Provider
      value={{
        balances,
        setBalances,
        formattedAddress,
        formattedBalance,
        formattedBalanceName,
        calculateTotalBalance,
        tokenInfo,
      }}
    >
      {children}
    </AccountBalanceContext.Provider>
  );
};

const AccountBalance = () => {
  const {
    balances,
    formattedAddress,
    formattedBalance,
    calculateTotalBalance,
    tokenInfo,
  } = useAccountBalance();

  return (
    <div>
      {balances ? (
        <div>
          <h2>Your Overall Balance</h2>
          <p>
            <strong>Address:</strong> {formattedAddress()}
          </p>
          <div>
            <ProgressBar>
              <ProgressBar
                striped
                variant="success"
                now={balances.availableBalance}
                max={calculateTotalBalance()}
                label={formattedBalance(balances.availableBalance)}
                key={1}
              />
              <ProgressBar
                variant="warning"
                now={balances.lockedBalance}
                max={calculateTotalBalance()}
                label={formattedBalance(balances.lockedBalance)}
                key={2}
              />
              <ProgressBar
                variant="danger"
                now={balances.reservedBalance}
                max={calculateTotalBalance()}
                label={formattedBalance(balances.reservedBalance)}
                key={3}
              />
            </ProgressBar>
            <p>
              You have a total balance of{' '}
              {formattedBalance(calculateTotalBalance())} {tokenInfo.name}.
              <br />
              You can transfer {formattedBalance(
                balances?.availableBalance
              )}{' '}
              {tokenInfo.name} right now.
              <br />
              You cannot transfer{' '}
              {formattedBalance(
                balances.reservedBalance.add(balances.lockedBalance)
              )}{' '}
              {tokenInfo.name} because{' '}
              {formattedBalance(balances.reservedBalance)} {tokenInfo.name} is
              reserved, and {formattedBalance(balances.lockedBalance)}{' '}
              {tokenInfo.name} is locked.
              <br />
              You can use the information and buttons below to unlock your{' '}
              {tokenInfo.name}.
            </p>
            <details>
              <summary>Raw Balance Data</summary>
              <strong>Total Balance:</strong>{' '}
              {formattedBalance(calculateTotalBalance())} {tokenInfo.name}
              <ul>
                <li>
                  Reserved: {formattedBalance(balances?.reservedBalance)}{' '}
                  {tokenInfo.name}
                </li>
                <li>
                  Free: {formattedBalance(balances?.freeBalance)}{' '}
                  {tokenInfo.name}
                </li>
                <ul>
                  <li>
                    Locked: {formattedBalance(balances?.lockedBalance)}{' '}
                    {tokenInfo.name}
                    <ul>
                      {balances?.lockedBreakdown.map((item, i) => {
                        return (
                          <li key={i}>
                            {hexToString(item.id.toHex())}:{' '}
                            {formattedBalance(item.amount)} {tokenInfo.name}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                  <li>
                    Available: {formattedBalance(balances?.availableBalance)}{' '}
                    {tokenInfo.name}
                  </li>
                </ul>
              </ul>
              <p>
                Raw Data <br /> <code>{JSON.stringify(balances, null, 2)}</code>
              </p>
            </details>
          </div>
        </div>
      ) : (
        <p>No account selected.</p>
      )}
    </div>
  );
};

export { AccountBalance, AccountBalanceProvider, useAccountBalance };
