export const toSU = (amount: bigint, decimals: number) => {
  return amount / BigInt(10 ** decimals);
};
