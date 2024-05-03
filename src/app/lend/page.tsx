"use client";
import { Card, InputNumber, Modal, Row } from "antd";
import initialNfts from "../constants/nfts.json";
import tokens from "../constants/tokens.json";
import protocol from "../constants/protocol.json";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { useEffect, useState } from "react";

export default function Lend() {
  const { data: hash, writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const [selectedRequest, setSelectedRequest] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [loanTerm, setLoanTerm] = useState<{
    amount: string;
    interest: string;
    duration: string;
  }>({
    amount: "0",
    interest: "0",
    duration: "0",
  });
  const [loanRequests, setLoanRequests] = useState<
    {
      denom: { symbol: string; address: string; decimals: number } | undefined;
      address: string;
      tokenID: number;
      name: string;
      image: string;
    }[]
  >([]);

  const tokenBal = useReadContract({
    address: loanRequests[selectedRequest]?.denom?.address as `0x${string}`,
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "balanceOf",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
  });

  const offerLoan = async () => {
    const decimals = loanRequests[selectedRequest].denom?.decimals;
    const amount = Number(loanTerm.amount) * 10 ** (decimals ?? 18);
    const interest = Number(loanTerm.interest) * 10 ** (decimals ?? 18);
    const duration = Number(loanTerm.duration);

    await writeContractAsync({
      address: loanRequests[selectedRequest].denom?.address! as `0x${string}`,
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "spender",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "approve",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const,
      functionName: "approve",
      args: [protocol.protocol as `0x${string}`, BigInt(amount)],
    });

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
          name: "offerLoan",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const,
      functionName: "offerLoan",
      args: [
        loanRequests[selectedRequest].address as `0x${string}`,
        BigInt(loanRequests[selectedRequest].tokenID),
        BigInt(amount),
        BigInt(interest),
        BigInt(duration),
      ],
    });

    const storedLenders = JSON.parse(localStorage.getItem("lenders") ?? "{}");
    storedLenders[address!] = true;
    localStorage.setItem("lenders", JSON.stringify(storedLenders));
  };

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
    if (loanRequestsFetch.status === "success") {
      const loanRequests = loanRequestsFetch.data.map((v) => v.result);
      const finalLoanRequests = initialNfts
        .map((v, i) => ({
          ...v,
          denom: tokens.find((x) => x.address === loanRequests[i]?.[1]),
        }))
        .filter((v) => v.denom !== undefined);
      setLoanRequests(finalLoanRequests);
    }
  }, [loanRequestsFetch.status]);

  return (
    <>
      <Modal
        open={openModal}
        title={`Offer ${loanRequests[selectedRequest]?.denom?.symbol} loan for ${loanRequests[selectedRequest]?.name} #${loanRequests[selectedRequest]?.tokenID}`}
        onOk={() => offerLoan().then((_) => setOpenModal(false))}
        // confirmLoading={confirmLoading}
        onCancel={() => setOpenModal(false)}
      >
        <div className="pb-3 pt-3">
          <span className="pr-3">
            Loan amount in {loanRequests[selectedRequest]?.denom?.symbol}
          </span>
          <InputNumber<string>
            style={{ width: 200 }}
            // defaultValue="1"
            min="0"
            // step="0.00000000000001"
            onChange={(value) =>
              setLoanTerm((v) => ({ ...v, amount: value ?? "0" }))
            }
            stringMode
          />
        </div>
        <div className="pb-3">
          <span className="pr-3">
            Interest expected in {loanRequests[selectedRequest]?.denom?.symbol}
          </span>
          <InputNumber<string>
            style={{ width: 200 }}
            min="0"
            // step="0"
            onChange={(value) =>
              setLoanTerm((v) => ({ ...v, interest: value ?? "0" }))
            }
            stringMode
          />
        </div>
        <div className="pb-3">
          <span className="pr-3">Loan term in seconds</span>
          <InputNumber
            style={{ width: 200 }}
            min="0"
            step="1"
            onChange={(value) =>
              setLoanTerm((v) => ({ ...v, duration: value ?? "0" }))
            }
          />
        </div>
      </Modal>
      <div>
        <Row gutter={[16, 16]}>
          {loanRequests.map((v, i) => (
            <Card
              title={`${v.name} #${v.tokenID}`}
              extra={
                <a onClick={() => (setSelectedRequest(i), setOpenModal(true))}>
                  Offer {v.denom?.symbol}
                </a>
              }
              style={{ width: 300 }}
            >
              <img src={v.image} />
              <p></p>
            </Card>
          ))}
        </Row>
      </div>
    </>
  );
}
