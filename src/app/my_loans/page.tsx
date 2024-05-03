"use client";
import initialNfts from "../constants/nfts.json";
import { useReadContracts, useAccount, useWriteContract } from "wagmi";
import protocol from "../constants/protocol.json";
import tokens from "../constants/tokens.json";
import { useEffect, useState } from "react";
import { Button, Card, Row, Table } from "antd";
import { toSU } from "../utils";

export default function MyLoans() {
  const { data: hash, writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const lenders = Object.keys(
    JSON.parse(localStorage.getItem("lenders") ?? "{}")
  );

  const acceptLoanOffer = async (
    nftAddress: string,
    nftTokenID: number,
    lender: string
  ) => {
    await writeContractAsync({
      address: protocol.protocol as `0x${string}`,
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "nft",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "lender",
              type: "address",
            },
          ],
          name: "acceptLoanOffer",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const,
      functionName: "acceptLoanOffer",
      args: [
        nftAddress as `0x${string}`,
        BigInt(nftTokenID),
        lender as `0x${string}`,
      ],
    });
  };

  const [loans, setLoans] = useState<
    {
      denom: { symbol: string; address: string; decimals: number } | undefined;
      address: string;
      tokenID: number;
      name: string;
      image: string;
      offers: {
        amount: string;
        interest: string;
        duration: string;
        lender: string;
      }[];
    }[]
  >([]);

  const [loanRequests, setLoanRequests] = useState<
    {
      denom: { symbol: string; address: string; decimals: number } | undefined;
      address: string;
      tokenID: number;
      name: string;
      image: string;
    }[]
  >([]);

  const loanOfferFetch = useReadContracts({
    contracts: loanRequests
      .flatMap((v) => lenders.map((k: string) => ({ ...v, lender: k })))
      .map((v) => ({
        address: protocol.protocol as `0x${string}`,
        abi: [
          {
            inputs: [
              {
                internalType: "address",
                name: "",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "",
                type: "uint256",
              },
              {
                internalType: "address",
                name: "",
                type: "address",
              },
              {
                internalType: "address",
                name: "",
                type: "address",
              },
            ],
            name: "loanOffers",
            outputs: [
              {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "interest",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "duration",
                type: "uint256",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "loanOffers",
        args: [v.address, v.tokenID, v.denom?.address, v.lender],
      })),
  });

  console.log(loanOfferFetch);

  const loanRequestsFetch = useReadContracts({
    contracts: initialNfts.map((v) => ({
      address: protocol.protocol as `0x${string}`,
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "loanRequests",
          outputs: [
            {
              internalType: "address",
              name: "borrower",
              type: "address",
            },
            {
              internalType: "address",
              name: "denomination",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "loanRequests",
      args: [v.address, v.tokenID],
    })),
  });

  useEffect(() => {
    if (loanRequestsFetch.status === "success" && address !== undefined) {
      const loanRequests = loanRequestsFetch.data.map((v) => v.result);
      const finalLoanRequests = initialNfts
        .map((v, i) => ({
          ...v,
          denom: tokens.find((x) => x.address === loanRequests[i]?.[1]),
          borrower: loanRequests[i]?.[0],
        }))
        .filter((v) => v.denom !== undefined && v.borrower === address);
      setLoanRequests(finalLoanRequests);
    }
  }, [loanRequestsFetch.status, address]);

  const columns = [
    {
      title: "Loan",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Interest",
      dataIndex: "interest",
      key: "interest",
    },
    {
      title: "Term",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "",
      dataIndex: "accept",
      key: "accept",
      render: (text: any, record: any, index: any) => (
        <Button
          onClick={() =>
            acceptLoanOffer(record.address, record.tokenID, record.lender)
          }
        >
          Accept
        </Button>
      ),
    },
  ];

  useEffect(() => {
    if (loanOfferFetch.status == "success") {
      const loanOffer = loanOfferFetch.data.map((v) => v.result);
      const loanInfo = loanRequests
        .flatMap((v) => lenders.map((k: string) => ({ ...v, lender: k })))
        .map((v, i) => ({
          ...v,
          amount: loanOffer[i]?.[0],
          interest: loanOffer[i]?.[1],
          duration: loanOffer[i]?.[2],
        }))
        .filter(
          (v) =>
            v.amount !== BigInt(0) ||
            v.interest !== BigInt(0) ||
            v.duration !== BigInt(0)
        );

      const loans: {
        denom:
          | { symbol: string; address: string; decimals: number }
          | undefined;
        address: string;
        tokenID: number;
        name: string;
        image: string;
        offers: {
          amount: string;
          interest: string;
          duration: string;
          lender: string;
        }[];
      }[] = [];

      for (let i in loanInfo) {
        const loanData = loanInfo[i];
        const index = loans.findIndex(
          (v) =>
            v.tokenID === loanData.tokenID && v.address === loanData.address
        );
        if (index >= 0) {
          loans[index].offers.push({
            amount:
              toSU(loanData.amount!, loanData.denom?.decimals!).toString() +
              ` ${loanData.denom?.symbol}`,
            interest:
              toSU(loanData.interest!, loanData.denom?.decimals!).toString() +
              ` ${loanData.denom?.symbol}`,
            duration: loanData.duration! + "s",
            lender: loanData.lender,
          });
        } else {
          loans.push({
            denom: loanData.denom,
            address: loanData.address,
            tokenID: loanData.tokenID,
            name: loanData.name,
            image: loanData.image,
            offers: [
              {
                amount:
                  toSU(loanData.amount!, loanData.denom?.decimals!).toString() +
                  ` ${loanData.denom?.symbol}`,
                interest:
                  toSU(
                    loanData.interest!,
                    loanData.denom?.decimals!
                  ).toString() + ` ${loanData.denom?.symbol}`,
                duration: loanData.duration! + "s",
                lender: loanData.lender,
              },
            ],
          });
        }
      }

      setLoans(loans);
    }
  }, [loanOfferFetch.status]);

  return (
    <div>
      {/* <Row gutter={[16, 16]}> */}
      {loans.map((v, i) => (
        <div className="flex flex-row">
          <Card title={`${v.name} #${v.tokenID}`} style={{ width: 300 }}>
            <img src={v.image} />
          </Card>
          <Table
            dataSource={v.offers.map((k, i) => ({
              ...k,
              address: v.address,
              tokenID: v.tokenID,
              key: i,
            }))}
            columns={columns}
            pagination={false}
          />
        </div>
      ))}
      {/* </Row> */}
    </div>
  );
}
